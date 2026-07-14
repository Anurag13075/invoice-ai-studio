import { createFileRoute } from "@tanstack/react-router";

// Generates an image via Lovable AI (google/gemini-2.5-flash-image-preview).
// Returns { url: "data:image/png;base64,..." }
export const Route = createFileRoute("/api/ai/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt } = (await request.json()) as { prompt: string };
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            modalities: ["image", "text"],
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (!resp.ok) {
          const txt = await resp.text();
          return new Response(JSON.stringify({ error: txt }), { status: resp.status, headers: { "Content-Type": "application/json" } });
        }
        const data = await resp.json();
        const msg = data.choices?.[0]?.message;
        const url =
          msg?.images?.[0]?.image_url?.url ||
          msg?.images?.[0]?.url ||
          null;
        if (!url) return new Response(JSON.stringify({ error: "No image in response" }), { status: 500, headers: { "Content-Type": "application/json" } });
        return Response.json({ url });
      },
    },
  },
});
