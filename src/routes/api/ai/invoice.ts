import { createFileRoute } from "@tanstack/react-router";

// JSON invoice generation from plain English description.
// Returns { title, notes, items:[{description,quantity,price}] }
export const Route = createFileRoute("/api/ai/invoice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { description } = (await request.json()) as { description: string };
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const sys = `You generate structured invoice drafts. Output ONLY valid JSON matching:
{"title": string, "notes": string, "items":[{"description": string, "quantity": number, "price": number}]}
Keep 1-6 items. Use realistic USD prices. No commentary.`;

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: sys },
              { role: "user", content: `Create an invoice draft for: ${description}` },
            ],
          }),
        });
        if (!resp.ok) return new Response(await resp.text(), { status: resp.status });
        const data = await resp.json();
        const text = data.choices?.[0]?.message?.content || "{}";
        return new Response(text, { headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
