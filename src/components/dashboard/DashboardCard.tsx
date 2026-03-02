interface DashboardCardProps {
  children: React.ReactNode
  className?: string
}

/** Shared card wrapper for all dashboard widgets. Single source of truth for card styling. */
export function DashboardCard({ children, className }: DashboardCardProps) {
  return (
    <div className={`p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)]${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}
