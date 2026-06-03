"use client";

// Client helpers for the off-chain request broker API.
export type RequestStatus = "none" | "pending" | "approved" | "declined";

async function post(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function submitRequest(
  tanda: `0x${string}`,
  requester: `0x${string}`,
  signedMessage: `0x${string}`,
): Promise<{ status: RequestStatus }> {
  return post("/api/requests", { tanda, requester, signedMessage });
}

export async function fetchStatus(
  tanda: `0x${string}`,
  addr: `0x${string}`,
): Promise<{ status: RequestStatus; deadline?: number; ticket?: `0x${string}` }> {
  const res = await fetch(
    `/api/requests/status?tanda=${tanda}&addr=${addr}`,
  );
  if (!res.ok) throw new Error(`Status check failed (${res.status})`);
  return res.json();
}

export interface PendingRequest {
  requester: `0x${string}`;
  createdAt: number;
}

export async function listRequests(
  tanda: `0x${string}`,
  caller: `0x${string}`,
  sig: `0x${string}`,
): Promise<PendingRequest[]> {
  const res = await fetch(`/api/requests?tanda=${tanda}`, {
    headers: { "x-mitanda-caller": caller, "x-mitanda-sig": sig },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `List failed (${res.status})`);
  return data.requests ?? [];
}

export function approveRequest(
  tanda: `0x${string}`,
  requester: `0x${string}`,
  deadline: number,
  signature: `0x${string}`,
): Promise<{ status: RequestStatus }> {
  return post("/api/requests/approve", { tanda, requester, deadline, signature });
}

export function declineRequest(
  tanda: `0x${string}`,
  requester: `0x${string}`,
  caller: `0x${string}`,
  sig: `0x${string}`,
): Promise<{ status: RequestStatus }> {
  return post("/api/requests/decline", { tanda, requester, caller, sig });
}
