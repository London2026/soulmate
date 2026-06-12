This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## CCBill Setup (Payments)

Subscriptions (Starter/Standard) and the Extra Meeting purchase are processed through [CCBill](https://www.ccbill.com/), via pre-priced FlexForms. The integration config lives in `lib/ccbill.ts`; the webhook handler is at `app/api/webhooks/ccbill/route.ts`.

Until the env vars below are set, `/pricing` and the extra-meeting purchase will return a 503 ("Payments are not configured yet").

### Go-live checklist

1. **Get your CCBill credentials.** From the CCBill admin, note your Client Account Number, then for each of the 3 products (Starter, Standard, Extra Meeting) create a sub-account + FlexForm with pricing pre-configured:
   - Starter — $6/mo recurring
   - Standard — $9/mo recurring
   - Extra Meeting — $3 one-time
2. **Enable webhooks.** In each sub-account's admin, turn on **Webhooks (JSON)**, point them at `https://www.mysoulmate.live/api/webhooks/ccbill`, and subscribe to: `NewSaleSuccess`, `RenewalSuccess`, `RenewalFailure`, `Cancellation`, `Expiration`, `Refund`, `Chargeback`, `Void`.
3. **Add env vars to Vercel** (Production), matching `.env.local.example`:
   ```
   CCBILL_CLIENT_ACCNUM=
   CCBILL_STARTER_SUBACC=
   CCBILL_STARTER_FORM_ID=
   CCBILL_STANDARD_SUBACC=
   CCBILL_STANDARD_FORM_ID=
   CCBILL_EXTRA_MEETING_SUBACC=
   CCBILL_EXTRA_MEETING_FORM_ID=
   ```
4. **Run the DB migration.** Execute `supabase/add_ccbill_columns.sql` in the Supabase SQL editor (adds `profiles.ccbill_subscription_id`).
5. **Test purchase.** Do one real test purchase per plan, then check Vercel logs for the `[ccbill webhook]` payload. Confirm `extractUserId` in `lib/ccbill.ts` finds the right field — if CCBill's actual payload doesn't echo back `X-userId` as expected, adjust the candidate field names there.

### Member billing & cancellation

CCBill has no Stripe-portal equivalent — members manage/cancel their subscription via CCBill's consumer support portal at [support.ccbill.com](https://support.ccbill.com/), using their email and the CCBill Subscription ID (shown in the app under Billing & Cancel Plan).
