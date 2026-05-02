import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { leads } = await req.json();
    if (!leads?.length) return NextResponse.json([], { status: 200 });

    const prompt = `You are a veteran wholesale real estate coach with 15+ years closing deals in the Northeast US. Score each lead AND give actionable mentor advice for how to approach that specific seller.

SCORING — High (8-10):
- Pre-foreclosure, lis pendens, foreclosure, tax delinquent
- Out-of-state or absentee owner
- Probate, estate sale, inherited property
- Divorce, death, job transfer, relocation
- AS-IS, major repairs needed, vacant
- 60+ days on market, price reductions, must sell

Low (1-4): agent-listed, priced at market, new listing, no urgency signals.

MENTOR NOTE — write like a coach whispering in their ear before the call. Be specific to THIS lead's situation. Include:
- How to open the call (first sentence)
- The real pain point to address based on their situation
- One thing NOT to say
- What a motivated response looks like vs a dead end
- Any red flags or green flags in the data

Keep mentor note under 4 sentences. Be direct, no fluff.

Leads:
${JSON.stringify(leads.map((l: any, i: number) => ({ id: i, ...l })), null, 2)}

Return ONLY valid JSON, no markdown:
[{"id": 0, "score": 8, "priority": "high", "reason": "one sentence on why this score", "mentorNote": "Lead with empathy not price. Open with: 'I saw your property and wanted to reach out personally — are you still looking to sell?' They're likely stressed about the foreclosure timeline, not the money. Don't mention your fee. If they ask about repairs, you've got a live one."}]

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
