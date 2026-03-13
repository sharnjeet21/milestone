import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  projectContext: string;
  systemPrompt: string;
  messages: ChatMessage[];
};

function buildFallbackReply(projectContext: string, latestUserMessage: string) {
  return [
    "AI chat is using a local fallback response right now.",
    `Project context: ${projectContext.slice(0, 220)}${projectContext.length > 220 ? "..." : ""}`,
    `Latest question: "${latestUserMessage}".`,
    "Try asking for milestone risks, the next action, or payout readiness for the clearest answer.",
  ].join(" ");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const latestUserMessage =
      body.messages.filter((message) => message.role === "user").at(-1)?.content ??
      "Give me a concise project update.";

    if (!body.projectContext || !body.systemPrompt) {
      return NextResponse.json(
        { message: "Missing project context or system prompt." },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";

    if (!apiKey) {
      return NextResponse.json({
        message: buildFallbackReply(body.projectContext, latestUserMessage),
        source: "fallback",
      });
    }

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 350,
        system: `${body.systemPrompt}\n\nProject context:\n${body.projectContext}`,
        messages: body.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();

      return NextResponse.json(
        {
          message: buildFallbackReply(body.projectContext, latestUserMessage),
          source: "fallback",
          error: errorText,
        },
        { status: 200 },
      );
    }

    const data = (await anthropicResponse.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    const text = data.content
      ?.filter((item) => item.type === "text" && item.text)
      .map((item) => item.text)
      .join("\n")
      .trim();

    return NextResponse.json({
      message: text || buildFallbackReply(body.projectContext, latestUserMessage),
      source: "anthropic",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to reach the AI assistant right now.",
      },
      { status: 500 },
    );
  }
}
