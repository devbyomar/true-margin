import type { JobMarginInput, MarginResult, MarginStatus, TaxBreakdown } from "@/types";

/**
 * Calculate margin metrics for a job.
 * Pure function — no side effects, fully deterministic.
 */
export function calculateMargin(input: JobMarginInput): MarginResult {
  const {
    contractValue,
    estimatedLabourHours,
    labourRate,
    estimatedMaterials,
    estimatedSubcontractor,
    overheadRate,
    actualCost,
  } = input;

  // Estimated cost (before overhead)
  const estimatedDirectCost =
    estimatedLabourHours * labourRate +
    estimatedMaterials +
    estimatedSubcontractor;

  // Add overhead
  const estimatedOverhead = estimatedDirectCost * (overheadRate / 100);
  const estimatedCost = estimatedDirectCost + estimatedOverhead;

  // Estimated margin
  const estimatedGrossProfit = contractValue - estimatedCost;
  const estimatedMarginPct =
    contractValue > 0
      ? (estimatedGrossProfit / contractValue) * 100
      : 0;

  // Actual margin
  const actualGrossProfit = contractValue - actualCost;
  const actualMarginPct =
    contractValue > 0
      ? (actualGrossProfit / contractValue) * 100
      : 0;

  // Variance (negative = over budget)
  const varianceDollar = estimatedCost - actualCost;
  const variancePct = estimatedMarginPct - actualMarginPct;

  // Status determination
  const marginDiff = estimatedMarginPct - actualMarginPct;
  let status: MarginStatus;

  if (marginDiff <= 5) {
    status = "on_track";
  } else if (marginDiff <= 15) {
    status = "at_risk";
  } else {
    status = "over_budget";
  }

  return {
    estimatedCost: round2(estimatedCost),
    estimatedGrossProfit: round2(estimatedGrossProfit),
    estimatedMarginPct: round2(estimatedMarginPct),
    actualCost: round2(actualCost),
    actualGrossProfit: round2(actualGrossProfit),
    actualMarginPct: round2(actualMarginPct),
    varianceDollar: round2(varianceDollar),
    variancePct: round2(variancePct),
    status,
  };
}

/**
 * Provincial tax rates (combined GST/HST/PST).
 * Returns the total tax percentage for a given Canadian province code.
 */
export function getProvincialTaxRate(province: string): number {
  const rates: Record<string, number> = {
    AB: 5,
    BC: 12,
    MB: 12,
    NB: 15,
    NL: 15,
    NS: 15,
    NT: 5,
    NU: 5,
    ON: 13,
    PE: 15,
    QC: 14.975,
    SK: 11,
    YT: 5,
  };

  return rates[province.toUpperCase()] ?? 5; // Default to federal GST only
}

/**
 * Apply provincial tax to an amount.
 */
export function applyTax(amount: number, province: string): TaxBreakdown {
  const rate = getProvincialTaxRate(province);
  const tax = amount * (rate / 100);

  return {
    subtotal: round2(amount),
    tax: round2(tax),
    total: round2(amount + tax),
  };
}

/** Round to 2 decimal places */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
