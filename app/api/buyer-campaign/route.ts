import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { address, arv, repairs, askingPrice, assignmentFee, notes } = await req.json();

    const discount = arv ? Math.round(((arv - askingPrice) / arv) * 100) : null;

    const prompt = `You are an expert wholesale real estate marketer. Generate buyer outreach copy for this deal.

Property: ${address}
ARV (After Repair Value): $${Number(arv).toLocaleString()}
Repair Estimate: $${Number(repairs).toLocaleString()}
Asking Price (wholesale): $${Number(askingPrice).toLocaleString()}
Assignment Fee Built In: $${Number(assignmentFee || 10000).toLocaleString()}
${discount ? `Discount to ARV: ${discount}%` : ""}
Additional Notes: ${notes || "none"}

Write platform-specific copy. Each version must feel native to that platform.
- Email: professional, numbers-focused, short subject line, 3-4 sentences max
- Text: under 160 chars, punchy, numbers only
- Facebook: casual, conversational, no hashtags, 2-3 sentences
- Instagram: energetic, 1-2 sentences + 5 relevant hashtags
- Direct mail: professional postcard copy, 40 words max, strong headline

Respond with ONLY valid JSON, no markdown:
{
  "email": {
    "subject": "Off-Market Deal — X% of ARV in [City]",
    "body": "..."
  },
  "text": "...",
  "facebook": "...",
  "instagram": {
    "caption": "...",
    "hashtags": "#wholesalerealestate #..."
  },
  "directMail": {
    "headline": "...",
    "body": "..."
  }
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";
    const text = raw.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trim();
    const result = JSON.parse(text);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
