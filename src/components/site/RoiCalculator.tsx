"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  price: string | number | null;
  currency?: string | null;
  roi?: string | null;
  currencyOptions?: string[];
};

const inputCls =
  "h-11 w-full rounded-xl border border-ink/10 bg-white px-3.5 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

const FALLBACK_RATES: Record<string, number> = { USD: 1, AED: 3.6725, SAR: 3.75, PKR: 278, GBP: 0.78, EUR: 0.92, OMR: 0.3845, TRY: 34, AZN: 1.7 };

function parseMoney(v: string): number {
  const n = parseFloat(v.replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function compact(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

export function RoiCalculator({ price, currency, roi, currencyOptions }: Props) {
  const currencies = useMemo(
    () => (currencyOptions && currencyOptions.length ? currencyOptions : Object.keys(FALLBACK_RATES)),
    [currencyOptions],
  );
  const listPrice = useMemo(() => (typeof price === "string" ? parseFloat(price) : price ?? 0) || 0, [price]);
  const baseCurrency = (currency || "USD").toUpperCase();

  const [viewCurrency, setViewCurrency] = useState(baseCurrency);
  const [downPct, setDownPct] = useState(30);
  const [years, setYears] = useState(5);
  const [appreciation, setAppreciation] = useState(() => {
    const m = (roi ?? "").match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 7;
  });
  const [rentalYield, setRentalYield] = useState(7);

  const rate = FALLBACK_RATES[viewCurrency] ?? 1;
  const baseRate = FALLBACK_RATES[baseCurrency] ?? 1;
  const priceInView = listPrice > 0 ? (listPrice / baseRate) * rate : 0;
  const sym = viewCurrency === "USD" ? "$" : viewCurrency === "GBP" ? "£" : viewCurrency === "EUR" ? "€" : `${viewCurrency} `;

  const result = useMemo(() => {
    const down = (priceInView * downPct) / 100;
    const loan = priceInView - down;
    const annualRent = (priceInView * rentalYield) / 100;
    const monthlyNet = annualRent / 12;
    const grossYield = rentalYield;
    const netYield = down > 0 ? ((annualRent - loan * 0.05) / down) * 100 : grossYield; // 5% financing cost on balance
    const futureValue = priceInView * Math.pow(1 + appreciation / 100, years);
    const capitalGain = futureValue - priceInView;
    const rentalTotal = annualRent * years * 0.85; // 15% vacancy/ops allowance
    const equityMultiple = down > 0 ? (down + capitalGain + rentalTotal) / down : 0;
    const totalRoi = down > 0 ? ((capitalGain + rentalTotal) / down) * 100 : 0;
    return { down, loan, annualRent, monthlyNet, netYield, capitalGain, rentalTotal, equityMultiple, totalRoi };
  }, [priceInView, downPct, years, appreciation, rentalYield]);

  if (!(listPrice > 0)) return null;

  return (
    <section aria-label="ROI calculator" className="rounded-3xl border border-ink/8 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand"><Calculator className="h-4.5 w-4.5" aria-hidden /></span>
        <div>
          <h2 className="text-[17px] font-semibold tracking-tight text-ink">Investment calculator</h2>
          <p className="text-[12px] text-charcoal/70">Estimate returns — indicative only, not financial advice.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="roi-currency" className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-mist">Currency</label>
          <select id="roi-currency" value={viewCurrency} onChange={(e) => setViewCurrency(e.target.value)} className={inputCls}>
            {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="roi-down" className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-mist">Down payment: {downPct}%</label>
          <input id="roi-down" type="range" min={10} max={100} step={5} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} className="mt-3 w-full accent-[#1f8f3a]" />
        </div>
        <div>
          <label htmlFor="roi-years" className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-mist">Holding period: {years} years</label>
          <input id="roi-years" type="range" min={1} max={15} value={years} onChange={(e) => setYears(Number(e.target.value))} className="mt-3 w-full accent-[#1f8f3a]" />
        </div>
        <div>
          <label htmlFor="roi-app" className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-mist">Annual appreciation: {appreciation}%</label>
          <input id="roi-app" type="range" min={0} max={20} step={0.5} value={appreciation} onChange={(e) => setAppreciation(Number(e.target.value))} className="mt-3 w-full accent-[#1f8f3a]" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="roi-yield" className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-mist">Rental yield: {rentalYield}%</label>
          <input id="roi-yield" type="range" min={0} max={15} step={0.5} value={rentalYield} onChange={(e) => setRentalYield(Number(e.target.value))} className="w-full accent-[#1f8f3a]" />
        </div>
      </div>

      <motion.dl
        key={`${viewCurrency}-${downPct}-${years}-${appreciation}-${rentalYield}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {[
          { label: "Property price", value: `${sym}${compact(priceInView)}` },
          { label: "Your investment", value: `${sym}${compact(result.down)}` },
          { label: "Monthly rent (net)", value: `${sym}${compact(result.monthlyNet)}` },
          { label: "Net rental yield", value: `${result.netYield.toFixed(1)}%` },
          { label: `Capital gain in ${years}y`, value: `${sym}${compact(result.capitalGain)}` },
          { label: "Rental income (total)", value: `${sym}${compact(result.rentalTotal)}` },
          { label: "Equity multiple", value: `${result.equityMultiple.toFixed(2)}×` },
          { label: "Total ROI", value: `${result.totalRoi.toFixed(0)}%` },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl bg-ivory-deep/70 p-3", s.label === "Total ROI" && "bg-brand/10 ring-1 ring-brand/20")}>
            <dt className="text-[10px] uppercase tracking-wider text-mist">{s.label}</dt>
            <dd className={cn("mt-0.5 text-[16px] font-semibold tracking-tight text-ink", s.label === "Total ROI" && "text-brand")}>{s.value}</dd>
          </div>
        ))}
      </motion.dl>
      <p className="mt-3 text-[11px] leading-relaxed text-mist">
        Estimates use CMS-configured yield/appreciation defaults and indicative FX conversion (1 {baseCurrency} = {baseRate} USD). Actual returns depend on the developer payment plan, financing and market conditions.
      </p>
    </section>
  );
}
