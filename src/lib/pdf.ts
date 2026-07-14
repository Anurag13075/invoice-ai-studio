import type { Invoice, Client } from "@/lib/store";
import { invoiceTotal, currency } from "@/lib/store";
import { jsPDF } from "jspdf";

export function generateInvoicePdf(
  inv: Invoice,
  client: Client | undefined,
  company: { name: string; email: string; address: string; phone?: string; taxId?: string; website?: string },
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("INVOICE", 48, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(inv.number, W - 48, y, { align: "right" });
  doc.text(new Date(inv.issueDate).toLocaleDateString(), W - 48, y + 14, { align: "right" });
  y += 40;

  if (inv.subject) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Subject: ${inv.subject}`, 48, y);
    y += 18;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("From", 48, y);
  doc.text("Bill to", W / 2, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  const fromLines = [company.name, company.address, company.email, company.phone, company.taxId ? `Tax ID: ${company.taxId}` : ""].filter(Boolean) as string[];
  const bt = inv.billTo;
  const toLines = [
    bt?.name || client?.company || "",
    bt?.address || client?.address || "",
    bt?.email || client?.email || "",
    bt?.phone || client?.phone || "",
    (bt?.vat || client?.vat) ? `VAT: ${bt?.vat || client?.vat}` : "",
  ].filter(Boolean);
  const rows = Math.max(fromLines.length, toLines.length);
  for (let i = 0; i < rows; i++) {
    if (fromLines[i]) doc.text(String(fromLines[i]).slice(0, 60), 48, y + i * 12);
    if (toLines[i]) doc.text(String(toLines[i]).slice(0, 60), W / 2, y + i * 12);
  }
  y += rows * 12 + 12;

  if (inv.shipTo && (inv.shipTo.name || inv.shipTo.address)) {
    doc.setFont("helvetica", "bold"); doc.text("Ship to", 48, y);
    doc.setFont("helvetica", "normal");
    doc.text(inv.shipTo.name || "", 48, y + 12);
    doc.text(inv.shipTo.address || "", 48, y + 24);
    y += 42;
  }

  doc.text(`Issue date: ${new Date(inv.issueDate).toLocaleDateString()}`, 48, y);
  doc.text(`Due date: ${new Date(inv.dueDate).toLocaleDateString()}`, 200, y);
  if (inv.poNumber) doc.text(`PO: ${inv.poNumber}`, 360, y);
  y += 24;

  // Table
  doc.setFillColor(240, 240, 240);
  doc.rect(48, y, W - 96, 24, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Description", 56, y + 16);
  doc.text("Qty", W - 280, y + 16);
  doc.text("Price", W - 210, y + 16);
  doc.text("Tax", W - 140, y + 16);
  doc.text("Total", W - 60, y + 16, { align: "right" });
  y += 32;
  doc.setFont("helvetica", "normal");

  for (const it of inv.items) {
    const line = it.quantity * it.price * (1 + it.tax / 100);
    doc.text(it.description.slice(0, 60), 56, y);
    doc.text(String(it.quantity), W - 280, y);
    doc.text(currency(it.price, inv.currency), W - 210, y);
    doc.text(`${it.tax}%`, W - 140, y);
    doc.text(currency(line, inv.currency), W - 60, y, { align: "right" });
    y += 18;
  }

  y += 12;
  const subtotal = inv.items.reduce((a, it) => a + it.quantity * it.price, 0);
  const tax = inv.items.reduce((a, it) => a + (it.quantity * it.price * it.tax) / 100, 0);
  const total = invoiceTotal(inv);
  doc.text(`Subtotal: ${currency(subtotal, inv.currency)}`, W - 48, y, { align: "right" }); y += 14;
  doc.text(`Tax: ${currency(tax, inv.currency)}`, W - 48, y, { align: "right" }); y += 14;
  if (inv.discount) { doc.text(`Discount: -${currency(inv.discount, inv.currency)}`, W - 48, y, { align: "right" }); y += 14; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Total: ${currency(total, inv.currency)}`, W - 48, y, { align: "right" });
  y += 30;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  if (inv.notes) {
    doc.setFont("helvetica", "italic");
    doc.text(`Notes: ${inv.notes}`, 48, y); y += 20;
    doc.setFont("helvetica", "normal");
  }
  if (inv.paymentInstructions) {
    doc.setFont("helvetica", "bold"); doc.text("Payment instructions", 48, y); y += 12;
    doc.setFont("helvetica", "normal");
    for (const l of inv.paymentInstructions.split("\n")) { doc.text(l, 48, y); y += 11; }
    y += 6;
  }
  if (inv.terms) {
    doc.setFont("helvetica", "bold"); doc.text("Terms & conditions", 48, y); y += 12;
    doc.setFont("helvetica", "normal");
    for (const l of doc.splitTextToSize(inv.terms, W - 96)) { doc.text(l, 48, y); y += 11; }
    y += 6;
  }
  if (inv.footer) {
    doc.setFont("helvetica", "italic");
    doc.text(inv.footer, W / 2, y + 10, { align: "center" });
  }

  return doc;
}
