import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BottomNav } from "@/components/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative pb-28 lg:pb-0" style={{ background: "var(--color-background)" }}>
      <Sidebar />
      <div className="lg:pl-[72px]">
        <Navbar />
        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
