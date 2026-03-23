
export type TrackEvent =
  | 'landing_view'
  | 'upload_click'
  | 'photo_uploaded'
  | 'camera_click'
  | 'demo_opened'
  | 'demo_emoji_selected'
  | 'generate_started'
  | 'generate_success'
  | 'generate_failed'
  | 'before_after_toggled'
  | 'png_download_clicked'
  | 'jpg_download_clicked'
  | 'print_clicked'
  | 'enhance_clicked'
  | 'feedback_shown'
  | 'feedback_submitted'
  | 'feedback_dismissed';

interface EventData {
  event: TrackEvent;
  properties?: Record<string, unknown>;
  timestamp: string;
}

const STORAGE_KEY = 'colorpage_events';
const MAX_STORED = 200;

export function track(event: TrackEvent, properties?: Record<string, unknown>) {
  const entry: EventData = {
    event,
    properties,
    timestamp: new Date().toISOString(),
  };

  // Console log for dev visibility
  console.log(`[track] ${event}`, properties ?? '');

  // Store locally for review
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const events: EventData[] = raw ? JSON.parse(raw) : [];
    events.push(entry);
    if (events.length > MAX_STORED) events.splice(0, events.length - MAX_STORED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // localStorage full or unavailable — ignore
  }

  // TODO: swap for real analytics provider (PostHog, Mixpanel, etc.)
  // Example: window.posthog?.capture(event, properties);
}

export function getStoredEvents(): EventData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
