import { describe, it, expect } from "vitest";
import {
  calculateMargin,
  getProvincialTaxRate,
  applyTax,
} from "@/lib/margin-calculator";

describe("calculateMargin", () => {
  it("calculates correct margin for a profitable job", () => {
    const result = calculateMargin({
      contractValue: 10000,
      estimatedLabourHours: 40,
      labourRate: 85,
      estimatedMaterials: 2000,
      estimatedSubcontractor: 500,
      overheadRate: 15,
      actualCost: 6000,
    });

    // Labour: 40 * 85 = 3400
    // Direct: 3400 + 2000 + 500 = 5900
    // Overhead: 5900 * 0.15 = 885
    // Estimated cost: 5900 + 885 = 6785
    expect(result.estimatedCost).toBe(6785);
    expect(result.estimatedGrossProfit).toBe(3215);
    expect(result.estimatedMarginPct).toBe(32.15);
    expect(result.actualCost).toBe(6000);
    expect(result.actualGrossProfit).toBe(4000);
    expect(result.actualMarginPct).toBe(40);
    expect(result.status).toBe("on_track");
  });

  it("returns on_track when actual margin is within 5% of estimated", () => {
    const result = calculateMargin({
      contractValue: 10000,
      estimatedLabourHours: 20,
      labourRate: 100,
      estimatedMaterials: 3000,
      estimatedSubcontractor: 0,
      overheadRate: 0,
      actualCost: 5200,
    });

    // Estimated cost: 2000 + 3000 = 5000
    // Estimated margin: 50%
    // Actual margin: 48%
    // Diff: 2% → on_track
    expect(result.status).toBe("on_track");
  });

  it("returns at_risk when actual margin is 5-15% below estimated", () => {
    const result = calculateMargin({
      contractValue: 10000,
      estimatedLabourHours: 20,
      labourRate: 100,
      estimatedMaterials: 3000,
      estimatedSubcontractor: 0,
      overheadRate: 0,
      actualCost: 6000,
    });

    // Estimated cost: 5000, margin: 50%
    // Actual cost: 6000, margin: 40%
    // Diff: 10% → at_risk
    expect(result.status).toBe("at_risk");
  });

  it("returns over_budget when actual margin is >15% below estimated", () => {
    const result = calculateMargin({
      contractValue: 10000,
      estimatedLabourHours: 20,
      labourRate: 100,
      estimatedMaterials: 3000,
      estimatedSubcontractor: 0,
      overheadRate: 0,
      actualCost: 8000,
    });

    // Estimated cost: 5000, margin: 50%
    // Actual cost: 8000, margin: 20%
    // Diff: 30% → over_budget
    expect(result.status).toBe("over_budget");
  });

  it("handles zero contract value without dividing by zero", () => {
    const result = calculateMargin({
      contractValue: 0,
      estimatedLabourHours: 10,
      labourRate: 50,
      estimatedMaterials: 100,
      estimatedSubcontractor: 0,
      overheadRate: 10,
      actualCost: 200,
    });

    expect(result.estimatedMarginPct).toBe(0);
    expect(result.actualMarginPct).toBe(0);
  });

  it("calculates variance correctly (positive = under budget)", () => {
    const result = calculateMargin({
      contractValue: 10000,
      estimatedLabourHours: 20,
      labourRate: 100,
      estimatedMaterials: 2000,
      estimatedSubcontractor: 0,
      overheadRate: 0,
      actualCost: 3500,
    });

    // Estimated: 4000, Actual: 3500
    // Variance dollar: 4000 - 3500 = 500 (positive = under budget)
    expect(result.varianceDollar).toBe(500);
  });
});

describe("getProvincialTaxRate", () => {
  it("returns 13% for Ontario", () => {
    expect(getProvincialTaxRate("ON")).toBe(13);
  });

  it("returns 5% for Alberta", () => {
    expect(getProvincialTaxRate("AB")).toBe(5);
  });

  it("returns 12% for British Columbia", () => {
    expect(getProvincialTaxRate("BC")).toBe(12);
  });

  it("returns 14.975% for Quebec", () => {
    expect(getProvincialTaxRate("QC")).toBe(14.975);
  });

  it("returns 15% for Nova Scotia", () => {
    expect(getProvincialTaxRate("NS")).toBe(15);
  });

  it("is case-insensitive", () => {
    expect(getProvincialTaxRate("on")).toBe(13);
    expect(getProvincialTaxRate("On")).toBe(13);
  });

  it("defaults to 5% for unknown provinces", () => {
    expect(getProvincialTaxRate("XX")).toBe(5);
  });
});

describe("applyTax", () => {
  it("correctly applies Ontario HST", () => {
    const result = applyTax(1000, "ON");
    expect(result.subtotal).toBe(1000);
    expect(result.tax).toBe(130);
    expect(result.total).toBe(1130);
  });

  it("correctly applies Alberta GST", () => {
    const result = applyTax(500, "AB");
    expect(result.subtotal).toBe(500);
    expect(result.tax).toBe(25);
    expect(result.total).toBe(525);
  });

  it("correctly applies Quebec tax", () => {
    const result = applyTax(1000, "QC");
    expect(result.subtotal).toBe(1000);
    expect(result.tax).toBe(149.75);
    expect(result.total).toBe(1149.75);
  });
});
