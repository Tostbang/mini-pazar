import { notFound } from "next/navigation";

// Catch-all for /dash/*. Next.js's app/not-found.tsx handles every unmatched
// URL by default, regardless of which route group the URL "looks like" it
// belongs to. By claiming /dash/* with a catch-all that calls notFound(), the
// closest not-found.tsx in the route hierarchy — app/(dash)/not-found.tsx —
// is the one that actually renders, wrapped by the (dash) root layout
// (sidebar + header).
export default function DashCatchAll() {
  notFound();
}
