// Server-side client for the Base App notifications REST API.
//
// Lets MiTanda send in-app notifications (payment due, your turn to receive,
// someone joined, etc.) to users who pinned the app in the Base App and opted
// into notifications. Docs: https://docs.base.org/apps/technical-guides/base-notifications
//
// Config (set as secrets on the Base App deployment):
//   BASE_NOTIFICATIONS_API_KEY   — from your Base Dashboard / base.dev project
//   BASE_APP_URL (or NEXT_PUBLIC_APP_URL) — the registered app URL (the `app_url`)
//
// All calls are no-ops (throw `NotificationsNotConfigured`) when the key is
// missing, so importing this in a non-Base build is harmless.
import { getCloudflareContext } from "@opennextjs/cloudflare";

const API_BASE = "https://dashboard.base.org/api/v1";

/** Read a server env var from process.env, falling back to the Workers env. */
function serverEnv(key: string): string | undefined {
  const fromProcess = process.env[key];
  if (fromProcess) return fromProcess;
  try {
    const { env } = getCloudflareContext();
    const v = (env as Record<string, unknown>)[key];
    return typeof v === "string" ? v : undefined;
  } catch {
    return undefined;
  }
}

export class NotificationsNotConfigured extends Error {
  constructor() {
    super("Base notifications are not configured (BASE_NOTIFICATIONS_API_KEY missing).");
    this.name = "NotificationsNotConfigured";
  }
}

function config(): { apiKey: string; appUrl: string } {
  const apiKey = serverEnv("BASE_NOTIFICATIONS_API_KEY");
  const appUrl =
    serverEnv("BASE_APP_URL") ?? serverEnv("NEXT_PUBLIC_APP_URL") ?? "";
  if (!apiKey || !appUrl) throw new NotificationsNotConfigured();
  return { apiKey, appUrl: appUrl.replace(/\/+$/, "") };
}

export function notificationsConfigured(): boolean {
  return (
    !!serverEnv("BASE_NOTIFICATIONS_API_KEY") &&
    !!(serverEnv("BASE_APP_URL") ?? serverEnv("NEXT_PUBLIC_APP_URL"))
  );
}

async function api<T>(
  path: string,
  init: RequestInit,
  apiKey: string,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Base notifications ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as T;
}

export interface UserStatus {
  appPinned: boolean;
  notificationsEnabled: boolean;
}

/** Whether a single wallet has pinned the app and enabled notifications. */
export async function getUserStatus(walletAddress: string): Promise<UserStatus> {
  const { apiKey, appUrl } = config();
  return api<UserStatus>(
    "/notifications/app/user/status",
    {
      method: "POST",
      body: JSON.stringify({ app_url: appUrl, wallet_address: walletAddress }),
    },
    apiKey,
  );
}

interface UsersPage {
  success: boolean;
  users: { address: string; notificationsEnabled: boolean }[];
  nextCursor?: string;
}

/** All wallet addresses opted into notifications (auto-paginates). */
export async function listOptedInAddresses(): Promise<string[]> {
  const { apiKey, appUrl } = config();
  const out: string[] = [];
  let cursor: string | undefined;
  do {
    const qs = new URLSearchParams({
      app_url: appUrl,
      notification_enabled: "true",
      limit: "500",
    });
    if (cursor) qs.set("cursor", cursor);
    const page: UsersPage = await api(
      `/notifications/app/users?${qs.toString()}`,
      { method: "GET" },
      apiKey,
    );
    for (const u of page.users ?? []) out.push(u.address);
    cursor = page.nextCursor || undefined;
  } while (cursor);
  return out;
}

export interface SendResult {
  success: boolean;
  results: { walletAddress: string; sent: boolean; failureReason?: string }[];
  sentCount: number;
  failedCount: number;
}

export interface SendInput {
  /** Recipient wallets. If omitted, sends to ALL opted-in users. */
  walletAddresses?: string[];
  /** Max 30 chars. */
  title: string;
  /** Max 200 chars. */
  message: string;
  /** In-app deep link; must start with "/". */
  targetPath?: string;
}

const MAX_PER_SEND = 1000; // API cap per request.

/**
 * Send a notification. Validates length limits, resolves the audience (explicit
 * list or all opted-in users), and chunks into ≤1000-address requests. Returns
 * the aggregate result.
 */
export async function sendNotification(input: SendInput): Promise<SendResult> {
  const { apiKey, appUrl } = config();

  const title = input.title.trim();
  const message = input.message.trim();
  if (!title || title.length > 30) {
    throw new Error("title is required and must be ≤ 30 characters.");
  }
  if (!message || message.length > 200) {
    throw new Error("message is required and must be ≤ 200 characters.");
  }
  if (input.targetPath && !input.targetPath.startsWith("/")) {
    throw new Error('targetPath must start with "/".');
  }

  const audience =
    input.walletAddresses && input.walletAddresses.length > 0
      ? input.walletAddresses
      : await listOptedInAddresses();

  const agg: SendResult = {
    success: true,
    results: [],
    sentCount: 0,
    failedCount: 0,
  };
  if (audience.length === 0) return agg;

  for (let i = 0; i < audience.length; i += MAX_PER_SEND) {
    const chunk = audience.slice(i, i + MAX_PER_SEND);
    const res = await api<SendResult>(
      "/notifications/send",
      {
        method: "POST",
        body: JSON.stringify({
          app_url: appUrl,
          wallet_addresses: chunk,
          title,
          message,
          ...(input.targetPath ? { target_path: input.targetPath } : {}),
        }),
      },
      apiKey,
    );
    agg.results.push(...(res.results ?? []));
    agg.sentCount += res.sentCount ?? 0;
    agg.failedCount += res.failedCount ?? 0;
    agg.success = agg.success && res.success;
  }
  return agg;
}
