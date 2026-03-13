import { NextResponse } from "next/server";

import type { Project } from "@/lib/types";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  project: Project;
  messages: ChatMessage[];
};

function buildSystemPrompt(project: Project) {
  const milestoneSummary = project.milestones
    .map(
      (milestone, index) =>
        `${index + 1}. ${milestone.title} | ${milestone.status} | ${milestone.completion_score}% | ${milestone.payment_amount}`,
    )
    .join("\n");

  return [
    "You are the AI Project Manager for MilestoneAI.",
    "Answer as a concise, practical project operator for an employer.",
    "Focus on project status, risks, escrow, milestones, and next actions.",
    "If the employer asks for a recommendation, give the clearest next step.",
    "",
    `Project title: ${project.title}`,
    `Project summary: ${project.project_summary}`,
    `Project status: ${project.status}`,
    `Total budget: ${project.total_budget}`,
    `Success fee: ${project.success_fee}`,
    `Risk factors: ${project.risk_factors.join("; ") || "None"}`,
    "Milestones:",
    milestoneSummary,
  ].join("\n");
}

function buildFallbackReply(project: Project, latestUserMessage: string) {
  const incompleteMilestones = project.milestones.filter(
    (milestone) => milestone.status !== "FULLY_COMPLETED",
  );

  const nextMilestone = incompleteMilestones[0];

  return [
    `Project status is ${project.status.toLowerCase()} with ${incompleteMilestones.length} milestone(s) still open.`,
    nextMilestone
      ? `The next milestone to watch is "${nextMilestone.title}" at ${nextMilestone.completion_score}% completion.`
      : "All milestones appear complete and ready for final confirmation.",
    `Latest request noted: "${latestUserMessage}".`,
    "If you want, I can help draft the next employer action, risk follow-up, or milestone review checklist.",
  ].join(" ");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const latestUserMessage =
      body.messages.filter((message) => message.role === "user").at(-1)?.content ??
      "Provide a concise project update.";

    if (!body.project) {
      return NextResponse.json(
        { error: "Missing project context." },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";

    if (!apiKey) {
      return NextResponse.json({
        message: buildFallbackReply(body.project, latestUserMessage),
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
        system: buildSystemPrompt(body.project),
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
          message: buildFallbackReply(body.project, latestUserMessage),
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
      message:
        text || buildFallbackReply(body.project, latestUserMessage),
      source: "anthropic",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to reach the AI project manager right now.",
      },
      { status: 500 },
    );
  }
}
