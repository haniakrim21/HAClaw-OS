'use client'

interface AgentMetricsWidgetProps {
  messagesCount: number
  lastActivity: string | null
  isOnline: boolean
}

export function AgentMetricsWidget({ messagesCount, lastActivity, isOnline }: AgentMetricsWidgetProps) {
  return (
    <div
      className="p-6 rounded-2xl"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}
    >
      <h3 className="text-lg font-semibold text-[var(--fg)]">
        Agent Status
      </h3>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Status metric */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)]">
          <div className="text-sm font-medium text-[var(--muted)]">
            Status
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: isOnline ? 'var(--green)' : 'var(--red)',
                boxShadow: isOnline ? '0 0 8px var(--green)' : '0 0 8px var(--red)',
              }}
            />
            <span className="text-[15px] font-semibold text-[var(--fg)]">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Messages Today metric */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)]">
          <div className="text-sm font-medium text-[var(--muted)]">
            Messages Today
          </div>
          <div className="mt-2 text-[15px] font-semibold text-[var(--fg)]">
            {messagesCount}
          </div>
        </div>

        {/* Gateway metric */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)]">
          <div className="text-sm font-medium text-[var(--muted)]">
            Gateway
          </div>
          <div className="mt-2 text-[15px] font-semibold text-[var(--fg)]">
            {isOnline ? 'Connected' : 'Unreachable'}
          </div>
        </div>

        {/* Last Activity metric */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)]">
          <div className="text-sm font-medium text-[var(--muted)]">
            Last Activity
          </div>
          <div className="mt-2 text-[15px] font-semibold text-[var(--fg)]">
            {lastActivity ?? 'No activity'}
          </div>
        </div>
      </div>
    </div>
  )
}
