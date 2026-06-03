// Pure validation + unit-conversion for the Create Tanda form.
// Bounds mirror the contract (TandaManager constants) exactly:
//   contributionAmount > 0
//   payoutInterval     1..30 days   (stored as seconds)
//   participantCount   2..50
//   gracePeriod        1..7 days    (stored as seconds)
//   scheduledStart     0 (auto) or >= block.timestamp + 1 day
//   privacy            PUBLIC (enum value 0)
import { parseUnits } from "viem";

export const USDC_DECIMALS = 6;
export const SECONDS_PER_DAY = 86400n;
/** ITanda.TandaPrivacy { PUBLIC, PRIVATE_TICKETED }. */
export const PRIVACY_PUBLIC = 0;
export const PRIVACY_PRIVATE = 1;

export const BOUNDS = {
  intervalDays: { min: 1, max: 30 },
  participants: { min: 2, max: 50 },
  graceDays: { min: 1, max: 7 },
} as const;

// Extra lead time required beyond the contract's 1-day minimum, so a tx that
// sits in the mempool for a while still satisfies `>= block.timestamp + 1 day`
// when it mines.
const SCHEDULED_BUFFER_SECONDS = 3600; // 1 hour

export interface CreateTandaFormState {
  contribution: string; // USDC, decimal string e.g. "10"
  intervalDays: string; // integer days
  participants: string; // integer
  graceDays: string; // integer days
  startMode: "auto" | "scheduled";
  scheduledLocal: string; // <input type="datetime-local"> value
  privacy: "public" | "private"; // PUBLIC | PRIVATE_TICKETED
}

export interface CreateTandaArgs {
  contributionAmount: bigint;
  payoutInterval: bigint;
  participantCount: number; // uint16 -> number
  gracePeriod: bigint;
  scheduledStart: bigint;
  privacy: number; // uint8 enum -> number
}

export type FieldErrors = Partial<
  Record<keyof CreateTandaFormState, string>
>;

export const initialFormState: CreateTandaFormState = {
  contribution: "",
  intervalDays: "7",
  participants: "5",
  graceDays: "2",
  startMode: "auto",
  scheduledLocal: "",
  privacy: "public",
};

function parseIntStrict(s: string): number | null {
  if (!/^\d+$/.test(s.trim())) return null;
  return Number(s.trim());
}

/**
 * Validate the form against the contract bounds and, if valid, produce the
 * exact `createTanda` argument tuple (token is supplied by the caller).
 * `tokenDecimals` scales the contribution to the chosen token's base units
 * (read on-chain — not hardcoded). `nowSeconds` is injectable for testing.
 */
export function validateCreateTanda(
  form: CreateTandaFormState,
  tokenDecimals: number = USDC_DECIMALS,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): { errors: FieldErrors; args: CreateTandaArgs | null } {
  const errors: FieldErrors = {};

  // Contribution (decimal string -> token base units, using the token's decimals)
  let contributionAmount = 0n;
  const contrib = form.contribution.trim();
  if (contrib === "") {
    errors.contribution = "Enter a contribution amount.";
  } else if (!/^\d*\.?\d*$/.test(contrib) || contrib === ".") {
    errors.contribution = "Enter a valid number.";
  } else {
    const decimals = contrib.split(".")[1]?.length ?? 0;
    if (decimals > tokenDecimals) {
      errors.contribution = `This token supports at most ${tokenDecimals} decimals.`;
    } else {
      try {
        contributionAmount = parseUnits(contrib, tokenDecimals);
        if (contributionAmount <= 0n)
          errors.contribution = "Amount must be greater than 0.";
      } catch {
        errors.contribution = "Enter a valid number.";
      }
    }
  }

  // Payout interval (days -> seconds), 1..30
  let payoutInterval = 0n;
  const iv = parseIntStrict(form.intervalDays);
  if (iv === null) {
    errors.intervalDays = "Enter a whole number of days.";
  } else if (iv < BOUNDS.intervalDays.min || iv > BOUNDS.intervalDays.max) {
    errors.intervalDays = `Must be ${BOUNDS.intervalDays.min}–${BOUNDS.intervalDays.max} days.`;
  } else {
    payoutInterval = BigInt(iv) * SECONDS_PER_DAY;
  }

  // Participants, 2..50
  let participantCount = 0;
  const pc = parseIntStrict(form.participants);
  if (pc === null) {
    errors.participants = "Enter a whole number.";
  } else if (pc < BOUNDS.participants.min || pc > BOUNDS.participants.max) {
    errors.participants = `Must be ${BOUNDS.participants.min}–${BOUNDS.participants.max} participants.`;
  } else {
    participantCount = pc;
  }

  // Grace period (days -> seconds), 1..7
  let gracePeriod = 0n;
  const gp = parseIntStrict(form.graceDays);
  if (gp === null) {
    errors.graceDays = "Enter a whole number of days.";
  } else if (gp < BOUNDS.graceDays.min || gp > BOUNDS.graceDays.max) {
    errors.graceDays = `Must be ${BOUNDS.graceDays.min}–${BOUNDS.graceDays.max} days.`;
  } else {
    gracePeriod = BigInt(gp) * SECONDS_PER_DAY;
  }

  // Start: auto (0) or a scheduled date >= now + 1 day (+ buffer)
  let scheduledStart = 0n;
  if (form.startMode === "scheduled") {
    if (!form.scheduledLocal) {
      errors.scheduledLocal = "Pick a start date and time.";
    } else {
      const ms = new Date(form.scheduledLocal).getTime();
      if (Number.isNaN(ms)) {
        errors.scheduledLocal = "Invalid date.";
      } else {
        const startSec = Math.floor(ms / 1000);
        const earliest = nowSeconds + 86400 + SCHEDULED_BUFFER_SECONDS;
        if (startSec < earliest) {
          errors.scheduledLocal =
            "Scheduled start must be at least 1 day from now.";
        } else {
          scheduledStart = BigInt(startSec);
        }
      }
    }
  }

  const ok = Object.keys(errors).length === 0;
  return {
    errors,
    args: ok
      ? {
          contributionAmount,
          payoutInterval,
          participantCount,
          gracePeriod,
          scheduledStart,
          privacy: form.privacy === "private" ? PRIVACY_PRIVATE : PRIVACY_PUBLIC,
        }
      : null,
  };
}

/** Minimum value for a datetime-local input: now + 1 day + buffer, local TZ. */
export function minScheduledLocal(now: Date = new Date()): string {
  const d = new Date(now.getTime() + (86400 + SCHEDULED_BUFFER_SECONDS) * 1000);
  // strip seconds, format as yyyy-MM-ddTHH:mm in local time
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
