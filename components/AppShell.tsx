import Link from "next/link";
import type { Profile } from "@/lib/types";

const ownerLinks = [
  ["Today", "/owner"],
  ["Accounts", "/accounts"],
  ["History", "/history"]
];

const workerLinks = [
  ["Today", "/worker"],
  ["Accounts", "/accounts"],
  ["History", "/history"]
];

export function AppShell({
  profile,
  children
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const links = profile.role === "owner" ? ownerLinks : workerLinks;

  return (
    <div className="min-h-screen bg-wash">
      <header className="border-b border-line bg-panel/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/" className="text-lg font-semibold">
              Farm Manager
            </Link>
            <p className="text-xs text-slate-500">{profile.email} · {profile.role}</p>
          </div>
          <nav className="flex items-center gap-2">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/logout"
              className="rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Logout
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
