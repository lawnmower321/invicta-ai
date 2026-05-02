import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text?.trim()) return NextResponse.json([], { status: 200 });

    const prompt = `You are a wholesale real estate data extractor. Someone copy-pasted raw text from Zillow, Facebook FSBO groups, Craigslist, or similar — extract every property lead you can find.

For each property, extract whatever is available:
- address: full street address with city and state (required — skip if no address found)
- owner_name: seller's name if mentioned
- phone: phone number if mentioned, keep original format
- ask_price: asking price as a plain number, no $ or commas (null if not found)
- notes: combine description, condition, and any other details into one string
- source: where this looks like it came from (e.g. "Zillow FSBO", "Facebook Group", "Craigslist")

Motivation signals to watch for and include in notes:
- "must sell", "motivated", "priced to sell", "quick sale", "cash only"
- "divorce", "estate", "probate", "relocating", "job transfer", "downsizing"
- "AS-IS", "needs work", "fixer", "repairs needed", "handyman special"
- "no agent", "FSBO", "owner selling", "by owner"
- "price reduced", "price drop", "been on market"

Raw text:
${text}

Return ONLY a valid JSON array, no markdown, no explanation. Skip any entry with no address.
[{
  "address": "14 Fernwood Rd, Yonkers NY 10701",
  "owner_name": "Mike Johnson",
  "phone": "(914) 555-0141",
  "ask_price": 185000,
  "notes": "3bd/1ba, must sell, FSBO, needs kitchen update",
  "source": "Facebook FSBO"
}]`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";
    const text2 = raw.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trim();
    const leads = JSON.parse(text2);
    return NextResponse.json(leads);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
