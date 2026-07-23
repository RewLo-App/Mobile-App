/** The sole source of the current-user ID after JWT middleware succeeds. */
export function authenticatedUserId(request: { auth?: { userId: number } }) {
  return request.auth?.userId ?? null;
}
