import { create } from "zustand";
import { persist } from "zustand/middleware";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "partial";
export type EstimateStatus = "draft" | "sent" | "approved" | "declined" | "expired";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  tax: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  discount: number;
  currency: string;
  notes: string;
  paidAmount: number;
  createdAt: string;
  // Detailed business fields (all optional for backward compat)
  subject?: string;
  poNumber?: string;
  billTo?: { name: string; address: string; email: string; phone: string; vat: string };
  shipTo?: { name: string; address: string };
  paymentInstructions?: string;
  terms?: string;
  footer?: string;
}

export interface Estimate {
  id: string;
  number: string;
  clientId: string;
  status: EstimateStatus;
  issueDate: string;
  expiresAt: string;
  items: LineItem[];
  discount: number;
  currency: string;
  notes: string;
  createdAt: string;
}

export interface Client {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  vat: string;
  paymentTerms: number;
  notes: string;
  tags: string[];
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  tax: number;
  sku: string;
  category: string;
  favorite: boolean;
  createdAt: string;
}

export interface Recurring {
  id: string;
  clientId: string;
  items: LineItem[];
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  nextDate: string;
  active: boolean;
  currency: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: "stripe" | "paypal" | "bank" | "upi" | "cash";
  date: string;
  reference: string;
}

export interface Expense {
  id: string;
  vendor: string;
  amount: number;
  category: string;
  date: string;
  notes: string;
  receiptDataUrl?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "invoice" | "payment" | "ai" | "system";
  read: boolean;
  createdAt: string;
}

export interface Settings {
  companyName: string;
  companyEmail: string;
  companyAddress: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyTaxId?: string;
  companyLogo?: string;
  currency: string;
  taxRate: number;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  brandColor: string;
  bankDetails?: string;
  defaultTerms?: string;
  defaultFooter?: string;
}

interface AppState {
  invoices: Invoice[];
  clients: Client[];
  products: Product[];
  estimates: Estimate[];
  recurring: Recurring[];
  payments: Payment[];
  expenses: Expense[];
  notifications: Notification[];
  settings: Settings;
  aiImages: { id: string; url: string; prompt: string; createdAt: string }[];

  addInvoice: (i: Invoice) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addClient: (c: Client) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addProduct: (p: Product) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addEstimate: (e: Estimate) => void;
  updateEstimate: (id: string, patch: Partial<Estimate>) => void;
  deleteEstimate: (id: string) => void;
  addRecurring: (r: Recurring) => void;
  updateRecurring: (id: string, patch: Partial<Recurring>) => void;
  deleteRecurring: (id: string) => void;
  addPayment: (p: Payment) => void;
  deletePayment: (id: string) => void;
  addExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  pushNotification: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markAllRead: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  addAiImage: (img: { id: string; url: string; prompt: string; createdAt: string }) => void;
  seed: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const seedClients: Client[] = [
  { id: "c1", company: "Acme Corp", contact: "Sarah Johnson", email: "sarah@acme.com", phone: "+1 555 0100", address: "123 Market St, SF", vat: "US-12-345", paymentTerms: 14, notes: "Priority client", tags: ["enterprise"], createdAt: new Date().toISOString() },
  { id: "c2", company: "Nova Studios", contact: "Mark Lee", email: "mark@nova.io", phone: "+1 555 0111", address: "88 Broadway, NY", vat: "", paymentTerms: 30, notes: "", tags: ["design"], createdAt: new Date().toISOString() },
  { id: "c3", company: "Bakery Bliss", contact: "Ana Rivera", email: "ana@bakerybliss.com", phone: "+1 555 0122", address: "12 Elm St, Austin", vat: "", paymentTerms: 7, notes: "", tags: ["smb"], createdAt: new Date().toISOString() },
];

const seedProducts: Product[] = [
  { id: "p1", name: "Website Design", description: "Custom landing page", price: 2400, tax: 0, sku: "WEB-01", category: "Design", favorite: true, createdAt: new Date().toISOString() },
  { id: "p2", name: "Monthly Retainer", description: "Ongoing dev support", price: 4500, tax: 0, sku: "RET-01", category: "Consulting", favorite: true, createdAt: new Date().toISOString() },
  { id: "p3", name: "SEO Audit", description: "Full site audit + report", price: 800, tax: 0, sku: "SEO-01", category: "Marketing", favorite: false, createdAt: new Date().toISOString() },
];

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const daysAhead = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

const seedInvoices: Invoice[] = [
  { id: "i1", number: "INV-1001", clientId: "c1", status: "paid", issueDate: daysAgo(35), dueDate: daysAgo(20), items: [{ id: uid(), description: "Website Design", quantity: 1, price: 2400, tax: 0 }], discount: 0, currency: "USD", notes: "", paidAmount: 2400, createdAt: daysAgo(35) },
  { id: "i2", number: "INV-1002", clientId: "c2", status: "paid", issueDate: daysAgo(20), dueDate: daysAgo(5), items: [{ id: uid(), description: "Monthly Retainer", quantity: 1, price: 4500, tax: 0 }], discount: 0, currency: "USD", notes: "", paidAmount: 4500, createdAt: daysAgo(20) },
  { id: "i3", number: "INV-1003", clientId: "c3", status: "sent", issueDate: daysAgo(10), dueDate: daysAhead(4), items: [{ id: uid(), description: "SEO Audit", quantity: 1, price: 800, tax: 0 }], discount: 0, currency: "USD", notes: "", paidAmount: 0, createdAt: daysAgo(10) },
  { id: "i4", number: "INV-1004", clientId: "c1", status: "overdue", issueDate: daysAgo(45), dueDate: daysAgo(15), items: [{ id: uid(), description: "Consulting", quantity: 10, price: 150, tax: 0 }], discount: 0, currency: "USD", notes: "", paidAmount: 0, createdAt: daysAgo(45) },
  { id: "i5", number: "INV-1005", clientId: "c2", status: "draft", issueDate: daysAgo(2), dueDate: daysAhead(14), items: [{ id: uid(), description: "Brand identity", quantity: 1, price: 3200, tax: 0 }], discount: 0, currency: "USD", notes: "", paidAmount: 0, createdAt: daysAgo(2) },
];

const seedPayments: Payment[] = [
  { id: "pay1", invoiceId: "i1", amount: 2400, method: "stripe", date: daysAgo(19), reference: "ch_abc123" },
  { id: "pay2", invoiceId: "i2", amount: 4500, method: "bank", date: daysAgo(4), reference: "TRX-9911" },
];

const seedExpenses: Expense[] = [
  { id: "e1", vendor: "Figma", amount: 45, category: "Software", date: daysAgo(12), notes: "Team plan" },
  { id: "e2", vendor: "AWS", amount: 220, category: "Infrastructure", date: daysAgo(8), notes: "" },
  { id: "e3", vendor: "Notion", amount: 20, category: "Software", date: daysAgo(3), notes: "" },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      invoices: [],
      clients: [],
      products: [],
      estimates: [],
      recurring: [],
      payments: [],
      expenses: [],
      notifications: [],
      aiImages: [],
      settings: {
        companyName: "Your Company",
        companyEmail: "hello@yourcompany.com",
        companyAddress: "123 Main St, City",
        currency: "USD",
        taxRate: 0,
        invoicePrefix: "INV-",
        nextInvoiceNumber: 1006,
        brandColor: "#22c55e",
      },
      addInvoice: (i) => set((s) => ({ invoices: [i, ...s.invoices], settings: { ...s.settings, nextInvoiceNumber: s.settings.nextInvoiceNumber + 1 } })),
      updateInvoice: (id, patch) => set((s) => ({ invoices: s.invoices.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) })),
      addClient: (c) => set((s) => ({ clients: [c, ...s.clients] })),
      updateClient: (id, patch) => set((s) => ({ clients: s.clients.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((x) => x.id !== id) })),
      addProduct: (p) => set((s) => ({ products: [p, ...s.products] })),
      updateProduct: (id, patch) => set((s) => ({ products: s.products.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteProduct: (id) => set((s) => ({ products: s.products.filter((x) => x.id !== id) })),
      addEstimate: (e) => set((s) => ({ estimates: [e, ...s.estimates] })),
      updateEstimate: (id, patch) => set((s) => ({ estimates: s.estimates.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteEstimate: (id) => set((s) => ({ estimates: s.estimates.filter((x) => x.id !== id) })),
      addRecurring: (r) => set((s) => ({ recurring: [r, ...s.recurring] })),
      updateRecurring: (id, patch) => set((s) => ({ recurring: s.recurring.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteRecurring: (id) => set((s) => ({ recurring: s.recurring.filter((x) => x.id !== id) })),
      addPayment: (p) => set((s) => ({ payments: [p, ...s.payments] })),
      deletePayment: (id) => set((s) => ({ payments: s.payments.filter((x) => x.id !== id) })),
      addExpense: (e) => set((s) => ({ expenses: [e, ...s.expenses] })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),
      pushNotification: (n) => set((s) => ({ notifications: [{ ...n, id: uid(), read: false, createdAt: new Date().toISOString() }, ...s.notifications].slice(0, 50) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      addAiImage: (img) => set((s) => ({ aiImages: [img, ...s.aiImages].slice(0, 50) })),
      seed: () => {
        if (get().clients.length === 0) {
          set({
            clients: seedClients,
            products: seedProducts,
            invoices: seedInvoices,
            payments: seedPayments,
            expenses: seedExpenses,
          });
        }
      },
    }),
    { name: "lovable-invoice-saas-v1" },
  ),
);

export function invoiceTotal(inv: Pick<Invoice, "items" | "discount">) {
  const sub = inv.items.reduce((a, it) => a + it.quantity * it.price, 0);
  const tax = inv.items.reduce((a, it) => a + (it.quantity * it.price * it.tax) / 100, 0);
  return Math.max(0, sub + tax - (inv.discount || 0));
}

export function currency(n: number, code = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export { uid };
