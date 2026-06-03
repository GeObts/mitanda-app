"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

import { HeaderCard } from "@/components/mt/header-card";
import { ThemeToggle } from "@/components/mt/theme-toggle";
import { ConnectButton } from "@/components/mt/connect-button";
import { decodeInviteParams, type InvitePayload } from "@/lib/invite";
import { InviteRedeem, Card, ErrorCard } from "@/components/invite-redeem";
import { Wordmark } from "@/components/mt/wordmark";

// Direct invite-link redeem (advanced / per-address tickets). The request-based
// /join/<id> flow is the primary share path for private tandas.
export default function InvitePage() {
  const [payload, setPayload] = useState<InvitePayload | null | undefined>(
    undefined,
  );
  useEffect(() => {
    setPayload(decodeInviteParams(new URLSearchParams(window.location.search)));
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 bg-background px-6 py-8">
      <HeaderCard
        icon={
          <Image
            src="/mitanda-mark.png"
            alt="MiTanda logo"
            width={48}
            height={48}
            priority
            className="size-full object-contain"
          />
        }
        title={<Wordmark />}
        subtitle="Tanda invite"
        action={
          <div className="flex min-w-0 items-center gap-1">
            <ThemeToggle />
            <ConnectButton />
          </div>
        }
      />

      {payload === undefined ? (
        <Card>
          <Loader2 className="mx-auto size-6 animate-spin text-foreground-muted" />
        </Card>
      ) : payload === null ? (
        <ErrorCard
          title="Invalid invite link"
          body="This link is missing or malformed. Ask the tanda creator to send a fresh one."
        />
      ) : (
        <InviteRedeem payload={payload} />
      )}
    </main>
  );
}
