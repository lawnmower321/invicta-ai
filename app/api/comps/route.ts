import { NextRequest, NextResponse } from "next/server";

// 24h in-memory cache — same address+radius won't burn an API call twice
const cache = new Map<string, { data: any; ts: number }>();
const TTL = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const radius  = searchParams.get("radius") ?? "1";

  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

  const cacheKey = `${address}|${radius}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL) return NextResponse.json(hit.data);

  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RENTCAST_API_KEY not set" }, { status: 500 });

  const url = `https://api.rentcast.io/v1/avm/sale?address=${encodeURIComponent(address)}&maxRadius=${radius}&compCount=10`;
  console.log("Rentcast URL:", url);

  const res = await fetch(url, { headers: { "X-Api-Key": apiKey, "Accept": "application/json" } });
  const text = await res.text();
  console.log("Rentcast status:", res.status, "body:", text.slice(0, 500));

  if (!res.ok) {
    return NextResponse.json({ error: `Rentcast ${res.status}`, detail: text, url }, { status: res.status });
  }

  const json = await JSON.parse(text);
  // /v1/avm/sale returns { price, priceRangeLow, priceRangeHigh, comparables: [...] }
  const data = { comparables: json.comparables ?? [] };
  cache.set(cacheKey, { data, ts: Date.now() });
  return NextResponse.json(data);
}
