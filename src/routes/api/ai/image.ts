import { createFileRoute } from "@tanstack/react-router";

// Generates an image via Lovable AI (google/gemini-2.5-flash-image).
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
            model: "google/gemini-2.5-flash-image",
            modalities: ["image", "text"],
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (!resp.ok) return new Response(await resp.text(), { status: resp.status });
        const data = await resp.json();
        // Gateway returns image url in message.images[0].image_url.url
        const msg = data.choices?.[0]?.message;
        const url =
          msg?.images?.[0]?.image_url?.url ||
          msg?.images?.[0]?.url ||
          null;
        if (!url) return new Response(JSON.stringify({ error: "No image", raw: data }), { status: 500 });
        return Response.json({ url });
      },
    },
  },
});
