"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, CheckCircle2, AlertTriangle, Camera } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/mt/avatar";
import { useProfile, useSetProfile } from "@/lib/hooks/use-avatar";
import { useT } from "@/lib/i18n";

const OUTPUT_SIZE = 256; // square px stored
const MAX_NAME = 40;

/** Center-crop + resize an image File to a square JPEG data URL. */
function fileToSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("That doesn't look like an image."));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported."));
        ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function AvatarUploadDialog({
  open,
  onOpenChange,
  address,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <ProfileContent
          key={open ? "open" : "closed"}
          address={address}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function ProfileContent({
  address,
  onDone,
}: {
  address?: string;
  onDone: () => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // null until the user edits — until then we show the saved name (derived, so
  // we never need to setState from an effect when the profile loads).
  const [typedName, setTypedName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const existing = useProfile(address);
  const setProfile = useSetProfile();
  const name = typedName ?? existing.name ?? "";

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFileError(t("profile.errImage"));
      return;
    }
    try {
      setPreview(await fileToSquareDataUrl(file));
    } catch (err) {
      setFileError(err instanceof Error ? err.message : t("profile.errLoad"));
    }
  }

  if (setProfile.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <h2 className="text-h2">{t("profile.updatedTitle")}</h2>
        <p className="max-w-xs text-body text-foreground-muted">
          {t("profile.updatedBody")}
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-2 flex w-full items-center justify-center rounded-btn bg-primary px-5 py-3 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          {t("common.done")}
        </button>
      </div>
    );
  }

  const canSave = (!!preview || name.trim().length > 0) && !setProfile.isPending;

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-h2">{t("profile.title")}</DialogTitle>
        <DialogDescription>{t("profile.desc")}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="size-24 rounded-full object-cover shadow-card"
            />
          ) : (
            <Avatar address={address} size={96} className="shadow-card" />
          )}
          <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
            <Camera className="size-3.5" />
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onPick}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-btn border border-border px-4 py-2.5 text-body font-medium text-foreground transition-colors hover:bg-background-muted"
        >
          <Upload className="size-4" />
          {preview ? t("profile.changePhoto") : t("profile.choosePhoto")}
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-caption font-semibold text-foreground">
          {t("profile.displayName")}
        </label>
        <input
          value={name}
          maxLength={MAX_NAME}
          placeholder={t("profile.namePlaceholder")}
          onChange={(e) => setTypedName(e.target.value)}
          className="w-full rounded-btn border border-border bg-background px-3 py-2.5 text-body text-foreground outline-none transition-colors placeholder:text-foreground-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-accent dark:focus:ring-accent/20"
        />
      </div>

      {fileError && (
        <p className="flex items-center gap-1.5 text-caption text-danger">
          <AlertTriangle className="size-3.5 shrink-0" /> {fileError}
        </p>
      )}
      {setProfile.isError && (
        <p className="flex items-center gap-1.5 text-caption text-danger">
          <AlertTriangle className="size-3.5 shrink-0" />
          {setProfile.error instanceof Error
            ? setProfile.error.message
            : "Update failed."}
        </p>
      )}

      <button
        type="button"
        disabled={!canSave}
        onClick={() =>
          setProfile.mutate({ dataUrl: preview ?? undefined, name })
        }
        className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3.5 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {setProfile.isPending && <Loader2 className="size-4 animate-spin" />}
        {setProfile.isPending ? t("common.confirmWallet") : t("profile.save")}
      </button>
    </div>
  );
}
