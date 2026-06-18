import { requireUser } from "@/lib/auth";
import { DesktopSideNav, MobileBottomNav, MobileTopBar } from "@/components/nav/main-nav";
import { FlashMessages } from "@/components/ui/flash";
import { Suspense } from "react";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen flex">
      <DesktopSideNav user={user} />
      <div className="flex-1 flex flex-col">
        <MobileTopBar user={user} />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 pb-28 md:pb-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
        <MobileBottomNav />
      </div>
      <Suspense>
        <FlashMessages />
      </Suspense>
    </div>
  );
}
