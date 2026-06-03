import { JoinRequest } from "@/components/join-request";
import { ErrorCard } from "@/components/invite-redeem";

// /join/<tandaId> — the primary share link for a tanda (public join or private
// request-to-join). Next 16: params is a Promise.
export default async function JoinPage({
  params,
}: {
  params: Promise<{ tandaId: string }>;
}) {
  const { tandaId } = await params;
  if (!/^\d+$/.test(tandaId)) {
    return (
      <main className="mx-auto min-h-screen max-w-md space-y-6 bg-background px-6 py-8">
        <ErrorCard title="Invalid link" body="That tanda ID isn't valid." />
      </main>
    );
  }
  return <JoinRequest tandaId={BigInt(tandaId)} />;
}
