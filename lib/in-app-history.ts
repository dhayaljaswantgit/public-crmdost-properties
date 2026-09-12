/**
 * Whether the visitor has moved between pages of this site since it loaded.
 *
 * Kept in memory on purpose: a full page load — opening a shared link, a
 * search result, or refreshing — starts at zero, so "Back" is only offered
 * when it would land on one of our own pages rather than WhatsApp, Google or
 * an empty tab. AnalyticsProvider calls noteRouteChange on every path change.
 */
let lastPath: string | null = null;
let clientNavigations = 0;

export function noteRouteChange(path: string): void {
  if (lastPath !== null && lastPath !== path) clientNavigations += 1;
  lastPath = path;
}

export function hasInAppHistory(): boolean {
  return clientNavigations > 0;
}
