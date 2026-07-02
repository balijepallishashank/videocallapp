import { useState } from 'react'
import { UserPlus, User, Hash, GraduationCap, Calendar, Layout, X } from 'lucide-react'

interface BranchOption {
  id: string
  name: string
  years: number[]
  sectionsByYear: Record<number, Array<{ id: string; name: string }>>
}

interface AddStudentFormProps {
  branchOptions: BranchOption[]
  onAddStudent: (payload: { name: string; studentId: string; branchId: string; year: number; sectionId: string }) => void
  onCancel?: () => void
}

export default function AddStudentForm({ branchOptions, onAddStudent, onCancel }: AddStudentFormProps) {
  const [branchId, setBranchId] = useState('')
  const [year, setYear] = useState<number>(1)
  const [sectionId, setSectionId] = useState('')

  const selectedBranch = branchOptions.find((b) => b.id === branchId)
  const availableYears = selectedBranch?.years || []
  const availableSections = selectedBranch ? selectedBranch.sectionsByYear[year] || [] : []

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const name = String(formData.get('name') || '').trim()
        const studentId = String(formData.get('studentId') || '').trim()

        if (!name || !studentId || !branchId || !sectionId) return
        onAddStudent({ name, studentId, branchId, year, sectionId })
        event.currentTarget.reset()
        if (onCancel) onCancel()
      }}
      className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Enroll New Student</h2>
            <p className="text-xs text-slate-400">Add a student to the academic hierarchy</p>
          </div>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <User className="w-4 h-4" /> Full Name *
            </label>
            <input
              name="name"
              placeholder="e.g. John Doe"
              className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Hash className="w-4 h-4" /> Student ID *
            </label>
            <input
              name="studentId"
              placeholder="e.g. STU2024001"
              className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              required
            />
          </div>
        </div>

        <div className="border-t border-white/5 my-4" />

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <GraduationCap className="w-4 h-4" /> Academic Branch *
          </label>
          <select
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value)
              setSectionId('') // Reset section on branch change
            }}
            className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
            required
          >
            <option value="" disabled>Select a branch...</option>
            {branchOptions.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Calendar className="w-4 h-4" /> Academic Year *
            </label>
            <select
              value={year}
              onChange={(e) => {
                setYear(Number(e.target.value))
                setSectionId('') // Reset section on year change
              }}
              disabled={!branchId}
              className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all appearance-none cursor-pointer"
              required
            >
              <option value="" disabled>Select year...</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>{yr} Year</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Layout className="w-4 h-4" /> Section *
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              disabled={!branchId || !year}
              className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all appearance-none cursor-pointer"
              required
            >
              <option value="" disabled>Select section...</option>
              {availableSections.map((section) => (
                <option key={section.id} value={section.id}>{section.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-white/10 bg-slate-800/30 flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold transition-colors border border-white/10"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!branchId || !sectionId}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-blue-400/30"
        >
          Enroll Student
        </button>
      </div>
    </form>
  )
}
