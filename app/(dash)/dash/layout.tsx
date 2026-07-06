// The (dash) group root at app/(dash)/layout.tsx already provides the
// <html>/<body> shell, providers, sidebar, and header. This nested layout is
// intentionally a pass-through so children render directly inside the
// SidebarInset main area.
export default function DashSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
