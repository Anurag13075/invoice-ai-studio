<div align="center">

<img src="./new-invoice.png" alt="InvoiceFlow AI" width="100%" />

# 🧾 InvoiceFlow AI

**AI-powered invoicing, built for freelancers and small teams who'd rather ship than do paperwork.**

Create invoices, chat with an AI assistant, generate images, and get paid — all from one clean dashboard.

[![TanStack Start](https://img.shields.io/badge/TanStack-Start-FF4154?style=flat-square&logo=react)](https://tanstack.com/start)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)

[Live Demo](#) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

---

## ✨ Why InvoiceFlow AI

Most invoicing tools are either bloated SaaS platforms or bare-bones templates. InvoiceFlow AI sits in the middle — a fast, modern dashboard with an **AI copilot baked in**, so drafting line items, rewriting client notes, or generating quick visuals doesn't mean leaving the app.

- 📄 **Full invoice lifecycle** — draft, send, track, mark paid, duplicate, export as PDF
- 🤖 **AI Assistant** — a chat-based business copilot for drafting and analysis
- 🎨 **AI Image Studio** — generate visuals directly inside the workspace
- 👥 **Client & product management** — reusable clients, catalog items, recurring invoices
- 📊 **Analytics** — see revenue, outstanding balances, and trends at a glance
- 💳 **Payments & expenses** — track money in and out in one place
- 🎙️ **Voice** — voice-driven input for faster data entry

---

## 🖥️ Feature Overview

| Module | What it does |
|---|---|
| **Dashboard** | Snapshot of revenue, outstanding invoices, and recent activity |
| **Invoices** | Create, edit, duplicate, print, and export invoices as PDF |
| **Clients** | Store contact + billing details for repeat customers |
| **Products** | Reusable catalog items with pricing |
| **Recurring** | Automate invoices that repeat on a schedule |
| **Estimates** | Send quotes before work begins, convert to invoices later |
| **Payments** | Track incoming payments against invoices |
| **Expenses** | Log business costs alongside revenue |
| **Analytics** | Visual breakdown of business performance |
| **AI Assistant** | Chat-based help for drafting, rewriting, and analysis |
| **AI Image Studio** | Generate images for invoices, branding, or marketing |
| **Voice** | Speak instead of typing for quick actions |

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Client["🖥️ Client — React + TanStack Start"]
        UI["UI Components<br/>(Radix + Tailwind)"]
        Router["TanStack Router<br/>(file-based routes)"]
        Store["App Store<br/>(state management)"]
    end

    subgraph Edge["☁️ Vercel — Serverless Functions"]
        ChatAPI["/api/chat"]
        ImageAPI["/api/generate-image"]
    end

    subgraph Backend["🗄️ Supabase"]
        DB[("Postgres DB")]
        Auth["Auth"]
        Storage["Storage"]
    end

    subgraph AI["🤖 AI Providers"]
        LLM["Chat / Text Model"]
        ImgGen["Image Generation Model"]
    end

    UI --> Router --> Store
    Store -->|invoices, clients, products| DB
    Store -->|login/session| Auth
    Store -->|attachments, exports| Storage
    UI -->|"ask assistant"| ChatAPI --> LLM
    UI -->|"generate image"| ImageAPI --> ImgGen

    style Client fill:#1a1a2e,stroke:#0ea5e9,color:#fff
    style Edge fill:#16213e,stroke:#f59e0b,color:#fff
    style Backend fill:#0f3460,stroke:#3ecf8e,color:#fff
    style AI fill:#2d132c,stroke:#ec4899,color:#fff
```

---

## 🔄 Invoice Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: Create invoice
    Draft --> Sent: Mark sent
    Draft --> Draft: Edit / add items
    Sent --> Paid: Mark paid
    Sent --> Overdue: Due date passes
    Overdue --> Paid: Payment received
    Sent --> Draft: Duplicate for reuse
    Paid --> [*]

    Draft --> Deleted: Delete
    Sent --> Deleted: Delete
    Deleted --> [*]
```

---

## 🧩 Data Model

```mermaid
erDiagram
    CLIENT ||--o{ INVOICE : "billed"
    INVOICE ||--|{ LINE_ITEM : "contains"
    PRODUCT ||--o{ LINE_ITEM : "referenced by"
    INVOICE ||--o{ PAYMENT : "receives"
    CLIENT ||--o{ ESTIMATE : "receives"
    ESTIMATE ||--|{ LINE_ITEM : "contains"
    INVOICE ||--o| RECURRING_RULE : "generated from"

    CLIENT {
        string id
        string company
        string contact
        string email
        string address
    }
    INVOICE {
        string id
        string number
        string status
        date issueDate
        date dueDate
        number taxRate
        string currency
        string notes
    }
    LINE_ITEM {
        string id
        string name
        string description
        number quantity
        number price
    }
    PAYMENT {
        string id
        number amount
        date paidAt
        string method
    }
    ESTIMATE {
        string id
        string status
        date issueDate
    }
    RECURRING_RULE {
        string id
        string frequency
        date nextRunDate
    }
```

---

## 💬 AI Assistant Request Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as AI Assistant UI
    participant API as /api/chat
    participant Model as AI Model

    User->>UI: Types a prompt
    UI->>API: POST { messages }
    API->>Model: Forward request with context
    Model-->>API: Streamed response
    API-->>UI: Stream tokens
    UI-->>User: Renders response live
```

---

## 🛠️ Tech Stack

**Frontend**
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [TanStack Start](https://tanstack.com/start) & [TanStack Router](https://tanstack.com/router) — file-based routing, SSR
- [TanStack Query](https://tanstack.com/query) — data fetching & caching
- [Tailwind CSS 4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) primitives
- [Recharts](https://recharts.org/) — analytics visualizations
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) — forms & validation
- [Framer Motion / Motion](https://motion.dev/) — animation
- [jsPDF](https://github.com/parallax/jsPDF) — client-side PDF export

**Backend**
- [Supabase](https://supabase.com/) — Postgres, Auth, Storage
- Vercel Serverless Functions — AI chat & image generation endpoints

**Tooling**
- [Vite](https://vitejs.dev/) (Rolldown) — build tooling
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) — linting & formatting
- [pnpm](https://pnpm.io/) — package management

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- A [Supabase](https://supabase.com/) project

### Installation

```bash
git clone https://github.com/Anurag13075/invoice-AI-.git
cd invoice-AI-
pnpm install
```

### Environment Variables

Create a `.env` file in the project root:

```dotenv
VITE_SUPABASE_URL="your-supabase-project-url"
VITE_SUPABASE_PROJECT_ID="your-supabase-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"

# AI provider key(s) — required for AI Assistant & Image Studio
AI_PROVIDER_API_KEY="your-ai-provider-key"
```

### Run locally

```bash
pnpm dev
```

Visit `http://localhost:3000` (or the port shown in your terminal).

### Build for production

```bash
pnpm build
pnpm preview
```

---

## 📁 Project Structure

```
invoice-AI-/
├── src/
│   ├── routes/                  # File-based routes (TanStack Router)
│   │   ├── _app.invoices.$invoiceId.tsx
│   │   ├── _app.studio.tsx
│   │   └── ...
│   ├── components/
│   │   └── app/
│   │       ├── primitives.tsx   # Shared UI primitives
│   │       └── AIChatDock.tsx   # AI Assistant chat dock
│   ├── lib/
│   │   ├── store.ts             # App state & data helpers
│   │   └── format.ts            # Currency/date formatting
│   └── ...
├── public/
├── package.json
└── README.md
```

---

## 🗺️ Roadmap

- [ ] Multi-currency support with live exchange rates
- [ ] Client self-serve payment portal
- [ ] Recurring invoice automation via scheduled jobs
- [ ] Team accounts & role-based permissions
- [ ] Mobile app companion

---

## 🤝 Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

```bash
git checkout -b feature/your-feature
git commit -m "Add: your feature"
git push origin feature/your-feature
```

Then open a PR 🚀

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

---

<div align="center">

Built solo, in public, by **[Anurag](https://x.com/AnuragShar74342)** 🚀

</div>
