"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import Sidebar from "@/components/SideBar";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LogoutButton from "@/components/auth/LogoutButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderHeight(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const onOrientation = () => measure();
    window.addEventListener("orientationchange", onOrientation);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, []);

  useEffect(() => {
    const handler = () => setIsMobileOpen(false);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return (
    <RequireAuth>
      <div className="flex w-full min-h-dvh">
        <Sidebar
          isOpen={isMobileOpen}
          isCollapsed={isCollapsed}
          onClose={() => setIsMobileOpen(false)}
          onToggleCollapse={() => setIsCollapsed((v) => !v)}
        />

        <div className="flex-1 min-w-0 w-full">
          <div
            ref={headerRef}
            className="sticky md:static top-0 z-50 border-b border-border bg-[var(--navbar-bg)]/95 backdrop-blur"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="h-14 md:h-auto px-4 md:px-6 flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label="Open navigation menu"
                className="md:hidden inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 hover:bg-[var(--surface-dark)]"
                onClick={() => setIsMobileOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path
                    fillRule="evenodd"
                    d="M3.75 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm0 6a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm0 6a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Buttons container */}
              <div className="ml-auto flex items-center gap-2 my-1 md:my-2">
                <LogoutButton />
                <ThemeToggle />
              </div>
            </div>
          </div>

          <main className="px-4 md:px-6 lg:pr-12 py-4 md:py-6">
            <div className="pt-px">{children}</div>
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
