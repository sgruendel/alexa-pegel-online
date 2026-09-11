// Leave time within Alexa's response window for cold starts and response delivery.
export const REQUEST_BUDGET_MS = 6000;
const RESPONSE_RESERVE_MS = 500;

export function createRequestSignal(context = {}) {
    const remaining = context.getRemainingTimeInMillis?.() ?? Infinity;
    return AbortSignal.timeout(Math.max(0, Math.min(REQUEST_BUDGET_MS, remaining - RESPONSE_RESERVE_MS)));
}
