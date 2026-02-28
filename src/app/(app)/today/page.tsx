import { withUser } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { getActiveWorkspace } from '@/lib/workspace'
import { getTasksByWorkspace } from '@/lib/db/repositories/task.repository'
import { findProcessesByWorkspace } from '@/lib/db/repositories/process.repository'
import { getUserSettings } from '@/lib/db/repositories/user-setting.repository'
import { countMessagesToday } from '@/lib/ai/message.repository'
import {
  GreetingWidget,
  CurrencyWidget,
  AgentMetricsWidget,
  ProcessesWidget,
  QuickLinksWidget,
  RecentTasksWidget,
} from '@/components/dashboard'
import { WidgetErrorBoundary } from '@/components/ui/WidgetErrorBoundary'

export const dynamic = 'force-dynamic'

const PREF_KEYS = ['dashboard:currencies', 'dashboard:weather_city', 'dashboard:timezone'] as const

/** Check if Clawdbot gateway is reachable (fast ping, no auth needed for health) */
async function checkGatewayHealth(): Promise<boolean> {
  const url = process.env.CLAWDBOT_URL || 'http://127.0.0.1:18789'
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/health`, {
      signal: AbortSignal.timeout(2000),
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}

/** Format "last activity" relative time */
function formatLastActivity(date: Date | null): string | null {
  if (!date) return null
  const now = Date.now()
  const diffMs = now - new Date(date).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default async function DashboardPage() {
  const [session, workspace] = await Promise.all([getSession(), getActiveWorkspace()])

  if (!session.userId) return null

  if (!workspace) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[var(--muted)] mt-2">No workspaces found for this user.</p>
      </div>
    )
  }

  // Fetch all data in parallel
  const [tasks, processes, settings, messageStats, isOnline] = await Promise.all([
    withUser(session.userId, (client) =>
      getTasksByWorkspace(client, workspace.id, { limit: 10 })
    ),
    withUser(session.userId, (client) =>
      findProcessesByWorkspace(client, workspace.id)
    ).catch(() => [] as import('@/lib/db/repositories/process.repository').Process[]),
    withUser(session.userId, (client) =>
      getUserSettings(client, [...PREF_KEYS])
    ).catch(() => []),
    withUser(session.userId, (client) =>
      countMessagesToday(client)
    ).catch(() => ({ total: 0, lastAt: null })),
    checkGatewayHealth(),
  ])

  // Extract preferences from settings
  const prefs = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  const currencyPrefs = prefs['dashboard:currencies'] as {
    baseCurrency: string; fiat: string[]; crypto: string[]
  } | undefined
  const weatherCity = prefs['dashboard:weather_city'] as string | undefined
  const timezone = prefs['dashboard:timezone'] as string | undefined

  return (
    <div className="space-y-5">
      {/* Row 1: Greeting (time+weather+system gauges) | Currency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <WidgetErrorBoundary name="Greeting">
          <GreetingWidget
            username={session.username}
            timezone={timezone}
            weatherCity={weatherCity}
          />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="Currency">
          <CurrencyWidget preferences={currencyPrefs} />
        </WidgetErrorBoundary>
      </div>

      {/* Row 2: Agent Metrics | Processes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <WidgetErrorBoundary name="AgentMetrics">
          <AgentMetricsWidget
            messagesCount={messageStats.total}
            lastActivity={formatLastActivity(messageStats.lastAt)}
            isOnline={isOnline}
          />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="Processes">
          <ProcessesWidget initialProcesses={processes} workspaceId={workspace.id} />
        </WidgetErrorBoundary>
      </div>

      {/* Row 3: Recent Tasks | Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <WidgetErrorBoundary name="RecentTasks">
          <RecentTasksWidget tasks={tasks} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="QuickLinks">
          <QuickLinksWidget />
        </WidgetErrorBoundary>
      </div>
    </div>
  )
}
