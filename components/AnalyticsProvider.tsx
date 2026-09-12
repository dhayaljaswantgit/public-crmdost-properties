"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics, trackPageView } from "../lib/analytics";
import { noteRouteChange } from "../lib/in-app-history";

/**
 * Initializes PostHog once and emits a pageview on every client-side route
 * change. useSearchParams forces a Suspense boundary in the App Router, hence
 * the split inner component.
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
      noteRouteChange(pathname);
    }
    // searchParams is included so a ?plan= change on the same path still counts.
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
