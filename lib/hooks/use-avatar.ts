"use client";

import { useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";

import { avatarMessage } from "@/lib/request-messages";
import { sha256Hex } from "@/lib/avatar-hash";

export interface Profile {
  url: string | null;
  name: string | null;
}

const KEY = (a?: string) => ["profile", a?.toLowerCase()];
const EMPTY: Profile = { url: null, name: null };

/** Read one wallet's profile (photo + name), cached + deduped. */
export function useProfile(address?: string): {
  url: string | null;
  name: string | null;
  isLoading: boolean;
} {
  const q = useQuery<Profile>({
    queryKey: KEY(address),
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const r = await fetch(`/api/avatar?address=${address}`);
      if (!r.ok) return EMPTY;
      const j = await r.json();
      return { url: j.url ?? null, name: j.name ?? null };
    },
  });
  return { url: q.data?.url ?? null, name: q.data?.name ?? null, isLoading: q.isLoading };
}

/** Back-compat alias — some callers only need the photo url. */
export function useAvatar(address?: string): {
  url: string | null;
  isLoading: boolean;
} {
  const { url, isLoading } = useProfile(address);
  return { url, isLoading };
}

/**
 * Batch-load many wallets' profiles in one request and seed the per-address
 * cache, so a roster of N members triggers a single network call while each
 * row's useProfile()/Avatar reads from cache.
 */
export function useProfiles(addresses: string[]): {
  profiles: Record<string, Profile>;
  isLoading: boolean;
} {
  const qc = useQueryClient();
  const lowered = Array.from(
    new Set(addresses.map((a) => a.toLowerCase())),
  ).sort();
  const key = lowered.join(",");

  const q = useQuery<Record<string, Profile>>({
    queryKey: ["profiles", key],
    enabled: lowered.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const r = await fetch(`/api/avatar?addresses=${key}`);
      if (!r.ok) return {};
      const j = await r.json();
      return (j.profiles ?? {}) as Record<string, Profile>;
    },
  });

  // Seed each address's individual cache so Avatar/useProfile hit it.
  useEffect(() => {
    if (!q.data) return;
    for (const addr of lowered) {
      qc.setQueryData(KEY(addr), q.data[addr] ?? EMPTY);
    }
  }, [q.data, key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { profiles: q.data ?? {}, isLoading: q.isLoading };
}

/**
 * Update the connected wallet's profile (photo and/or name). Hashes the image,
 * signs an ownership message binding the hash + name, and POSTs — so the server
 * verifies the caller owns the wallet (on-chain) and nothing was swapped.
 */
export function useSetProfile() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dataUrl,
      name,
    }: {
      dataUrl?: string;
      name: string;
    }) => {
      if (!address) throw new Error("Connect your wallet first.");
      const cleanName = name.trim();
      const photoHash = dataUrl ? await sha256Hex(dataUrl) : "none";
      const signature = await signMessageAsync({
        message: avatarMessage(address, photoHash, cleanName),
      });
      const res = await fetch("/api/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, dataUrl, name: cleanName, signature }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Update failed");
      }
      return { dataUrl, name: cleanName };
    },
    onSuccess: ({ dataUrl, name }) => {
      const prev = qc.getQueryData<Profile>(KEY(address));
      qc.setQueryData<Profile>(KEY(address), {
        url: dataUrl ?? prev?.url ?? null,
        name: name || null,
      });
    },
  });
}
