import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { address, sqft, condition, sellerPrice, maoFactor = 70 } = await req.json();

    const prompt = `You are an expert wholesale real estate analyst. A wholesaler is on the phone RIGHT NOW with a seller and needs instant deal analysis.

Property: ${address}
Square footage: ${sqft || "unknown"} sq ft
Condition description: "${condition}"
Seller's asking price: ${sellerPrice ? "$" + Number(sellerPrice).toLocaleString() : "not stated"}
MAO Factor: ${maoFactor}%

Do the following:
1. Estimate ARV based on the address location and typical comparable sales for that market. Be realistic.
2. Estimate repair costs based on the condition description using these ranges:
   - Light cosmetic: $15-25/sqft
   - Major remodel (kitchen + baths): $25-50/sqft
   - Add specific costs for any mentioned issues (roof $8-15k, HVAC $5-10k, foundation $10-30k, etc.)
3. Calculate MAO: ARV × ${maoFactor}% − repairs − closing costs (3%) − holding costs
4. Calculate max wholesale fee if seller accepts their asking price
5. Generate a natural, confident seller script for making the offer

Respond with ONLY valid JSON, no markdown:
{
  "arv": 250000,
  "arvNote": "Based on comparable sales in [area] for [property type]",
  "repairLow": 35000,
  "repairHigh": 45000,
  "repairBreakdown": ["Kitchen remodel: $15-20k", "2 bathrooms: $10-15k", "Roof: $8-12k"],
  "closingCosts": 7500,
  "mao": 127500,
  "maxFee": 12500,
  "dealVerdict": "solid" or "tight" or "pass",
  "verdictReason": "one sentence",
  "sellerScript": "Based on the repairs needed and recent sales in your area, the best I can offer is $X cash. I can close in 2-3 weeks with no fees or commissions to you. Does that work?"
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";
    const result = JSON.parse(text);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
