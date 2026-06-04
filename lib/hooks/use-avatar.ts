"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";

import { avatarMessage } from "@/lib/request-messages";
import { sha256Hex } from "@/lib/avatar-hash";

const KEY = (a?: string) => ["avatar", a?.toLowerCase()];

/** Read one wallet's uploaded profile photo (data URL), cached + deduped. */
export function useAvatar(address?: string): {
  url: string | null;
  isLoading: boolean;
} {
  const q = useQuery({
    queryKey: KEY(address),
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const r = await fetch(`/api/avatar?address=${address}`);
      if (!r.ok) return null;
      const j = await r.json();
      return (j.url as string | null) ?? null;
    },
  });
  return { url: q.data ?? null, isLoading: q.isLoading };
}

/**
 * Upload the connected wallet's profile photo. Hashes the image, signs an
 * ownership message that binds that hash, and POSTs — so the server can verify
 * the caller owns the wallet (on-chain) and that the image wasn't swapped.
 */
export function useSetAvatar() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (dataUrl: string) => {
      if (!address) throw new Error("Connect your wallet first.");
      const photoHash = await sha256Hex(dataUrl);
      const signature = await signMessageAsync({
        message: avatarMessage(address, photoHash),
      });
      const res = await fetch("/api/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, dataUrl, signature }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Upload failed");
      }
      return dataUrl;
    },
    onSuccess: (dataUrl) => {
      qc.setQueryData(KEY(address), dataUrl);
    },
  });
}
