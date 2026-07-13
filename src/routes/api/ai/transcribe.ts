import { createFileRoute } from "@tanstack/react-router";

// Speech-to-text via Lovable AI (multipart proxy).
export const Route = createFileRoute("/api/ai/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof Blob)) return new Response("Missing file", { status: 400 });

        const upstream = new FormData();
        upstream.append("file", file, (file as File).name || "audio.webm");
        upstream.append("model", "openai/gpt-4o-mini-transcribe");

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });
        const text = await resp.text();
        return new Response(text, { status: resp.status, headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
