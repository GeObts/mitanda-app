import { getCetesRate, EtherfuseApiError } from "@/lib/etherfuse/client";

export const runtime = "nodejs";
// Cache the public CETES rate briefly — it moves slowly and this keeps us off
// Etherfuse's gateway on every render.
export const revalidate = 60;

// GET /api/etherfuse/cetes-rate — live CETES interest rate for the YieldSection.
// Proxies the public /lookup/bonds/cost/CETES endpoint (server-side avoids CORS)
// and normalizes it to { apyBps, apyPct, ... }.
export async function GET() {
  try {
    const cost = await getCetesRate();
    const apyBps = cost.current_basis_points;
    return Response.json(
      {
        apyBps,
        apyPct: apyBps / 100, // 313 bps → 3.13 (%)
        bondCostFiat: cost.bond_cost_in_fiat,
        bondCostUsd: cost.bond_cost_in_usd,
        currency: cost.currency,
        asOf: cost.current_time,
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (e) {
    const status = e instanceof EtherfuseApiError ? e.status || 502 : 500;
    return Response.json({ error: "Could not load CETES rate" }, { status });
  }
}
