import { motion } from 'framer-motion'
import { TrendingUp, Users, Clock, Activity, BarChart3 } from 'lucide-react'

// Simple bar chart component
export function BarChart({
  data,
  title,
}: {
  data: Array<{ label: string; value: number }>
  title: string
}) {
  const maxValue = Math.max(...data.map((d) => d.value))

  return (
    <div className="glass rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">{item.label}</span>
              <span className="text-sm font-semibold text-blue-400">
                {item.value}
              </span>
            </div>
            <motion.div
              className="h-2 rounded-full bg-slate-700/50 overflow-hidden"
              animate={{ width: '100%' }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Line chart component (simplified)
export function LineChart({
  data,
  title,
}: {
  data: Array<{ label: string; value: number }>
  title: string
}) {
  const maxValue = Math.max(...data.map((d) => d.value))
  const width = 300
  const height = 150
  const padding = 20

  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const points = data.map((item, i) => ({
    x: padding + (i / (data.length - 1)) * chartWidth,
    y: height - padding - (item.value / maxValue) * chartHeight,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className="glass rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <svg width={width} height={height} className="w-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </linearGradient>
        </defs>
        <motion.path
          d={pathD}
          stroke="rgb(59, 130, 246)"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5 }}
        />
        <motion.path
          d={pathD + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`}
          fill="url(#lineGradient)"
          initial={{ fillOpacity: 0 }}
          animate={{ fillOpacity: 1 }}
          transition={{ duration: 1.5 }}
        />
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="rgb(59, 130, 246)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </svg>
      <div className="flex justify-between mt-4 text-xs text-slate-400">
        {data.map((item, i) => (
          <span key={i}>{item.label}</span>
        ))}
      </div>
    </div>
  )
}

// Pie chart component (simplified)
export function PieChartComponent({
  data,
  title,
}: {
  data: Array<{ label: string; value: number; color: string }>
  title: string
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = -90

  const slices = data.map((item) => {
    const sliceAngle = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    currentAngle = endAngle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = 100 + 80 * Math.cos(startRad)
    const y1 = 100 + 80 * Math.sin(startRad)
    const x2 = 100 + 80 * Math.cos(endRad)
    const y2 = 100 + 80 * Math.sin(endRad)

    const largeArc = sliceAngle > 180 ? 1 : 0

    const path = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`

    return { path, color: item.color, label: item.label, value: item.value }
  })

  return (
    <div className="glass rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <div className="flex gap-6">
        <svg width={200} height={200} className="flex-shrink-0">
          {slices.map((slice, i) => (
            <motion.path
              key={i}
              d={slice.path}
              fill={slice.color}
              initial={{ fillOpacity: 0 }}
              animate={{ fillOpacity: 1 }}
              transition={{ delay: i * 0.1 }}
            />
          ))}
        </svg>
        <div className="flex-1 space-y-2">
          {data.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-slate-300">{item.label}</span>
              <span className="text-sm font-semibold text-blue-400">
                {((item.value / total) * 100).toFixed(0)}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Statistics card
export function StatCard({
  icon,
  label,
  value,
  trend,
  trendValue,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: 'up' | 'down'
  trendValue?: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      className="glass rounded-xl p-6 border border-slate-700/50"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-blue-500/20">{icon}</div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold ${
              trend === 'up' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </motion.div>
  )
}

// Meeting duration distribution
export function MeetingDurationChart() {
  const data = [
    { label: '< 5 min', value: 12, color: 'rgb(59, 130, 246)' },
    { label: '5-15 min', value: 28, color: 'rgb(34, 197, 94)' },
    { label: '15-60 min', value: 45, color: 'rgb(168, 85, 247)' },
    { label: '> 60 min', value: 15, color: 'rgb(249, 115, 22)' },
  ]

  return (
    <PieChartComponent data={data} title="Meeting Duration Distribution" />
  )
}

// Active meetings timeline
export function ActiveMeetingsTimeline({
  meetings,
}: {
  meetings: Array<{ id: string; title: string; duration: number; participants: number }>
}) {
  return (
    <div className="glass rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-bold text-white mb-4">Active Meetings</h3>
      <div className="space-y-3">
        {meetings.map((meeting, i) => (
          <motion.div
            key={meeting.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50"
          >
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-500"
              />
              <span className="font-semibold text-white text-sm">{meeting.title}</span>
            </div>
            <div className="flex gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {meeting.duration} min
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {meeting.participants} participants
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Analytics dashboard
export function AnalyticsDashboard({
  stats,
}: {
  stats: {
    totalMeetings: number
    totalParticipants: number
    averageDuration: number
    activeMeetings: number
  }
}) {
  const chartData = [
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 19 },
    { label: 'Wed', value: 15 },
    { label: 'Thu', value: 25 },
    { label: 'Fri', value: 22 },
    { label: 'Sat', value: 8 },
    { label: 'Sun', value: 5 },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="w-6 h-6 text-blue-400" />}
          label="Total Meetings"
          value={stats.totalMeetings}
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          icon={<Users className="w-6 h-6 text-cyan-400" />}
          label="Participants"
          value={stats.totalParticipants}
          trend="up"
          trendValue="+8%"
        />
        <StatCard
          icon={<Clock className="w-6 h-6 text-purple-400" />}
          label="Avg Duration"
          value={`${stats.averageDuration}m`}
          trend="down"
          trendValue="-3%"
        />
        <StatCard
          icon={<BarChart3 className="w-6 h-6 text-orange-400" />}
          label="Active Now"
          value={stats.activeMeetings}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart data={chartData} title="Meetings Per Day" />
        <BarChart
          data={[
            { label: 'Team A', value: 24 },
            { label: 'Team B', value: 19 },
            { label: 'Team C', value: 31 },
            { label: 'Others', value: 16 },
          ]}
          title="Meetings by Team"
        />
      </div>

      {/* Distribution and Active */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MeetingDurationChart />
        <ActiveMeetingsTimeline
          meetings={[
            { id: '1', title: 'Engineering Standup', duration: 45, participants: 8 },
            { id: '2', title: 'Client Demo', duration: 30, participants: 12 },
            { id: '3', title: 'Design Review', duration: 60, participants: 5 },
          ]}
        />
      </div>
    </div>
  )
}
