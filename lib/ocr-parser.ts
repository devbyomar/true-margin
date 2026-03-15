import OpenAI from "openai";
import type { DocumentScanLineItem, CostCategory } from "@/types";

const VALID_CATEGORIES: CostCategory[] = [
  "labour",
  "materials",
  "subcontractor",
  "equipment",
  "other",
];

const SYSTEM_PROMPT = `You are an invoice/receipt parser for a Canadian construction and trades company.
Your job is to extract line items from invoices, receipts, and purchase orders.

For each line item, determine:
1. category: one of "labour", "materials", "subcontractor", "equipment", "other"
2. description: a brief description of the item
3. amount: the dollar amount (CAD) as a number
4. confidence: "high" if you're very sure about the extraction, "low" if the text is unclear

Rules:
- Extract ALL individual line items, not just totals
- If there's a total but no individual items, return the total as a single line item
- Do NOT include tax amounts as separate line items
- Do NOT include totals if individual line items are present
- Amounts should be numbers without currency symbols
- For materials/supplies stores (Home Depot, RONA, etc.), categorize as "materials"
- For equipment rental, categorize as "equipment"
- For subcontractor invoices, categorize as "subcontractor"
- If you cannot determine the category, use "other" with confidence "low"

Also provide the raw text you can read from the document.

Respond ONLY with valid JSON in this exact format:
{
  "rawText": "the full text you can read from the document",
  "lineItems": [
    {
      "category": "materials",
      "description": "Copper pipe fittings 3/4 inch",
      "amount": 45.99,
      "confidence": "high"
    }
  ]
}`;

/**
 * Extract line items from an invoice image or PDF using GPT-4o.
 * - Images (JPG/PNG/WebP): sent as vision image_url
 * - PDFs: uploaded via Files API then sent as file reference
 */
export async function extractLineItemsFromImage(
  imageUrl: string,
  fileBuffer?: Buffer,
  mimeType?: string
): Promise<{
  lineItems: DocumentScanLineItem[];
  rawText: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const openai = new OpenAI({ apiKey });

  // If a raw file buffer is provided and it's a PDF, use the Files API
  if (fileBuffer && mimeType === "application/pdf") {
    return extractFromPdf(openai, fileBuffer);
  }

  // Otherwise use Vision (image URL or data URI)
  return extractFromImageUrl(openai, imageUrl);
}

/**
 * Send a PDF to GPT-4o using the OpenAI Files API for text extraction.
 */
async function extractFromPdf(
  openai: OpenAI,
  pdfBuffer: Buffer
): Promise<{ lineItems: DocumentScanLineItem[]; rawText: string }> {
  // Convert Buffer to a plain ArrayBuffer to satisfy TypeScript
  const arrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength
  ) as ArrayBuffer;

  // Upload PDF to OpenAI Files API
  const file = await openai.files.create({
    file: new File([arrayBuffer], "invoice.pdf", { type: "application/pdf" }),
    purpose: "assistants",
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all line items from this PDF invoice/receipt. File ID: ${file.id}. Return JSON only.`,
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    return parseOcrResponse(content);
  } finally {
    // Clean up the uploaded file
    await openai.files.delete(file.id).catch(() => null);
  }
}

/**
 * Send an image URL or data URI to GPT-4o Vision.
 */
async function extractFromImageUrl(
  openai: OpenAI,
  imageUrl: string
): Promise<{ lineItems: DocumentScanLineItem[]; rawText: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all line items from this invoice/receipt. Return JSON only.",
          },
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "high" },
          },
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content?.trim() ?? "";
  return parseOcrResponse(content);
}

/**
 * Parse the OCR response JSON and validate/normalize line items.
 */
function parseOcrResponse(content: string): {
  lineItems: DocumentScanLineItem[];
  rawText: string;
} {
  // Try to extract JSON from the response (may be wrapped in markdown code blocks)
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch?.[1]) {
    jsonStr = jsonMatch[1].trim();
  }

  let parsed: {
    rawText?: string;
    lineItems?: Array<{
      category?: string;
      description?: string;
      amount?: number | string;
      confidence?: string;
    }>;
  };

  try {
    parsed = JSON.parse(jsonStr) as typeof parsed;
  } catch {
    return { lineItems: [], rawText: content };
  }

  const rawText = typeof parsed.rawText === "string" ? parsed.rawText : content;

  if (!Array.isArray(parsed.lineItems)) {
    return { lineItems: [], rawText };
  }

  const lineItems: DocumentScanLineItem[] = [];

  for (const item of parsed.lineItems) {
    const amount =
      typeof item.amount === "number"
        ? item.amount
        : typeof item.amount === "string"
          ? parseFloat(item.amount)
          : NaN;

    if (isNaN(amount) || amount <= 0) continue;

    const category: CostCategory = VALID_CATEGORIES.includes(
      item.category as CostCategory
    )
      ? (item.category as CostCategory)
      : "other";

    const confidence: "high" | "low" =
      item.confidence === "low" ? "low" : "high";

    // If category had to be forced to "other", lower confidence
    const finalConfidence =
      category === "other" && item.category !== "other" ? "low" : confidence;

    lineItems.push({
      category,
      description:
        typeof item.description === "string" && item.description.trim()
          ? item.description.trim()
          : "Unidentified item",
      amount: Math.round(amount * 100) / 100,
      confidence: finalConfidence,
    });
  }

  return { lineItems, rawText };
}

/**
 * Validate a base64 image or URL for OCR processing.
 */
export function validateImageInput(input: string): boolean {
  // Accept data URIs
  if (input.startsWith("data:image/")) return true;
  // Accept HTTP(S) URLs
  if (input.startsWith("http://") || input.startsWith("https://")) return true;
  return false;
}
