/**
 * How many songs one "fill in details" pass handles.
 *
 * Small on purpose: each song costs an iTunes lookup, and the whole action
 * runs inside one serverless function with a short timeout. Doing the lot in
 * a single request would fail partway through on a real catalogue.
 *
 * It lives here rather than in actions.ts because a "use server" file may
 * only export async functions.
 */
export const BATCH_SIZE = 10;
