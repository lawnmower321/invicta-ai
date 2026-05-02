"use client";

import { useState } from "react";
import { Search, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import PageShell from "@/components/PageShell";

type Term = {
  term: string;
  short: string;
  definition: string;
  example?: string;
  tip?: string;
};

type Category = {
  label: string;
  color: string;
  terms: Term[];
};

const CATEGORIES: Category[] = [
  {
    label: "Deal Math",
    color: "var(--invicta-green)",
    terms: [
      {
        term: "ARV",
        short: "After Repair Value",
        definition: "What the property will be worth after all repairs and renovations are complete. This is the number everything else is calculated from.",
        example: "A house needs a full kitchen and bathroom remodel. Comps in the neighborhood show updated homes selling at $280k. The ARV is $280,000.",
        tip: "ARV is determined by what similar, updated homes nearby have actually sold for in the last 3-6 months — not listing prices, not Zestimate.",
      },
      {
        term: "MAO",
        short: "Maximum Allowable Offer",
        definition: "The most you can offer a seller and still leave enough room for the buyer's profit, repairs, closing costs, and your wholesale fee. The formula: ARV × 70% − Repairs.",
        example: "ARV $280k × 70% = $196k − $40k repairs = $156k MAO. You can offer up to $156k and the deal still works.",
        tip: "The 70% rule is a starting point, not a law. In competitive markets buyers sometimes go to 75-80%. In rough markets they want 60-65%. Know your buyers' numbers.",
      },
      {
        term: "Assignment Fee",
        short: "Your wholesale profit",
        definition: "The amount you charge a cash buyer for the right to purchase the contract you have with the seller. This is how wholesalers get paid — you never own the house.",
        example: "You have a property under contract at $140k. A buyer pays $155k. Your assignment fee is $15,000.",
        tip: "Most beginners target $5k-$15k per deal. As you build your buyer list and find better deals, fees of $20k-$50k are realistic.",
      },
      {
        term: "Equity",
        short: "The gap between value and debt",
        definition: "How much of the property value the seller actually owns. A house worth $200k with a $160k mortgage has $40k equity. High equity = motivated seller has room to negotiate.",
        example: "A seller owes $50k on a house worth $220k. They have $170k in equity — plenty of room to accept a wholesale offer.",
        tip: "You need equity to make a deal work. Sellers underwater on their mortgage (owe more than it's worth) can't sell to you unless they do a short sale.",
      },
      {
        term: "Spread",
        short: "Room between MAO and ask price",
        definition: "The difference between your MAO and what the seller is asking. Positive spread means a potential deal. Negative spread means the seller is priced too high for a wholesale.",
        example: "MAO is $150k. Seller asks $130k. Spread is $20k — that's your room for the assignment fee.",
        tip: "You want at least $10k-$15k spread to have a viable deal after factoring in your fee, any surprises, and the buyer's wiggle room.",
      },
      {
        term: "Closing Costs",
        short: "Transaction expenses",
        definition: "Fees paid at closing: title insurance, transfer taxes, attorney fees, recording fees. Typically 2-4% of the purchase price. Baked into your MAO calculation.",
        example: "On a $200k purchase, closing costs run about $5k-$8k. Your buyer pays these, so it comes out of the deal margin.",
        tip: "In NY specifically, transfer taxes are high. Factor 2-3% extra for NYC/Westchester area deals vs other markets.",
      },
      {
        term: "Price Per Sq Ft",
        short: "$/SF",
        definition: "A comp shortcut. If similar homes in the neighborhood sell at $180/sqft and your property is 1,400 sqft, the ARV estimate is around $252k.",
        example: "5 comps average $195/sqft. Subject property is 1,300 sqft. Rough ARV = 1,300 × $195 = $253,500.",
        tip: "Use $/sqft as a sanity check, not your only comp method. Condition, updates, lot size, and location on the street all affect actual value.",
      },
    ],
  },
  {
    label: "Seller Types",
    color: "var(--invicta-amber)",
    terms: [
      {
        term: "Motivated Seller",
        short: "Someone who needs to sell, not just wants to",
        definition: "A seller whose circumstances create urgency — financial pressure, life event, or property problem forces them to act. They prioritize speed and certainty over getting top dollar.",
        example: "A homeowner 3 months behind on mortgage, facing foreclosure in 60 days. They need to sell fast. That's a motivated seller.",
        tip: "Motivation is a spectrum. 'Kind of needs to sell' is different from 'must close in 30 days or lose the house.' The stronger the motivation, the better the deal.",
      },
      {
        term: "Absentee Owner",
        short: "Owns the property but doesn't live there",
        definition: "The owner's mailing address is different from the property address. Often a landlord, inherited property owner, or someone who moved away. High likelihood of motivation.",
        example: "Property at 14 Elm St, Yonkers. Owner's mail goes to a Florida address. They're an absentee owner — probably a landlord or someone who inherited it.",
        tip: "Absentee owners in pain (bad tenants, property issues, out-of-state headaches) are your best leads. They can't physically deal with the property and often just want out.",
      },
      {
        term: "FSBO",
        short: "For Sale By Owner",
        definition: "Seller is listing and negotiating without a real estate agent. No commission to worry about, and they're often more open to creative deals because they're doing it themselves.",
        example: "A Craigslist post: 'Selling my house myself, 3bd/2ba, asking $175k, call Mike at (914)...' — that's an FSBO.",
        tip: "FSBO sellers saved the agent commission (3-6%) but often price too high because they don't know the market. Lead with education, not just lowball offers.",
      },
      {
        term: "Probate",
        short: "Estate going through court",
        definition: "When someone dies, their estate (including real estate) often goes through probate court before it can be sold. Heirs may want to liquidate quickly, especially if they live out of state.",
        example: "An elderly woman passes away. Her three children, none of whom live in NY, inherit her Yonkers home. They want to sell fast and split the proceeds. That's a probate deal.",
        tip: "Probate deals take longer to close (45-90 days minimum) due to court approval. Make sure your buyer knows this upfront.",
      },
      {
        term: "Pre-Foreclosure",
        short: "Behind on mortgage, not yet foreclosed",
        definition: "The homeowner has missed payments and received a Notice of Default or lis pendens but hasn't lost the property yet. They have time to sell but a hard deadline.",
        example: "Homeowner gets a lis pendens filed in February. Auction is scheduled for July. They have until then to sell, pay off the loan, or lose the house.",
        tip: "These sellers are often embarrassed and scared. Lead with empathy: 'I know these situations can be overwhelming — I help people in exactly this position.' Never make them feel judged.",
      },
      {
        term: "Tired Landlord",
        short: "Landlord who's done dealing with tenants",
        definition: "A rental property owner worn down by bad tenants, maintenance issues, vacancies, or just wants to exit. Often owns properties free and clear (no mortgage) with lots of equity.",
        example: "A 65-year-old who's owned a 4-unit in the Bronx for 30 years. Tenants stop paying, pipes are leaking, and he just wants out. Classic tired landlord.",
        tip: "Don't open with price. Open with pain: 'How long have you owned the property?' and 'How's it been going lately?' Let them vent. The deal closes itself.",
      },
    ],
  },
  {
    label: "Legal & Process",
    color: "var(--invicta-blue)",
    terms: [
      {
        term: "Lis Pendens",
        short: "Lawsuit filed on the property",
        definition: "Latin for 'suit pending.' A legal notice filed in public records that a lawsuit involving the property is ongoing — usually a foreclosure action by the lender.",
        example: "Bank files a lis pendens on 14 Fernwood Rd because the owner is 6 months behind. Anyone researching the title will see it. This is public record.",
        tip: "Lis pendens filings are your goldmine. County clerk websites publish them. These are the most motivated sellers you'll ever find.",
      },
      {
        term: "Assignment Contract",
        short: "The document that transfers your deal",
        definition: "An agreement that transfers your rights and obligations under the purchase contract to a buyer. The buyer pays you the assignment fee for this right.",
        example: "You sign a purchase agreement with a seller for $130k. You find a buyer who pays $145k. You use an assignment contract to transfer the deal and collect $15k.",
        tip: "Some sellers resist assignment clauses. If your purchase contract includes 'and/or assigns' after your name, you're covered. Some wholesalers use a trust or LLC to avoid this.",
      },
      {
        term: "Double Close",
        short: "Two closings back-to-back",
        definition: "Instead of assigning a contract, you actually close on the property (A→B) and immediately resell it to your buyer (B→C) on the same day. Your profit is the spread but it's not disclosed.",
        example: "You buy from seller at $130k. Within hours, you sell to buyer at $150k. Two separate closings, same day. You pocket $20k.",
        tip: "Double close when your fee is large (buyer might refuse a $40k assignment) or when the contract prohibits assignment. Requires transactional funding — short-term bridge loans for the first close.",
      },
      {
        term: "EMD",
        short: "Earnest Money Deposit",
        definition: "A deposit you put down to show the seller you're serious when signing a purchase agreement. Usually $500-$2,000 for wholesale deals. At risk if you back out without a valid contingency.",
        example: "You sign a contract with a $1,000 EMD. If you find a buyer and close, it's credited to the purchase price. If you walk away without cause, seller keeps it.",
        tip: "Keep your EMD as low as the seller will accept. Most motivated sellers agree to $500-$1,000. Negotiate the inspection/due diligence period to protect yourself.",
      },
      {
        term: "Title",
        short: "Legal ownership of the property",
        definition: "The legal right to own and sell a property. A clean title means no liens, back taxes, disputes, or other claims that would prevent the sale.",
        example: "A property has a mechanic's lien for $8,000 from unpaid contractors. That's a title issue — it must be resolved before the property can be sold.",
        tip: "Always use a title company. They search for issues, insure the buyer, and handle the closing. In NY, attorney closings are standard — budget for that.",
      },
      {
        term: "Equitable Interest",
        short: "Your interest once you have a signed contract",
        definition: "Once you sign a purchase agreement with a seller, you have equitable interest in the property — the legal right to buy it. This is what you're selling when you wholesale.",
        example: "The moment your purchase contract is signed, you hold equitable interest. That contract is an asset you can assign (sell) to another buyer.",
        tip: "Some states require a real estate license to market equitable interest. NY is nuanced — consult a RE attorney if you're concerned.",
      },
    ],
  },
  {
    label: "Finding Deals",
    color: "var(--invicta-purple)",
    terms: [
      {
        term: "Skip Tracing",
        short: "Finding contact info for a property owner",
        definition: "The process of finding a property owner's phone number and email when it's not publicly available. Uses data from credit bureaus, utility records, and public databases.",
        example: "You find a vacant house on Fernwood Rd. Owner name is public record but no phone listed. Skip tracing finds their cell number and email for $0.10.",
        tip: "BatchLeads, SkipGenie, and PropStream all offer skip tracing. Usually $0.10-$0.25 per lead. On a list of 200 properties, that's $20-$50 to get phone numbers on everyone.",
      },
      {
        term: "Driving for Dollars",
        short: "Finding distressed properties by driving neighborhoods",
        definition: "Physically driving target neighborhoods looking for signs of distress: overgrown grass, boarded windows, peeling paint, piled mail, code violation notices. Then tracking down the owner.",
        example: "You drive Yonkers on a Saturday. You spot a vacant house with overgrown grass and boards on the windows. You write down the address, look up the owner in county records, skip trace them, and call.",
        tip: "DealMachine app lets you snap a photo while driving, automatically pulls owner info, and adds it to your list. Makes D4D 10x faster.",
      },
      {
        term: "Tax Delinquent",
        short: "Property owner behind on property taxes",
        definition: "A homeowner who hasn't paid property taxes, often for years. County records list these publicly. Tax delinquency is a strong motivation signal — often paired with financial distress.",
        example: "County records show 45 Willow St owes $12,000 in back property taxes over 3 years. The owner is clearly in financial trouble and may be motivated.",
        tip: "NY counties publish tax delinquent lists annually. Westchester County's is free online. These are some of the highest-conversion lists you can work.",
      },
      {
        term: "Direct Mail",
        short: "Sending physical mail to targeted sellers",
        definition: "Mailing postcards or letters to a targeted list of property owners (absentee owners, pre-foreclosures, tax delinquent) inviting them to call if they want to sell.",
        example: "You mail 500 yellow letters to absentee owners in Yonkers saying 'I buy houses in any condition, cash, fast close.' You get 5-10 calls back.",
        tip: "Yellow handwritten-style letters outperform glossy postcards for response rate. Expect 1-3% response. Takes 3-5 touches (mailings) to warm up a list.",
      },
      {
        term: "Daisy Chain",
        short: "Multiple wholesalers in one deal",
        definition: "When Wholesaler A finds a deal, passes it to Wholesaler B who passes it to Wholesaler C who has the actual buyer. Each takes a cut. Generally frowned on — it inflates the price and kills deals.",
        example: "A has a property at $130k. B adds $10k and passes to C. C adds $10k and finds a buyer at $150k. But MAO is $145k — deal falls apart because of the extra markup.",
        tip: "Avoid being in a daisy chain. Deal directly with sellers and buyers whenever possible. If someone's bringing you a deal, make sure the numbers still work at the price they're presenting.",
      },
      {
        term: "Bird Dog",
        short: "Someone who finds deals for you",
        definition: "A person (often unlicensed) who finds motivated seller leads and brings them to a wholesaler in exchange for a referral fee when the deal closes.",
        example: "Your neighbor knows someone in foreclosure. He connects you, you close the deal, and you pay him $1,000-$2,000 for the introduction.",
        tip: "Bird dogs are an easy way to scale lead generation without doing all the legwork yourself. Build relationships with people who talk to distressed homeowners: contractors, mail carriers, divorce attorneys.",
      },
    ],
  },
  {
    label: "Buyers & Selling",
    color: "var(--invicta-red)",
    terms: [
      {
        term: "Cash Buyer",
        short: "Investor who buys without a mortgage",
        definition: "A real estate investor who can purchase a property without bank financing. They close faster (7-21 days vs 30-60 for financed), have no appraisal contingency, and don't fall through due to loan issues.",
        example: "Mike Romano has $400k in a business account ready to buy. He doesn't need a mortgage. He can close in 10 days. He's your ideal buyer.",
        tip: "Build your cash buyer list before you have deals. Go to local REIA meetups, search recent cash transactions in county records, ask title companies who their cash buyers are.",
      },
      {
        term: "Fix and Flip Investor",
        short: "Buys, renovates, resells for profit",
        definition: "An investor who buys distressed properties, rehabilitates them, and sells for a profit. Your primary wholesale buyer. They need the MAO formula to work and enough spread for their profit margin.",
        example: "A buyer buys your deal at $145k. They spend $45k on renovations. They sell the finished house for $250k. Their profit after all costs is around $40k.",
        tip: "Flippers want at minimum a 20% return on their total investment. If ARV is $250k, all-in cost (purchase + repairs + holding + selling) needs to be under $200k.",
      },
      {
        term: "Buy and Hold Investor",
        short: "Buys to rent long-term",
        definition: "An investor who purchases properties to rent out for monthly cash flow rather than flipping. They use different criteria — focused on rent-to-price ratio and cap rate rather than ARV.",
        example: "A buyer pays $120k for a Bronx 2-family that rents for $3,200/month. Their mortgage + expenses = $1,800/month. $1,400/month cash flow. That's a buy-and-hold deal.",
        tip: "Your buyers list should include both flippers and landlords. Some deals are better for one than the other — a 2-family in a strong rental market may fetch more from a buy-and-hold buyer.",
      },
      {
        term: "Buyer's List",
        short: "Your database of active investors",
        definition: "A curated list of real estate investors who have told you what they buy, where, and at what price. The quality of your buyer's list determines how fast you can move deals.",
        example: "You have 50 buyers in your list. 10 actively buy in Westchester. 3 have done deals with you before. Those 3 get called first when a new deal comes in.",
        tip: "Your buyer's list is one of your most valuable business assets. Treat it that way. Update criteria regularly — markets change, investors pivot, budgets shift.",
      },
      {
        term: "Buy Box",
        short: "What a buyer will and won't buy",
        definition: "A buyer's specific criteria: property type, location, price range, condition, and deal structure they're looking for. Know every buyer's box so you can match deals instantly.",
        example: "Mike's buy box: SFR only, Westchester/Bronx, max $300k purchase, needs to be 3bd+, won't do condos or co-ops.",
        tip: "Ask every buyer: 'What's your buy box?' Update it twice a year. A buyer who was doing SFR last year might be doing multifamily now.",
      },
    ],
  },
];

function TermCard({ term }: { term: Term }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border transition-all"
      style={{ background: "var(--surface)", borderColor: open ? "var(--invicta-green)40" : "var(--border)" }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-start justify-between gap-3 text-left">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold">{term.term}</span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--surface-3)", color: "var(--muted-foreground)" }}>
              {term.short}
            </span>
          </div>
        </div>
        {open ? <ChevronUp size={15} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
               : <ChevronDown size={15} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />}
      </button>
      {open && (
        <div className="px-5 pb-5 flex flex-col gap-3 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm leading-relaxed pt-3">{term.definition}</p>
          {term.example && (
            <div className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
              <p className="text-xs font-bold mb-1" style={{ color: "var(--muted-foreground)" }}>Example</p>
              <p className="text-sm leading-relaxed">{term.example}</p>
            </div>
          )}
          {term.tip && (
            <div className="rounded-xl p-3" style={{ background: "var(--invicta-amber)10", border: "1px solid var(--invicta-amber)25" }}>
              <p className="text-xs font-bold mb-1" style={{ color: "var(--invicta-amber)" }}>Pro Tip</p>
              <p className="text-sm leading-relaxed">{term.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LearnPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allTerms = CATEGORIES.flatMap(c => c.terms.map(t => ({ ...t, category: c.label, color: c.color })));

  const filtered = query
    ? allTerms.filter(t =>
        t.term.toLowerCase().includes(query.toLowerCase()) ||
        t.short.toLowerCase().includes(query.toLowerCase()) ||
        t.definition.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  return (
    <PageShell title="Learn" subtitle="Wholesale real estate glossary">
      {/* search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: "var(--muted-foreground)" }} />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search terms — ARV, lis pendens, assignment fee..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
          onFocus={e => (e.target.style.borderColor = "var(--invicta-green)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* search results */}
      {filtered && (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: "var(--muted-foreground)" }}>
              No terms found for "{query}"
            </p>
          )}
          {filtered.map(t => (
            <div key={t.term}>
              <p className="text-xs font-bold mb-1 px-1" style={{ color: t.color }}>{t.category}</p>
              <TermCard key={t.term} term={t} />
            </div>
          ))}
        </div>
      )}

      {/* category view */}
      {!filtered && (
        <div className="flex flex-col gap-8">
          {/* category pills */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setActiveCategory(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: !activeCategory ? "var(--invicta-green)20" : "var(--surface)",
                color: !activeCategory ? "var(--invicta-green)" : "var(--muted-foreground)",
                border: !activeCategory ? "1px solid var(--invicta-green)" : "1px solid var(--border)",
              }}>
              All
            </button>
            {CATEGORIES.map(c => (
              <button key={c.label} onClick={() => setActiveCategory(c.label === activeCategory ? null : c.label)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: activeCategory === c.label ? `${c.color}20` : "var(--surface)",
                  color: activeCategory === c.label ? c.color : "var(--muted-foreground)",
                  border: activeCategory === c.label ? `1px solid ${c.color}` : "1px solid var(--border)",
                }}>
                {c.label}
              </button>
            ))}
          </div>

          {CATEGORIES.filter(c => !activeCategory || c.label === activeCategory).map(cat => (
            <div key={cat.label}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} style={{ color: cat.color }} />
                <h2 className="font-bold" style={{ color: cat.color }}>{cat.label}</h2>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {cat.terms.length} terms
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {cat.terms.map(term => <TermCard key={term.term} term={term} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
