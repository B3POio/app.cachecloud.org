// src/app/(dashboard)/dashboard/layout.tsx
import RequireAuth from "@/components/auth/RequireAuth";
import Sidebar from "@/components/SideBar";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LogoutButton from "@/components/auth/LogoutButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="flex w-full min-h-screen">             {/* <- expand row to viewport */}
        <Sidebar />
        <main className="flex-1 min-w-0 w-full p-4 md:p-6 lg:pr-12"> {/* <- allow growth + right pad */}
          <div className="mb-4 flex justify-end gap-2">
            <LogoutButton />
            <ThemeToggle />
          </div>
          {children}
        </main>
      </div>
    </RequireAuth>
  );
}
