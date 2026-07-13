import { createFileRoute } from "@tanstack/react-router";

// Minimal chat proxy to Lovable AI Gateway (OpenAI-compatible /v1/chat/completions).
// Streams back plain text deltas as SSE lines: "0:{json string}\n".
// Client parses on the fly.

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, system } = (await request.json()) as {
          messages: { role: string; content: string }[];
          system?: string;
        };
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const payload = {
          model: "google/gemini-2.5-flash",
          stream: true,
          messages: [
            { role: "system", content: system || "You are a helpful, concise AI assistant embedded in a premium invoice SaaS. Use markdown when helpful." },
            ...messages,
          ],
        };

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!upstream.ok || !upstream.body) {
          const txt = await upstream.text();
          return new Response(txt || "Upstream error", { status: upstream.status });
        }

        // Parse OpenAI-style SSE and re-emit plain text chunks
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const reader = upstream.body.getReader();
        let buffer = "";

        const stream = new ReadableStream({
          async pull(controller) {
            const { done, value } = await reader.read();
            if (done) { controller.close(); return; }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              const s = line.trim();
              if (!s.startsWith("data:")) continue;
              const data = s.slice(5).trim();
              if (data === "[DONE]") { controller.close(); return; }
              try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) controller.enqueue(encoder.encode(delta));
              } catch { /* ignore */ }
            }
          },
          cancel(reason) { reader.cancel(reason); },
        });

        return new Response(stream, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});

