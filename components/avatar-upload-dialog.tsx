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
import { useSetAvatar } from "@/lib/hooks/use-avatar";

const OUTPUT_SIZE = 256; // square px stored

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
        <UploadContent
          key={open ? "open" : "closed"}
          address={address}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function UploadContent({
  address,
  onDone,
}: {
  address?: string;
  onDone: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const setAvatar = useSetAvatar();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFileError("Please choose an image file.");
      return;
    }
    try {
      setPreview(await fileToSquareDataUrl(file));
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Could not load image.");
    }
  }

  if (setAvatar.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <h2 className="text-h2">Photo updated</h2>
        <p className="max-w-xs text-body text-foreground-muted">
          Your circle will see your new profile photo.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-2 flex w-full items-center justify-center rounded-btn bg-primary px-5 py-3 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-h2">Profile photo</DialogTitle>
        <DialogDescription>
          So your circle can recognize you. Stored off-chain, keyed to your
          wallet — you sign once to confirm it&apos;s you.
        </DialogDescription>
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
          {preview ? "Choose a different photo" : "Choose a photo"}
        </button>
      </div>

      {fileError && (
        <p className="flex items-center gap-1.5 text-caption text-danger">
          <AlertTriangle className="size-3.5 shrink-0" /> {fileError}
        </p>
      )}
      {setAvatar.isError && (
        <p className="flex items-center gap-1.5 text-caption text-danger">
          <AlertTriangle className="size-3.5 shrink-0" />
          {setAvatar.error instanceof Error
            ? setAvatar.error.message
            : "Upload failed."}
        </p>
      )}

      <button
        type="button"
        disabled={!preview || setAvatar.isPending}
        onClick={() => preview && setAvatar.mutate(preview)}
        className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3.5 text-h3 text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {setAvatar.isPending && <Loader2 className="size-4 animate-spin" />}
        {setAvatar.isPending ? "Confirm in your wallet…" : "Save photo"}
      </button>
    </div>
  );
}
