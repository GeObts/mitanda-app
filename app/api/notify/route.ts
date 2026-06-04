import { bad } from "@/lib/server/respond";
import {
  sendNotification,
  notificationsConfigured,
  NotificationsNotConfigured,
} from "@/lib/server/base-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/notify — send a Base App in-app notification.
 *
 * ADMIN-ONLY. Protected by a shared secret: send header `x-admin-secret`
 * matching the NOTIFY_ADMIN_SECRET env var. This is a server-to-server trigger
 * (cron, ops script, or your backend) — never call it from the browser, and
 * never ship the secret to the client.
 *
 * Body: { title, message, targetPath?, walletAddresses? }
 *   - title:          ≤ 30 chars
 *   - message:        ≤ 200 chars
 *   - targetPath:     optional in-app deep link, must start with "/"
 *   - walletAddresses: optional; if omitted, sends to ALL opted-in users
 */
export async function POST(request: Request) {
  const secret = process.env.NOTIFY_ADMIN_SECRET;
  if (!secret) return bad("Notifications are not enabled (NOTIFY_ADMIN_SECRET unset).", 503);
  if (request.headers.get("x-admin-secret") !== secret) {
    return bad("Unauthorized", 401);
  }
  if (!notificationsConfigured()) {
    return bad("Base notifications are not configured on this deployment.", 503);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return bad("Invalid JSON");

  const { title, message, targetPath, walletAddresses } = body as {
    title?: unknown;
    message?: unknown;
    targetPath?: unknown;
    walletAddresses?: unknown;
  };

  if (typeof title !== "string" || typeof message !== "string") {
    return bad("title and message are required strings");
  }
  if (targetPath !== undefined && typeof targetPath !== "string") {
    return bad("targetPath must be a string");
  }
  if (
    walletAddresses !== undefined &&
    (!Array.isArray(walletAddresses) ||
      !walletAddresses.every((a) => typeof a === "string"))
  ) {
    return bad("walletAddresses must be an array of strings");
  }

  try {
    const result = await sendNotification({
      title,
      message,
      targetPath,
      walletAddresses: walletAddresses as string[] | undefined,
    });
    return Response.json(result);
  } catch (err) {
    if (err instanceof NotificationsNotConfigured) {
      return bad(err.message, 503);
    }
    const msg = err instanceof Error ? err.message : "send failed";
    // Validation errors from the client (length/path) are 400; upstream is 502.
    const isValidation = /must (be|start)|required|characters/.test(msg);
    return bad(msg, isValidation ? 400 : 502);
  }
}
