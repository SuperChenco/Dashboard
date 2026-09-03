import { useEffect, useRef, useState } from 'react';

import Icon from '@/components/ui/Icon';
import QuickIdeaInput from '@/components/ideas/QuickIdeaInput';
import {
  isNavigationItemActive,
  mobileNavigation,
  primaryNavigation,
  secondaryNavigation,
} from '@/config/navigation';

interface MobileShellProps {
  activePath: string;
  userEmail?: string;
  authMode: 'supabase' | 'local-development' | 'unconfigured';
}

export default function MobileShell({
  activePath,
  userEmail,
  authMode,
}: MobileShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    if (drawerOpen && !drawer.open) drawer.showModal();
    if (!drawerOpen && drawer.open) drawer.close();
  }, [drawerOpen]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    window.setTimeout(() => menuButtonRef.current?.focus(), 0);
  };

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-app-border bg-app-background/95 px-4 backdrop-blur lg:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-control text-app-muted-foreground hover:bg-app-muted hover:text-app-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-app-foreground"
          aria-label="打开主导航"
          aria-haspopup="dialog"
          onClick={() => setDrawerOpen(true)}
        >
          <Icon name="menu" className="size-5" />
        </button>
        <a
          href="/"
          className="text-sm font-semibold tracking-tight text-app-foreground"
        >
          P_CEO_OS
        </a>
        <QuickIdeaInput variant="compact" />
      </div>

      <dialog
        ref={drawerRef}
        className="m-0 h-dvh max-h-none w-[min(20rem,88vw)] max-w-none border-0 border-r border-app-border bg-app-sidebar p-0 text-app-foreground shadow-drawer backdrop:bg-slate-950/25 lg:hidden"
        aria-label="主导航"
        onCancel={(event) => {
          event.preventDefault();
          closeDrawer();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDrawer();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b border-app-border px-4">
            <a
              href="/"
              className="text-sm font-semibold tracking-tight"
              onClick={closeDrawer}
            >
              P_CEO_OS
            </a>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-control text-app-muted-foreground hover:bg-black/[0.04] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-app-foreground"
              aria-label="关闭主导航"
              onClick={closeDrawer}
            >
              <Icon name="close" className="size-5" />
            </button>
          </div>
          <nav
            className="flex-1 overflow-y-auto px-3 py-5"
            aria-label="移动端主导航"
          >
            {[...primaryNavigation, ...secondaryNavigation].map((item) => {
              const active = isNavigationItemActive(activePath, item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`mb-0.5 flex h-10 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-black/[0.055] text-app-foreground'
                      : 'text-app-muted-foreground hover:bg-black/[0.035] hover:text-app-foreground'
                  }`}
                  onClick={closeDrawer}
                >
                  <Icon name={item.icon} className="size-[18px]" />
                  {item.label}
                </a>
              );
            })}
          </nav>
          <div className="border-t border-app-border p-4 text-xs text-app-subtle">
            <p className="truncate">{userEmail ?? 'Local development'}</p>
            {authMode === 'supabase' && (
              <form action="/api/auth/sign-out" method="post" className="mt-2">
                <button type="submit" className="underline underline-offset-4">
                  Sign Out
                </button>
              </form>
            )}
          </div>
        </div>
      </dialog>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid h-[4.25rem] grid-cols-3 border-t border-app-border bg-app-background/95 px-[max(1rem,env(safe-area-inset-left))] pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="移动端快捷导航"
      >
        {mobileNavigation.map((item) => {
          const active = isNavigationItemActive(activePath, item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-app-foreground ${
                active ? 'text-app-foreground' : 'text-app-subtle'
              }`}
            >
              <Icon name={item.icon} className="size-[19px]" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
