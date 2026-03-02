import { SupabaseClient } from '@supabase/supabase-js';
import { createHash, createHmac } from 'node:crypto';

const STRAVA_BASE_URL = 'https://www.strava.com';
const STRAVA_AUTH_URL = `${STRAVA_BASE_URL}/oauth/authorize`;
const STRAVA_TOKEN_URL = `${STRAVA_BASE_URL}/oauth/token`;
const STRAVA_ACTIVITIES_URL = `${STRAVA_BASE_URL}/api/v3/athlete/activities`;

function getStravaClientId(): string {
  const id = process.env.STRAVA_CLIENT_ID;
  return (typeof id === 'string' ? id.trim() : '') || '';
}

function getStravaClientSecret(): string {
  const secret = process.env.STRAVA_CLIENT_SECRET;
  return (typeof secret === 'string' ? secret.trim() : '') || '';
}

const STRAVA_WEBHOOK_SECRET = process.env.STRAVA_WEBHOOK_SECRET;

const SCOPE = 'activity:read_all,activity:read';
const PER_PAGE = 50;
const MAX_PAGES = 3;

function ensureClientConfig(): void {
  const id = getStravaClientId();
  const secret = getStravaClientSecret();
  if (!id || !secret) {
    throw new Error('Strava client credentials are not configured. Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in .env.local and restart the dev server.');
  }
}

function stableUuid(value: string) {
  const hash = createHash('sha256').update(value).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export interface StravaTokenResult {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete: Record<string, unknown>;
}

export interface StoredStravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete_id: number;
  athlete_profile: Record<string, unknown>;
  stored_at?: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  workout_type: number | null;
  start_date_local: string;
  average_speed: number | null;
  max_speed: number | null;
  average_heartrate?: number | null;
  max_heartrate?: number | null;
  external_id: string | null;
  map?: { summary_polyline?: string | null };
}

export interface StravaActivityRow {
  id: string;
  user_id: string;
  strava_id: number;
  name: string;
  activity_type: string;
  distance_meters: number;
  duration_seconds: number;
  start_time: string;
  average_heartrate: number | null;
  max_heartrate: number | null;
  pace: Record<string, number | null>;
  raw: Record<string, unknown>;
  synced_at: string;
}

export interface RateLimitInfo {
  userUsage: number;
  userLimit: number;
  appUsage: number;
  appLimit: number;
}

function buildAuthState(userId: string) {
  return Buffer.from(userId).toString('base64');
}

export function buildStravaAuthUrl({ userId, redirectUri }: { userId: string; redirectUri: string }) {
  ensureClientConfig();
  const state = buildAuthState(userId);
  const params = new URLSearchParams({
    client_id: getStravaClientId(),
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: SCOPE,
    state,
  });

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

export function decodeState(state: string) {
  try {
    return Buffer.from(state, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

async function tokenRequest(body: URLSearchParams) {
  ensureClientConfig();
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const payload = await response.text();
    const status = response.status;
    if (status === 401 || payload.toLowerCase().includes('invalid') || payload.toLowerCase().includes('api key')) {
      throw new Error(
        'Strava rejected the client credentials. Check that STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in .env.local match your Strava API Application (https://www.strava.com/settings/api) exactly, then restart the dev server. Do not regenerate the Client Secret unless you reconnect Strava afterward.'
      );
    }
    throw new Error(`Strava token request failed (${status}): ${payload}`);
  }

  const data = (await response.json()) as StravaTokenResult;
  return data;
}

export async function exchangeCodeForToken(code: string) {
  const body = new URLSearchParams({
    client_id: getStravaClientId(),
    client_secret: getStravaClientSecret(),
    code,
    grant_type: 'authorization_code',
  });

  return tokenRequest(body);
}

export async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: getStravaClientId(),
    client_secret: getStravaClientSecret(),
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  return tokenRequest(body);
}

export async function fetchStravaActivities(accessToken: string, after?: number) {
  const activities: StravaActivity[] = [];
  let page = 1;
  let rateLimit: RateLimitInfo | null = null;

  while (page <= MAX_PAGES) {
    const params = new URLSearchParams({
      per_page: PER_PAGE.toString(),
      page: page.toString(),
    });

    if (after) {
      params.set('after', Math.floor(after).toString());
    }

    const response = await fetch(`${STRAVA_ACTIVITIES_URL}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    rateLimit = parseRateLimit(response.headers) ?? rateLimit;

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(`Strava activities request failed (${response.status}): ${payload}`);
    }

    const pageData = (await response.json()) as StravaActivity[];

    if (!pageData.length) {
      break;
    }

    activities.push(...pageData);

    if (rateLimit && rateLimit.appUsage >= rateLimit.appLimit) {
      break;
    }

    page += 1;
  }

  return { activities, rateLimit } as const;
}

export function parseRateLimit(headers: Headers) {
  const usage = headers.get('x-ratelimit-usage');
  if (!usage) {
    return null;
  }

  const [userSegment, appSegment] = usage.split(',').map((segment) => segment.trim());

  const parseSegment = (segment = '0/0') => {
    const [used, limit] = segment.split('/').map((value) => Number(value));
    return {
      used: Number.isNaN(used) ? 0 : used,
      limit: Number.isNaN(limit) ? 0 : limit,
    };
  };

  const user = parseSegment(userSegment);
  const app = parseSegment(appSegment);

  return {
    userUsage: user.used,
    userLimit: user.limit,
    appUsage: app.used,
    appLimit: app.limit,
  } satisfies RateLimitInfo;
}

export function mapActivityToRow(activity: StravaActivity, userId: string): StravaActivityRow {
  return {
    id: stableUuid(`strava-activity-${userId}-${activity.id}`),
    user_id: userId,
    strava_id: activity.id,
    name: activity.name,
    activity_type: activity.type,
    distance_meters: activity.distance,
    duration_seconds: activity.moving_time,
    start_time: new Date(activity.start_date_local).toISOString(),
    average_heartrate: activity.average_heartrate ?? null,
    max_heartrate: activity.max_heartrate ?? null,
    pace: {
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
    },
    raw: {
      ...activity,
    },
    synced_at: new Date().toISOString(),
  };
}

export async function upsertStravaActivities(
  client: SupabaseClient,
  userId: string,
  activities: StravaActivity[],
) {
  if (!activities.length) {
    return;
  }

  const rows = activities.map((activity) => mapActivityToRow(activity, userId));
  const { error } = await client.from('strava_activities').upsert(rows, {
    onConflict: 'id',
  });

  if (error) {
    throw error;
  }
}

async function fetchUserProfile(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from('users')
    .select('athlete_profile')
    .eq('id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data?.athlete_profile ?? {};
}

export async function getStoredStravaTokens(client: SupabaseClient, userId: string): Promise<StoredStravaTokens | null> {
  const profile = await fetchUserProfile(client, userId);
  return (profile?.strava as StoredStravaTokens) ?? null;
}

export async function persistStravaTokens(
  client: SupabaseClient,
  userId: string,
  tokens: StoredStravaTokens,
): Promise<StoredStravaTokens> {
  const profile = await fetchUserProfile(client, userId);
  const merged = {
    ...profile,
    strava: {
      ...profile?.strava,
      ...tokens,
      stored_at: new Date().toISOString(),
    },
  };

  const { error } = await client.from('users').update({ athlete_profile: merged }).eq('id', userId);

  if (error) {
    throw error;
  }

  return merged.strava as StoredStravaTokens;
}

export async function storeTokenFromCode(client: SupabaseClient, userId: string, token: StravaTokenResult) {
  return persistStravaTokens(client, userId, {
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: token.expires_at,
    athlete_id: Number(token.athlete?.id ?? 0),
    athlete_profile: token.athlete,
  });
}

export async function ensureFreshStravaTokens(client: SupabaseClient, userId: string) {
  const stored = await getStoredStravaTokens(client, userId);

  if (!stored) {
    throw new Error('Connect Strava before syncing activities');
  }

  const now = Math.floor(Date.now() / 1000);

  if (stored.expires_at - now < 60) {
    const refreshed = await refreshAccessToken(stored.refresh_token);
    return persistStravaTokens(client, userId, {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: refreshed.expires_at,
      athlete_id: Number(refreshed.athlete?.id ?? 0),
      athlete_profile: refreshed.athlete,
    });
  }

  return stored;
}

export function verifyWebhookSignature(payload: string, signature: string | null) {
  if (!STRAVA_WEBHOOK_SECRET) {
    return false;
  }

  if (!signature) {
    return false;
  }

  const computed = createHmac('sha256', STRAVA_WEBHOOK_SECRET).update(payload).digest('hex');
  return computed === signature;
}
