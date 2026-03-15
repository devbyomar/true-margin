import type { ParsedCostEntry, CostCategory, ParsedTimeCommand } from "@/types";

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
const COMMANDS = /^(done|complete|finished|status)$/i;

// Time tracking commands
const TIME_START = /^(start|clock\s*in|begin|punch\s*in)$/i;
const TIME_STOP = /^(stop|clock\s*out|end|punch\s*out|done)$/i;

// Help command — handled separately
const HELP_COMMAND = /^help$/i;

/**
 * Check if a message is a HELP command.
 */
export function isHelpCommand(text: string): boolean {
  return HELP_COMMAND.test(text.trim());
}

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

  // Skip if it's a time tracking command
  if (parseTimeCommand(trimmed) !== null) {
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

/**
 * Check if a message is a time tracking command (start/stop).
 * Returns null if not a time command.
 */
export function parseTimeCommand(text: string): ParsedTimeCommand | null {
  const trimmed = text.trim();

  // Remove job code prefix if present
  const jobCode = extractJobCode(trimmed);
  const withoutJobCode = trimmed.replace(/^JOB-[A-Z0-9]{4}\s*/i, "").trim();

  // Check for stop first (since "done" could be either)
  if (TIME_STOP.test(withoutJobCode)) {
    return { command: "stop", jobCode, notes: null };
  }

  // Check for start
  if (TIME_START.test(withoutJobCode)) {
    return { command: "start", jobCode, notes: null };
  }

  // Check for start/stop with notes: "start installing ductwork"
  const startWithNotes = withoutJobCode.match(
    /^(?:start|clock\s*in|begin|punch\s*in)\s+(.+)$/i
  );
  if (startWithNotes?.[1]) {
    return { command: "start", jobCode, notes: startWithNotes[1].trim() };
  }

  const stopWithNotes = withoutJobCode.match(
    /^(?:stop|clock\s*out|end|punch\s*out|done)\s+(.+)$/i
  );
  if (stopWithNotes?.[1]) {
    return { command: "stop", jobCode, notes: stopWithNotes[1].trim() };
  }

  return null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
