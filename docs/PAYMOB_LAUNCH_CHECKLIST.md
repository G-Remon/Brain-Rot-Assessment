# Pro launch status

Price confirmed by owner: EGP 50 for **three calendar months**, one payment, no automatic renewal.

## Implemented

- Google account required before using the application.
- Free: complete assessment, six domain scores, brief summary, three practical actions, newest saved result.
- Pro: detailed report, library, 14-day personal plan, historical comparisons, goals and capacity planning, focus sessions, distractions, sleep/energy diary, seven-day challenges, personal experiments, recall cards, long programs, weekly reviews and CSV/print export.
- Pro content is returned by the authenticated `mindreset-pro` Edge Function after checking the current database entitlement and expiration; premium exercise/rule data is absent from the frontend production bundle.
- RLS protects plans, history and Pro workspace. Browser clients cannot mutate entitlements. A changed client flag or clock cannot grant database access.
- Workspace writes use server timestamps as an optimistic concurrency token; a stale device cannot silently replace another device's saved state.
- Users may erase their own Pro data or all assessment history even if a subscription has expired.

## NOT implemented / NOT live

**No Paymob checkout, payment webhook, billing ledger, automatic activation, refund handling, or payment reconciliation has been enabled.** `paymentReady` is false and the purchase button is disabled. No sample payment or success redirect grants Pro. No live purchase or settlement has been tested. Do not present this as a working payment integration.

Paymob requires a merchant account, business verification, access to the dashboard, and integration credentials. The owner selected Paymob but has not yet supplied a provisioned merchant integration. Merchant identity, settlement account, legal acceptance and actual charges are completed by the owner in Paymob. Never place keys or personal documents in chat, GitHub or browser-visible environment variables.

Official references:
- https://developers.paymob.com/paymob-docs
- https://developers.paymob.com/paymob-docs/intention-apis/create-intention
- https://developers.paymob.com/paymob-docs/manage-callback/transaction-callbacks
- https://www.paymob.com/en/pricing

## Required before enabling purchases

1. Owner completes merchant onboarding and sees the actual fee schedule and settlement terms; confirm suitability for the EGP 50 price.
2. Confirm the selected hosting plan permits commercial use and expected production traffic. Do not upgrade a paid plan without owner approval.
3. Provision **test** Paymob integration first, following the current official regional Intention / Unified Checkout documentation and the account's configured payment methods. Do not invent billing identity fields or silently request recurring card consent.
4. Add the merchant's secret/public keys, allowed integration IDs and HMAC secret through server-side secret settings only. Credentials are missing today; no placeholder checkout should be published.
5. Build a server-created order bound to verified Supabase user ID, amount **5000 minor EGP units**, currency **EGP**, and a fixed three-calendar-month product. The client cannot set the price, owner, tier or expiry.
6. Redirect card/wallet data collection to Paymob's hosted checkout. Display only methods actually enabled for that merchant.
7. Authenticate processed callbacks using the current official HMAC algorithm, constant-time comparison and the exact signed fields. Bind the returned provider order to the stored order; independently check amount, currency, integration and final capture/payment status. A URL success query is never payment proof.
8. Use a database transaction, unique transaction/order identifiers and row locks so retries or concurrent callbacks cannot extend the same purchase twice. Extend three calendar months from max(current expiry, confirmed purchase time) once only.
9. Separate verified payment from settlement. Pro can open after payment confirmation; settlement to the merchant follows the provider's agreed schedule.
10. Implement refund/void/chargeback entitlement reconciliation and recovery for missed callbacks, with private operational audit data. Never log card details, full provider payloads, tokens or unnecessary personal data.
11. Test success, failure, pending, forged callbacks, changed amounts, changed owners, test-versus-live mismatch, duplicate callbacks, out-of-order events, expiration, refund, and reconciliation using the actual test merchant integration.
12. Owner completes any required live enablement; add live keys directly, perform the owner-approved real acceptance test, and only then set purchase availability true.

The production eligibility endpoint currently always reports `paymentReady: false` on purpose.
