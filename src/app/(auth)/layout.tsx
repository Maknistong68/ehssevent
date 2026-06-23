export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      {/* soft ambient blobs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-green-soft/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-brand-yellow/15 blur-3xl" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}
