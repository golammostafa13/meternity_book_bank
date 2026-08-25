import type { Metadata } from "next";

/**
 * The admin section is never indexed and never cached publicly. In production
 * it also sits behind Cloudflare Access, so an unauthenticated request never
 * reaches the app at all: the noindex here is belt and braces for the case
 * where a link leaks.
 */
export const metadata: Metadata = {
  title: { default: "Library admin", template: "%s · Library admin" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Nothing under /admin is ever prerendered or cached. The whole public site is
 * static-first on purpose, but a librarian looking at inventory has to see the
 * row as it is now: a cached dashboard is a wrong dashboard. Set on the layout
 * so it applies to every segment below it.
 */
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
