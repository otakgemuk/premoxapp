// export-plans.mjs
// Build-time export: pull published plans from Sanity via GROQ and write
// ../data/plans.json (served at the site root via vite publicDir = ../data).
//
// Mirrors PLANS_QUERY in src/hooks/usePlans.ts exactly, so the generated
// static file is identical to what a runtime Sanity fetch would produce.
//
// Resilience: if Sanity is unreachable, misconfigured, or returns an empty
// set, we DO NOT overwrite the committed snapshot and we exit 0, so the build
// still succeeds on the last-known-good static data.

import { createClient } from '@sanity/client'
import { writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../../data/plans.json')

const projectId = process.env.SANITY_PROJECT_ID || '3d6emtst'
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_API_READ_TOKEN || undefined // only needed if dataset is private

const PLANS_QUERY = `*[_type == "plan" && firm->active == true] {
  "plan_id":             planId.current,
  "firm_id":             firm->firmId.current,
  "firm_name":           firm->name,
  "firm_slug":           firm->slug.current,
  "plan_label":          planLabel,
  "account_size":        accountSize,
  "account_type":        accountType,
  "is_one_time":         select(isOneTime == true => 1, 0),
  "drawdown_type":       drawdownType,
  "drawdown_amount":     drawdownAmount,
  "daily_loss_limit":    dailyLossLimit,
  "profit_target":       profitTarget,
  "profit_split":        profitSplit,
  "eval_fee":            evalFee,
  "activation_fee":      activationFee,
  "monthly_fee":         monthlyFee,
  "active_discount_pct": activeDiscountPct,
  "has_discount":        select(hasDiscount == true => 1, 0),
  "base_cost_to_funded": baseCostToFunded,
  "total_cost_to_funded": totalCostToFunded,
  "max_funded_accounts": maxFundedAccounts,
  "max_contracts":       maxContracts,
  "min_trading_days":    minTradingDays,
  "consistency_eval":    consistencyEval,
  "consistency_funded":  consistencyFunded,
  "payout_frequency":    payoutFrequency,
  "trustpilot":          firm->trustpilot,
  "website_url":         firm->websiteUrl,
  "logo_url":            firm->logo.asset->url,
  "affiliate_code":      firm->affiliateCode,
  "retail_eval_fee":     retailEvalFee,
  "price_verified":      select(priceVerified == true => 1, 0),
  "price_status":        priceStatus,
} | order(total_cost_to_funded asc)`

async function main() {
  try {
    const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })
    const rows = await client.fetch(PLANS_QUERY)

    if (!Array.isArray(rows) || rows.length === 0) {
      console.warn(
        `[export-plans] Sanity returned ${Array.isArray(rows) ? 0 : 'a non-array'} result \u2014 keeping existing plans.json, not overwriting.`,
      )
      process.exit(0)
    }

    writeFileSync(OUT, JSON.stringify(rows, null, 2) + '\n', 'utf8')
    console.log(`[export-plans] Wrote ${rows.length} plans -> data/plans.json (project ${projectId}/${dataset})`)
  } catch (err) {
    const msg = (err && err.message) || String(err)
    console.warn('[export-plans] Export failed, keeping existing plans.json. Reason:', msg)
    if (!existsSync(OUT)) {
      console.error('[export-plans] WARNING: no fallback plans.json exists \u2014 the site will have no data this build.')
    }
    process.exit(0) // never fail the build on an export hiccup
  }
}

main()
