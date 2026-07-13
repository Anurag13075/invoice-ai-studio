import type { Invoice, Client } from "@/lib/store";
import { invoiceTotal, currency } from "@/lib/store";
import { jsPDF } from "jspdf";

export function generateInvoicePdf(inv: Invoice, client: Client | undefined, company: { name: string; email: string; address: string }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("INVOICE", 48, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(inv.number, W - 48, y, { align: "right" });
  y += 36;

  doc.setFont("helvetica", "bold");
  doc.text(company.name, 48, y);
  doc.setFont("helvetica", "normal");
  doc.text(company.address, 48, y + 14);
  doc.text(company.email, 48, y + 28);

  doc.setFont("helvetica", "bold");
  doc.text("Bill to:", W - 48 - 200, y);
  doc.setFont("helvetica", "normal");
  doc.text(client?.company || "—", W - 48 - 200, y + 14);
  doc.text(client?.address || "", W - 48 - 200, y + 28);
  doc.text(client?.email || "", W - 48 - 200, y + 42);
  y += 72;

  doc.text(`Issue date: ${new Date(inv.issueDate).toLocaleDateString()}`, 48, y);
  doc.text(`Due date: ${new Date(inv.dueDate).toLocaleDateString()}`, 48, y + 14);
  y += 40;

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
  const total = invoiceTotal(inv);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${currency(total, inv.currency)}`, W - 48, y, { align: "right" });
  y += 32;

  if (inv.notes) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(`Notes: ${inv.notes}`, 48, y);
  }

  return doc;
}
