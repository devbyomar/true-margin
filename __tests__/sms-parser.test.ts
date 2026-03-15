import { describe, it, expect } from "vitest";
import { parseSmsEntry, extractJobCode, isHelpCommand, parseTimeCommand } from "@/lib/sms-parser";

// ============================================================
// SMS Parser — Unit Tests
// Covers all input examples from the spec + edge cases
// ============================================================

describe("parseSmsEntry", () => {
  const DEFAULT_RATE = 85;

  // ---- Materials ----
  describe("materials parsing", () => {
    it('parses "materials 340 copper pipe fittings"', () => {
      const result = parseSmsEntry("materials 340 copper pipe fittings", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("materials");
      expect(result!.amount).toBe(340);
      expect(result!.description).toContain("copper pipe fittings");
      expect(result!.confidence).toBe("high");
    });

    it('parses "mat $127.50 drywall"', () => {
      const result = parseSmsEntry("mat $127.50 drywall", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("materials");
      expect(result!.amount).toBe(127.5);
      expect(result!.description).toContain("drywall");
      expect(result!.confidence).toBe("high");
    });

    it('parses "mats 950 insulation"', () => {
      const result = parseSmsEntry("mats 950 insulation", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("materials");
      expect(result!.amount).toBe(950);
      expect(result!.confidence).toBe("high");
    });
  });

  // ---- Labour ----
  describe("labour parsing", () => {
    it('parses "labour 4hrs"', () => {
      const result = parseSmsEntry("labour 4hrs", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("labour");
      expect(result!.amount).toBe(4 * DEFAULT_RATE); // 340
      expect(result!.description).toBe("4 hours labour");
      expect(result!.confidence).toBe("high");
    });

    it('parses "labor 3.5 hours"', () => {
      const result = parseSmsEntry("labor 3.5 hours", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("labour");
      expect(result!.amount).toBe(3.5 * DEFAULT_RATE); // 297.50
      expect(result!.description).toBe("3.5 hours labour");
      expect(result!.confidence).toBe("high");
    });

    it('parses "labour 8hr"', () => {
      const result = parseSmsEntry("labour 8hr", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("labour");
      expect(result!.amount).toBe(8 * DEFAULT_RATE);
      expect(result!.description).toBe("8 hours labour");
    });

    it("uses custom labour rate", () => {
      const result = parseSmsEntry("labour 4hrs", 95);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(4 * 95); // 380
    });
  });

  // ---- Subcontractor ----
  describe("subcontractor parsing", () => {
    it('parses "sub 850 electrical rough in"', () => {
      const result = parseSmsEntry("sub 850 electrical rough in", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("subcontractor");
      expect(result!.amount).toBe(850);
      expect(result!.description).toContain("electrical rough in");
      expect(result!.confidence).toBe("high");
    });

    it('parses "subcontractor $2400 plumbing"', () => {
      const result = parseSmsEntry("subcontractor $2400 plumbing", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("subcontractor");
      expect(result!.amount).toBe(2400);
    });
  });

  // ---- Equipment ----
  describe("equipment parsing", () => {
    it('parses "equip 200 equipment rental"', () => {
      const result = parseSmsEntry("equip 200 equipment rental", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("equipment");
      expect(result!.amount).toBe(200);
      expect(result!.confidence).toBe("high");
    });

    it('parses "equipment $350 crane"', () => {
      const result = parseSmsEntry("equipment $350 crane", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("equipment");
      expect(result!.amount).toBe(350);
    });
  });

  // ---- Unknown category (low confidence) ----
  describe("unknown category", () => {
    it('parses "245 misc supplies" as other with low confidence', () => {
      const result = parseSmsEntry("245 misc supplies", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("other");
      expect(result!.amount).toBe(245);
      expect(result!.description).toContain("misc supplies");
      expect(result!.confidence).toBe("low");
    });

    it('parses "$500 permit fee" as other with low confidence', () => {
      const result = parseSmsEntry("$500 permit fee", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("other");
      expect(result!.amount).toBe(500);
      expect(result!.confidence).toBe("low");
    });
  });

  // ---- With job code prefix ----
  describe("with job code prefix", () => {
    it('parses "JOB-4821 materials 340 copper pipe"', () => {
      const result = parseSmsEntry("JOB-4821 materials 340 copper pipe", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("materials");
      expect(result!.amount).toBe(340);
    });

    it('parses "JOB-A1B2 labour 8hrs"', () => {
      const result = parseSmsEntry("JOB-A1B2 labour 8hrs", DEFAULT_RATE);
      expect(result).not.toBeNull();
      expect(result!.category).toBe("labour");
      expect(result!.amount).toBe(8 * DEFAULT_RATE);
    });
  });

  // ---- Non-parseable / commands ----
  describe("non-parseable messages", () => {
    it('returns null for "done"', () => {
      expect(parseSmsEntry("done", DEFAULT_RATE)).toBeNull();
    });

    it('returns null for "complete"', () => {
      expect(parseSmsEntry("complete", DEFAULT_RATE)).toBeNull();
    });

    it('returns null for "help"', () => {
      expect(parseSmsEntry("help", DEFAULT_RATE)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseSmsEntry("", DEFAULT_RATE)).toBeNull();
    });

    it("returns null for whitespace only", () => {
      expect(parseSmsEntry("   ", DEFAULT_RATE)).toBeNull();
    });

    it('returns null for "on my way"', () => {
      // No dollar amount → returns null
      expect(parseSmsEntry("on my way", DEFAULT_RATE)).toBeNull();
    });
  });
});

describe("extractJobCode", () => {
  it("extracts JOB-4821 from message", () => {
    expect(extractJobCode("JOB-4821 materials 340 copper")).toBe("JOB-4821");
  });

  it("extracts JOB-A1B2 (uppercase)", () => {
    expect(extractJobCode("job-a1b2 labour 8hrs")).toBe("JOB-A1B2");
  });

  it("extracts job code from middle of message", () => {
    expect(extractJobCode("materials JOB-XY99 340 pipe")).toBe("JOB-XY99");
  });

  it("returns null when no job code present", () => {
    expect(extractJobCode("materials 340 copper pipe")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractJobCode("")).toBeNull();
  });
});

describe("isHelpCommand", () => {
  it('recognises "help" (lowercase)', () => {
    expect(isHelpCommand("help")).toBe(true);
  });

  it('recognises "HELP" (uppercase)', () => {
    expect(isHelpCommand("HELP")).toBe(true);
  });

  it('recognises "Help" (mixed case)', () => {
    expect(isHelpCommand("Help")).toBe(true);
  });

  it("trims whitespace", () => {
    expect(isHelpCommand("  help  ")).toBe(true);
  });

  it("rejects non-help text", () => {
    expect(isHelpCommand("materials 340")).toBe(false);
  });

  it("rejects partial help in longer string", () => {
    expect(isHelpCommand("need help with this")).toBe(false);
  });
});

// ============================================================
// Time Tracking Commands
// ============================================================

describe("parseTimeCommand", () => {
  // ---- Start commands ----
  describe("start / clock-in commands", () => {
    it('parses "start"', () => {
      const result = parseTimeCommand("start");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("start");
      expect(result!.jobCode).toBeNull();
      expect(result!.notes).toBeNull();
    });

    it('parses "clock in"', () => {
      const result = parseTimeCommand("clock in");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("start");
    });

    it('parses "clockin" (no space)', () => {
      const result = parseTimeCommand("clockin");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("start");
    });

    it('parses "begin"', () => {
      const result = parseTimeCommand("begin");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("start");
    });

    it('parses "punch in"', () => {
      const result = parseTimeCommand("punch in");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("start");
    });

    it('parses "START" (case insensitive)', () => {
      const result = parseTimeCommand("START");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("start");
    });

    it('parses "JOB-A1B2 start" (with job code)', () => {
      const result = parseTimeCommand("JOB-A1B2 start");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("start");
      expect(result!.jobCode).toBe("JOB-A1B2");
    });

    it('parses "start installing ductwork" (with notes)', () => {
      const result = parseTimeCommand("start installing ductwork");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("start");
      expect(result!.notes).toBe("installing ductwork");
    });

    it('parses "JOB-X4Y9 start framing upstairs" (job code + notes)', () => {
      const result = parseTimeCommand("JOB-X4Y9 start framing upstairs");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("start");
      expect(result!.jobCode).toBe("JOB-X4Y9");
      expect(result!.notes).toBe("framing upstairs");
    });
  });

  // ---- Stop commands ----
  describe("stop / clock-out commands", () => {
    it('parses "stop"', () => {
      const result = parseTimeCommand("stop");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("stop");
    });

    it('parses "clock out"', () => {
      const result = parseTimeCommand("clock out");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("stop");
    });

    it('parses "end"', () => {
      const result = parseTimeCommand("end");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("stop");
    });

    it('parses "done"', () => {
      const result = parseTimeCommand("done");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("stop");
    });

    it('parses "punch out"', () => {
      const result = parseTimeCommand("punch out");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("stop");
    });

    it('parses "JOB-A1B2 stop" (with job code)', () => {
      const result = parseTimeCommand("JOB-A1B2 stop");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("stop");
      expect(result!.jobCode).toBe("JOB-A1B2");
    });

    it('parses "stop finished rough-in" (with notes)', () => {
      const result = parseTimeCommand("stop finished rough-in");
      expect(result).not.toBeNull();
      expect(result!.command).toBe("stop");
      expect(result!.notes).toBe("finished rough-in");
    });
  });

  // ---- Non-time-commands ----
  describe("non-time-tracking messages", () => {
    it("returns null for cost entries", () => {
      expect(parseTimeCommand("materials 340 copper pipe")).toBeNull();
    });

    it("returns null for help", () => {
      expect(parseTimeCommand("help")).toBeNull();
    });

    it("returns null for random text", () => {
      expect(parseTimeCommand("hey what's up")).toBeNull();
    });

    it("returns null for amounts", () => {
      expect(parseTimeCommand("$340")).toBeNull();
    });
  });
});

// ============================================================
// parseSmsEntry does NOT match time tracking commands
// ============================================================

describe("parseSmsEntry vs time commands", () => {
  const DEFAULT_RATE = 85;

  it('does not parse "start" as a cost entry', () => {
    expect(parseSmsEntry("start", DEFAULT_RATE)).toBeNull();
  });

  it('does not parse "stop" as a cost entry', () => {
    expect(parseSmsEntry("stop", DEFAULT_RATE)).toBeNull();
  });

  it('does not parse "clock in" as a cost entry', () => {
    expect(parseSmsEntry("clock in", DEFAULT_RATE)).toBeNull();
  });

  it('does not parse "JOB-A1B2 start" as a cost entry', () => {
    expect(parseSmsEntry("JOB-A1B2 start", DEFAULT_RATE)).toBeNull();
  });

  it('does not parse "done" as a cost entry', () => {
    expect(parseSmsEntry("done", DEFAULT_RATE)).toBeNull();
  });
});
