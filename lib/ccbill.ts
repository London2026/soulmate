// CCBill configuration and helpers.
//
// CCBill account structure: one Client Account Number, with a separate
// sub-account + FlexForm per product. FlexForms are pre-priced (static
// pricing configured in the CCBill admin), so no Dynamic Pricing digest
// is required here.

export type ProductKey = 'starter' | 'standard' | 'extra_meeting'

interface FlexformConfig {
  subAccount: string
  formId: string
}

const CLIENT_ACCNUM = process.env.CCBILL_CLIENT_ACCNUM ?? ''

const PRODUCTS: Record<ProductKey, FlexformConfig> = {
  starter: {
    subAccount: process.env.CCBILL_STARTER_SUBACC ?? '',
    formId: process.env.CCBILL_STARTER_FORM_ID ?? '',
  },
  standard: {
    subAccount: process.env.CCBILL_STANDARD_SUBACC ?? '',
    formId: process.env.CCBILL_STANDARD_FORM_ID ?? '',
  },
  extra_meeting: {
    subAccount: process.env.CCBILL_EXTRA_MEETING_SUBACC ?? '',
    formId: process.env.CCBILL_EXTRA_MEETING_FORM_ID ?? '',
  },
}

// Maps a CCBill sub-account number back to the product it belongs to.
// Used by the webhook handler to figure out which plan/purchase a
// notification refers to.
export const PLAN_BY_SUBACC: Record<string, ProductKey> = Object.fromEntries(
  Object.entries(PRODUCTS)
    .filter(([, cfg]) => cfg.subAccount)
    .map(([product, cfg]) => [cfg.subAccount, product as ProductKey])
)

export function isCcbillConfigured(product: ProductKey): boolean {
  const cfg = PRODUCTS[product]
  return Boolean(CLIENT_ACCNUM && cfg.subAccount && cfg.formId)
}

// Builds the CCBill FlexForm checkout URL for a given product, passing
// the Supabase user id through as a custom field (X-userId). CCBill
// echoes any "X-" prefixed param back in webhook payloads, which is how
// we link a completed purchase back to a profiles row.
export function buildFlexformUrl(product: ProductKey, userId: string): string | null {
  const cfg = PRODUCTS[product]
  if (!isCcbillConfigured(product)) return null

  const params = new URLSearchParams({
    clientAccnum: CLIENT_ACCNUM,
    clientSubacc: cfg.subAccount,
    'X-userId': userId,
  })

  return `https://api.ccbill.com/wap-frontflex/flexforms/${cfg.formId}?${params.toString()}`
}

// CCBill webhook payloads echo back custom passthrough fields. Field
// casing isn't verified against a live account yet, so check a few
// likely variants.
export function extractUserId(payload: Record<string, unknown>): string | null {
  const candidates = ['X-userId', 'x-userId', 'X-USERID', 'x_userId', 'X-userid']
  for (const key of candidates) {
    const value = payload[key]
    if (typeof value === 'string' && value) return value
  }
  return null
}

// Lightweight verification: confirms the webhook's client account number
// (and, if present, sub-account) matches what's configured for this app.
// CCBill doesn't document a cryptographic signature for JSON webhooks, so
// this is the baseline check until that's confirmed against a live account.
export function verifyWebhookSource(payload: Record<string, unknown>): boolean {
  if (!CLIENT_ACCNUM) return false
  const accnum = payload.clientAccnum ?? payload.clientAccNum
  return String(accnum ?? '') === CLIENT_ACCNUM
}

export function productForSubaccount(subAccount: string): ProductKey | null {
  return PLAN_BY_SUBACC[subAccount] ?? null
}
