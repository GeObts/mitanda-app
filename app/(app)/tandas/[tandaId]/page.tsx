import { TandaRoom } from "@/components/tanda-room";
import { AppBar } from "@/components/mt/app-bar";

// /tandas/<tandaId> — the tanda "room": the inside view of a circle for its
// members. Next 16: params is a Promise.
export default async function TandaDetailPage({
  params,
}: {
  params: Promise<{ tandaId: string }>;
}) {
  const { tandaId } = await params;
  if (!/^\d+$/.test(tandaId)) {
    return (
      <div className="min-h-screen bg-background">
        <AppBar />
        <main className="mx-auto w-full max-w-md px-5 py-10 md:max-w-3xl md:px-8">
          <div className="rounded-card bg-background-card p-8 text-center shadow-card">
            <h2 className="text-h1">Invalid link</h2>
            <p className="mx-auto mt-2 max-w-sm text-body text-foreground-muted">
              That tanda ID isn&apos;t valid.
            </p>
          </div>
        </main>
      </div>
    );
  }
  return <TandaRoom tandaId={Number(tandaId)} />;
}
