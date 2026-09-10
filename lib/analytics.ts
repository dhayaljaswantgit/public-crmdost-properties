"use client";

import posthog from "posthog-js";

/**
 * PostHog for the public property site. Same contract as the rest of the
 * platform: constants only, `domain.object_verb` naming, and no PII in event
 * properties — this site collects visitor names and phone numbers in its
 * enquiry forms, and none of that may reach analytics.
 */
export const EVENTS = {
  PROPERTY_VIEWED: "property_site.property_viewed",
  FILTER_APPLIED: "property_site.filter_applied",
  AGENT_CONTACTED: "property_site.agent_contacted",
  ENQUIRY_SUBMITTED: "property_site.enquiry_submitted",
  ENQUIRY_FAILED: "property_site.enquiry_failed",
  MEETING_REQUESTED: "property_site.meeting_requested",
  DIRECT_LANDING_FAILED: "property_site.direct_landing_failed",
} as const;

export type PropertySiteEventName = (typeof EVENTS)[keyof typeof EVENTS];

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export function initAnalytics(): void {
  if (initialized || !KEY || typeof window === "undefined") return;
  initialized = true;

  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    persistence: "localStorage+cookie",
    cross_subdomain_cookie: true,
    secure_cookie: process.env.NODE_ENV === "production",
    // Never record visitor keystrokes on this site — the forms hold PII.
    disable_session_recording: true,
    // Web vitals only from real builds. In `next dev`, Fast Refresh resets the
    // browser's performance entries under PostHog's web-vitals add-on, which
    // then throws "Cannot read properties of undefined (reading 'startTime')"
    // on every idle tick — and dev timings are meaningless on the dashboard.
    ...(process.env.NODE_ENV === "production" ? {} : { capture_performance: false }),
  });
}

export function trackPageView(path: string): void {
  if (!initialized) return;
  posthog.capture("$pageview", { path });
}

export function track(
  event: PropertySiteEventName,
  properties: Record<string, string | number | boolean | undefined> = {},
): void {
  if (!initialized) return;
  posthog.capture(event, { site: "property_site", ...properties });
}
