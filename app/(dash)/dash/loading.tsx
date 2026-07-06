
export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-4 border-muted border-t-brand" />
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      </div>
    </main>
  )
}
