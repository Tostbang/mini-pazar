import { notFound } from "next/navigation";

// Catch-all for the (site) group. Mirrors the (dash) catch-all: by claiming
// every URL the (site) group owns and calling notFound() here, the framework
// resolves to app/(site)/not-found.tsx (the closest not-found in the
// hierarchy) wrapped by the (site) root layout, instead of falling through
// to the global app/not-found.tsx. The (dash)/dash/[...slug] catch-all is
// more specific for /dash/*, so it wins for dashboard URLs.
export default function SiteCatchAll() {
  notFound();
}
