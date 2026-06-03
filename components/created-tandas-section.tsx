"use client";

import { useState } from "react";

import { useCreatedTandas, type CreatedTanda } from "@/lib/hooks/use-created-tandas";
import { RequestsManagerDialog } from "@/components/requests-manager-dialog";
import { ShareButton } from "@/components/share-link";
import { Inbox, Users } from "lucide-react";

/** Dashboard section listing tandas the connected wallet created. */
export function CreatedTandasSection() {
  const { tandas } = useCreatedTandas();
  if (tandas.length === 0) return null;
  return (
    <div className="rounded-card bg-background-card p-6 shadow-card">
      <h2 className="mb-4 text-h2">Created by you</h2>
      <ul className="space-y-3">
        {tandas.map((t) => (
          <CreatedRow key={t.id} t={t} />
        ))}
      </ul>
    </div>
  );
}

function CreatedRow({ t }: { t: CreatedTanda }) {
  const [manage, setManage] = useState(false);
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-h3 text-foreground">
          Tanda #{t.id}
          {t.isPrivate && (
            <span className="rounded-pill bg-accent-soft px-2.5 py-0.5 text-caption font-medium text-foreground-muted">
              private
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-caption text-foreground-muted">
          <Users className="size-3.5" />
          {t.activeCount}/{t.participantCount} joined
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {t.isPrivate && (
          <button
            type="button"
            onClick={() => setManage(true)}
            className="flex h-11 items-center gap-1.5 rounded-btn border border-border px-4 text-body font-semibold text-foreground transition-colors hover:bg-background-muted"
          >
            <Inbox className="size-4" />
            Requests
          </button>
        )}
        <ShareButton tandaId={BigInt(t.id)} />
      </div>
      {t.isPrivate && (
        <RequestsManagerDialog
          open={manage}
          onOpenChange={setManage}
          tandaAddress={t.address}
          tandaId={BigInt(t.id)}
        />
      )}
    </li>
  );
}
