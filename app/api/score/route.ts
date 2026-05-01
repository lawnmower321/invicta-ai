import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { leads } = await req.json();
    if (!leads?.length) return NextResponse.json([], { status: 200 });

    const prompt = `You are a wholesale real estate expert. Score each of these leads 1-10 for motivated seller likelihood.

High scores (8-10) go to leads with:
- Pre-foreclosure, lis pendens, or foreclosure status
- Out-of-state or absentee owner
- Tax delinquency mentioned
- Long time on market (60+ days) or price reductions
- AS-IS, needs major repairs, condition problems
- Urgency words: must sell, divorce, estate, death, relocating, job transfer, behind on payments
- Bank-owned, inherited property, probate

Low scores (1-4): Listed with agent, priced at market, no urgency signals, new listing no info.

Leads to score:
${JSON.stringify(leads.map((l: any, i: number) => ({ id: i, ...l })), null, 2)}

Respond with ONLY a valid JSON array, no markdown, no explanation:
[{"id": 0, "score": 8, "priority": "high", "reason": "one sentence max"}]

Priority must be exactly: "high" (8-10), "medium" (5-7), "low" (1-4)`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";
    const text = raw.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trim();
    const scored = JSON.parse(text);
    return NextResponse.json(scored);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
