// usePlans.ts
// Fetches plans from Sanity CMS via GROQ query.
// Falls back to local plans.json if Sanity env vars are not set.

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@sanity/client'

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlanFilters {
  accountSize?: number
  accountTypes?: string[]
  drawdowns?: string[]
  firmIds?: string[]
  search?: string
  sortValue?: string
  page?: number
  pageSize?: number
}

export interface PlanRow {
  plan_id: string
  firm_id: string
  firm_name: string
  firm_slug: string
  plan_label: string
  account_size: number
  account_type: string
  is_one_time: number
  drawdown_type: string
  drawdown_amount: number | null
  daily_loss_limit: number | null
  profit_target: number | null
  profit_split: number | null
  eval_fee: number
  activation_fee: number
  monthly_fee: number
  active_discount_pct: number
  has_discount: number
  base_cost_to_funded: number
  total_cost_to_funded: number
  max_funded_accounts: number | null
  max_contracts: number | null
  min_trading_days: number | null
  consistency_eval: number | null
  consistency_funded: number | null
  payout_frequency: string | null
  trustpilot: number | null
  website_url: string | null
  logo_url: string | null
  affiliate_code: string | null
  price_verified: number
  price_status: string
}

// ── Sanity Client ────────────────────────────────────────────────────────────

const PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID
const DATASET    = import.meta.env.VITE_SANITY_DATASET ?? 'production'
const USE_SANITY = !!PROJECT_ID

const sanityClient = USE_SANITY
  ? createClient({
      projectId: PROJECT_ID,
      dataset:   DATASET,
      apiVersion: '2024-01-01',
      useCdn: true,
    })
  : null

// ── GROQ Query ───────────────────────────────────────────────────────────────

const PLANS_QUERY = `
*[_type == "plan" && firm->active == true] {
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
  "price_verified":      select(priceVerified == true => 1, 0),
  "price_status":        priceStatus,
}
`

// ── Sort Keys ────────────────────────────────────────────────────────────────

const SORT_KEYS: Record<string, (row: PlanRow) => number | string> = {
  total_cost:   (r) => r.total_cost_to_funded,
  eval_fee:     (r) => r.eval_fee,
  account_size: (r) => r.account_size,
  firm_name:    (r) => r.firm_name,
  profit_target:(r) => r.profit_target ?? 0,
  drawdown:     (r) => r.drawdown_amount ?? 0,
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePlans(filters: PlanFilters) {
  const [allPlans, setAllPlans] = useState<PlanRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    accountSize, accountTypes = [], drawdowns = [],
    firmIds = [], search = '', sortValue = 'total_cost:asc',
    page = 1, pageSize = 50,
  } = filters

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    const load = async () => {
      try {
        let json: PlanRow[]

        if (USE_SANITY && sanityClient) {
          json = await sanityClient.fetch(PLANS_QUERY)
        } else {
          // Fallback to local plans.json
          const res = await fetch('./plans.json')
          if (!res.ok) throw new Error(`Failed to load plans.json: ${res.status}`)
          json = await res.json()
        }

        if (!cancelled) setAllPlans(json)
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to load plans')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const firms = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of allPlans) map.set(p.firm_id, p.firm_name)
    return Array.from(map, ([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allPlans])

  const data = useMemo(() => {
    let rows = [...allPlans]

    if (accountSize && accountSize > 0) {
      if (accountSize === 250000) {
        rows = rows.filter((r) => r.account_size >= 250000)
      } else {
        rows = rows.filter((r) => r.account_size === accountSize)
      }
    }
    if (accountTypes.length) {
      const set = new Set(accountTypes)
      rows = rows.filter((r) => set.has(r.account_type || 'Standard'))
    }
    if (drawdowns.length) {
      const set = new Set(drawdowns)
      rows = rows.filter((r) => set.has(r.drawdown_type))
    }
    if (firmIds.length) {
      const set = new Set(firmIds)
      rows = rows.filter((r) => set.has(r.firm_id))
    }
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.firm_name.toLowerCase().includes(q) ||
          r.plan_label.toLowerCase().includes(q)
      )
    }

    const [sortField, sortDir] = sortValue.split(':') as [string, 'asc' | 'desc']
    const keyFn = SORT_KEYS[sortField] ?? SORT_KEYS['total_cost']
    rows.sort((a, b) => {
      const va = keyFn(a)
      const vb = keyFn(b)
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
      return sortDir === 'desc' ? -cmp : cmp
    })

    const total = rows.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const paged = rows.slice(start, start + pageSize)

    return { rows: paged, total, totalPages }
  }, [allPlans, accountSize, accountTypes, drawdowns, firmIds, search, sortValue, page, pageSize])

  return {
    data: data.rows,
    allPlans,
    pagination: { total: data.total, totalPages: data.totalPages, page, pageSize },
    isLoading,
    error,
    firms,
  }
}
