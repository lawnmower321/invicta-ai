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

  const url = `https://api.rentcast.io/v1/avm/sale/comparable?address=${encodeURIComponent(address)}&maxRadius=${radius}&limit=10`;
  const res = await fetch(url, { headers: { "X-Api-Key": apiKey } });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `Rentcast error ${res.status}`, detail: text }, { status: res.status });
  }

  const data = await res.json();
  cache.set(cacheKey, { data, ts: Date.now() });
  return NextResponse.json(data);
}
