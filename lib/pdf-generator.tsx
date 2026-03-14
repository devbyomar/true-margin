import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { getProvincialTaxRate, applyTax } from "@/lib/margin-calculator";

// ---- Types ----

export interface ChangeOrderPdfData {
  companyName: string;
  companyAddress: string | null;
  companyPhone: string | null;
  taxNumber: string | null;
  province: string | null;
  jobName: string;
  customerName: string | null;
  customerAddress: string | null;
  changeOrderNumber: number;
  title: string;
  description: string | null;
  amount: number;
  createdAt: string;
  status: string;
  signedByName: string | null;
  signedAt: string | null;
}

// ---- Register fonts (Google Fonts CDN) ----

// Use built-in Helvetica (no external font registration needed)
const FONT_FAMILY = "Helvetica";

// ---- Styles ----

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    padding: 48,
    color: "#1a1a2e",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#2a9d6e",
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#2a9d6e",
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 8,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  badge: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  badgePending: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },
  badgeApproved: {
    backgroundColor: "#D1FAE5",
    color: "#065F46",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  coNumber: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  rowLabel: {
    fontSize: 10,
    color: "#374151",
  },
  rowValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
    textAlign: "right" as const,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#065F46",
  },
  totalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#065F46",
    textAlign: "right" as const,
  },
  descriptionBox: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 4,
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.6,
  },
  signatureSection: {
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  signatureLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
  },
  signatureBlock: {
    width: "45%",
  },
  signatureUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a2e",
    marginBottom: 4,
    height: 24,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#6b7280",
  },
  signedBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 12,
  },
  signedText: {
    fontSize: 10,
    color: "#065F46",
    fontFamily: "Helvetica-Bold",
  },
  signedDetail: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
  },
});

// ---- Helpers ----

function formatCAD(amount: number): string {
  return `$${amount.toFixed(2)} CAD`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ---- PDF Component ----

function ChangeOrderPdf({ data }: { data: ChangeOrderPdfData }) {
  const province = data.province ?? "ON";
  const taxRate = getProvincialTaxRate(province);
  const taxBreakdown = applyTax(data.amount, province);

  const statusBadge =
    data.status === "approved"
      ? styles.badgeApproved
      : styles.badgePending;

  const statusLabel =
    data.status === "approved"
      ? "APPROVED"
      : data.status === "rejected"
        ? "REJECTED"
        : "PENDING APPROVAL";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{data.companyName}</Text>
            <Text style={styles.companyInfo}>
              {data.companyAddress ? `${data.companyAddress}\n` : ""}
              {data.companyPhone ? `Tel: ${data.companyPhone}\n` : ""}
              {data.taxNumber ? `HST/GST Reg. No. ${data.taxNumber}` : ""}
            </Text>
          </View>
          <View>
            <Text style={[styles.badge, statusBadge]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.coNumber}>
          Change Order CO-{String(data.changeOrderNumber).padStart(3, "0")} •{" "}
          {formatDate(data.createdAt)}
        </Text>

        {/* Job & Customer Info */}
        <Text style={styles.sectionTitle}>Job Information</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Job</Text>
          <Text style={styles.rowValue}>{data.jobName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Customer</Text>
          <Text style={styles.rowValue}>{data.customerName ?? "—"}</Text>
        </View>
        {data.customerAddress && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Address</Text>
            <Text style={styles.rowValue}>{data.customerAddress}</Text>
          </View>
        )}

        {/* Description */}
        {data.description && (
          <>
            <Text style={styles.sectionTitle}>Description of Work</Text>
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>{data.description}</Text>
            </View>
          </>
        )}

        {/* Amount & Tax */}
        <Text style={styles.sectionTitle}>Amount</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Subtotal</Text>
          <Text style={styles.rowValue}>{formatCAD(taxBreakdown.subtotal)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>
            {province === "QC" ? "GST + QST" : "HST/GST"} ({taxRate}%)
          </Text>
          <Text style={styles.rowValue}>{formatCAD(taxBreakdown.tax)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCAD(taxBreakdown.total)}</Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Authorization</Text>

          {data.signedByName && data.signedAt ? (
            <View style={styles.signedBadge}>
              <Text style={styles.signedText}>
                ✓ Approved by {data.signedByName}
              </Text>
              <Text style={styles.signedDetail}>
                Signed on {formatDate(data.signedAt)}
              </Text>
            </View>
          ) : (
            <View style={styles.signatureLine}>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureUnderline} />
                <Text style={styles.signatureLabel}>
                  Customer Signature / Date
                </Text>
              </View>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureUnderline} />
                <Text style={styles.signatureLabel}>Print Name</Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by TrueMargin • {formatDate(new Date().toISOString())}
          </Text>
          <Text style={styles.footerText}>
            CO-{String(data.changeOrderNumber).padStart(3, "0")} •{" "}
            {data.jobName}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ---- Render function ----

export async function generateChangeOrderPdf(
  data: ChangeOrderPdfData
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <ChangeOrderPdf data={data} />
  );
  return Buffer.from(buffer);
}
