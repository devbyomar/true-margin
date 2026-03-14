import type { ParsedCostEntry, CostCategory } from "@/types";

// Category keyword mappings
const CATEGORY_KEYWORDS: ReadonlyArray<{
  category: CostCategory;
  patterns: ReadonlyArray<RegExp>;
}> = [
  {
    category: "labour",
    patterns: [/^labou?r/i, /^lab\b/i],
  },
  {
    category: "materials",
    patterns: [/^materials?/i, /^mat\b/i, /^mats\b/i],
  },
  {
    category: "subcontractor",
    patterns: [/^subcontractor/i, /^sub\b/i, /^subs\b/i],
  },
  {
    category: "equipment",
    patterns: [/^equip(?:ment)?/i],
  },
];

// Commands that are NOT cost entries
const COMMANDS = /^(done|complete|finished|help|status|stop)$/i;

/**
 * Parse a free-text SMS message into a structured cost entry.
 * Returns null if the message is not parseable as a cost entry.
 */
export function parseSmsEntry(
  text: string,
  jobLabourRate: number
): ParsedCostEntry | null {
  const trimmed = text.trim();

  if (!trimmed || COMMANDS.test(trimmed)) {
    return null;
  }

  // Remove job code prefix if present (e.g., "JOB-4821 materials 340 copper pipe")
  const withoutJobCode = trimmed.replace(/^JOB-[A-Z0-9]{4}\s+/i, "");

  // Try to identify the category from the first word
  const words = withoutJobCode.split(/\s+/);
  const firstWord = words[0];

  if (!firstWord) {
    return null;
  }

  let category: CostCategory | null = null;
  let remaining = withoutJobCode;

  for (const mapping of CATEGORY_KEYWORDS) {
    for (const pattern of mapping.patterns) {
      if (pattern.test(firstWord)) {
        category = mapping.category;
        remaining = words.slice(1).join(" ");
        break;
      }
    }
    if (category) break;
  }

  // Handle labour with hours (e.g., "labour 4hrs", "labor 3.5 hours")
  if (category === "labour") {
    const hoursMatch = remaining.match(
      /^\$?(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)/i
    );
    if (hoursMatch && hoursMatch[1]) {
      const hours = parseFloat(hoursMatch[1]);
      return {
        category: "labour",
        amount: round2(hours * jobLabourRate),
        description: `${hours} hours labour`,
        confidence: "high",
      };
    }
  }

  // Extract dollar amount from remaining text
  const amountMatch = remaining.match(/\$?(\d+(?:\.\d{1,2})?)/);
  if (!amountMatch || !amountMatch[1]) {
    return null;
  }

  const amount = parseFloat(amountMatch[1]);
  if (amount <= 0 || isNaN(amount)) {
    return null;
  }

  // Extract description (everything except the amount)
  const description = remaining
    .replace(/\$?\d+(?:\.\d{1,2})?/, "")
    .trim();

  // If no category was identified, mark as "other" with low confidence
  if (!category) {
    return {
      category: "other",
      amount: round2(amount),
      description: description || "misc expense",
      confidence: "low",
    };
  }

  return {
    category,
    amount: round2(amount),
    description: description || category,
    confidence: "high",
  };
}

/**
 * Extract job code from SMS text if present.
 * Returns null if no job code found.
 */
export function extractJobCode(text: string): string | null {
  const match = text.match(/\bJOB-([A-Z0-9]{4})\b/i);
  return match ? `JOB-${match[1]!.toUpperCase()}` : null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
