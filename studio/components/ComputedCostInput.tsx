import {useEffect} from 'react'
import {set, useFormValue, type NumberInputProps} from 'sanity'

// Auto-calculates baseCostToFunded and totalCostToFunded from sibling pricing
// fields, renders them read-only, and keeps the stored value in sync.
//
// Branches (totalCostToFunded):
//   Instant (isOneTime)            -> eval only
//   NexGen (discountAppliesToEvalOnly) -> (eval x (1 - disc)) + activation
//   Standard                       -> (eval + activation) x (1 - disc)
//
// baseCostToFunded = pre-discount cost: eval (+ activation unless one-time)
//
// The same component drives both fields; it switches on schemaType.name.
// Props typed as NumberInputProps (type import is erased at build).

const round2 = (n: number) => Math.round(n * 100) / 100

export function ComputedCostInput(props: NumberInputProps) {
  const {onChange, value} = props
  const fieldName = props.schemaType.name

  const evalFee = Number(useFormValue(['evalFee']) ?? 0)
  const activationFee = Number(useFormValue(['activationFee']) ?? 0)
  const rawDiscount = Number(useFormValue(['activeDiscountPct']) ?? 0)
  const isOneTime = Boolean(useFormValue(['isOneTime']))
  const evalOnlyDiscount = Boolean(useFormValue(['discountAppliesToEvalOnly']))

  const discountPct = Number.isFinite(rawDiscount) ? rawDiscount : 0
  const d = 1 - discountPct / 100

  let computed = 0
  let formula = ''

  if (fieldName === 'baseCostToFunded') {
    computed = isOneTime ? evalFee : evalFee + activationFee
    formula = isOneTime ? 'Instant -> eval only' : 'eval + activation (pre-discount)'
  } else {
    if (isOneTime) {
      computed = evalFee
      formula = 'Instant -> eval only'
    } else if (evalOnlyDiscount) {
      computed = evalFee * d + activationFee
      formula = 'NexGen -> (eval x (1 - disc)) + activation'
    } else {
      computed = (evalFee + activationFee) * d
      formula = 'Standard -> (eval + activation) x (1 - disc)'
    }
  }

  computed = round2(computed)

  useEffect(() => {
    if (value !== computed) onChange(set(computed))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computed])

  const drift = value != null && value !== computed

  return (
    <div
      style={{
        border: '1px solid var(--card-border-color, #e3e4e8)',
        borderRadius: 6,
        padding: '12px 14px',
        background: 'var(--card-bg-color, #fbfcfe)',
        fontFamily: 'inherit',
      }}
    >
      <div style={{fontSize: 22, fontWeight: 600, lineHeight: 1.1}}>
        ${computed.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}
      </div>
      <div style={{fontSize: 12, opacity: 0.65, marginTop: 4}}>Auto-calculated &middot; {formula}</div>
      {drift && (
        <div style={{fontSize: 12, color: '#b8860b', marginTop: 4}}>
          stored value was {String(value)} &mdash; syncing to computed
        </div>
      )}
    </div>
  )
}
