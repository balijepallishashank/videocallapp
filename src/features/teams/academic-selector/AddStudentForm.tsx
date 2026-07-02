import { Plus, UserPlus } from 'lucide-react'

interface BranchOption {
  id: string
  name: string
  years: number[]
}

interface AddStudentFormProps {
  branchOptions: BranchOption[]
  onAddBranch: (branchName: string) => void
  onAddStudent: (payload: { name: string; studentId: string; branchId: string; year: number }) => Promise<boolean>
}

export default function AddStudentForm({ branchOptions, onAddBranch, onAddStudent }: AddStudentFormProps) {
  return (
    <div className="space-y-4">
      <AddBranchCard onAddBranch={onAddBranch} />
      <AddStudentCard branchOptions={branchOptions} onAddStudent={onAddStudent} />
    </div>
  )
}

function AddBranchCard({ onAddBranch }: Pick<AddStudentFormProps, 'onAddBranch'>) {
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const branchName = String(formData.get('branchName') || '').trim()
        if (!branchName) return
        onAddBranch(branchName)
        event.currentTarget.reset()
      }}
      className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur p-4 shadow-lg"
    >
      <div className="text-sm font-semibold text-white mb-3">Add Branch</div>
      <div className="flex gap-2">
        <input
          name="branchName"
          placeholder="Branch Name (e.g., AI & DS)"
          className="flex-1 rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 px-3 py-2 text-sm text-cyan-100"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
    </form>
  )
}

function AddStudentCard({ branchOptions, onAddStudent }: Omit<AddStudentFormProps, 'onAddBranch'>) {
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const name = String(formData.get('name') || '').trim()
        const studentId = String(formData.get('studentId') || '').trim()
        const branchId = String(formData.get('branchId') || '').trim()
        const year = Number(formData.get('year') || 1)

        if (!name || !studentId || !branchId) return
        const form = event.currentTarget
        const added = await onAddStudent({ name, studentId, branchId, year })
        if (added) form.reset()
      }}
      className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur p-4 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-white">
        <UserPlus className="h-4 w-4 text-cyan-300" /> Add Student
      </div>

      <div className="grid grid-cols-1 gap-2">
        <input
          name="name"
          placeholder="Student Name"
          className="rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          required
        />
        <input
          name="studentId"
          placeholder="Student ID"
          className="rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          required
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            name="branchId"
            className="rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            required
            defaultValue=""
          >
            <option value="" disabled>Branch</option>
            {branchOptions.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>

          <select
            name="year"
            className="rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            defaultValue="1"
          >
            {[1, 2, 3, 4].map((year) => (
              <option key={year} value={year}>{year} Year</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="mt-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 px-3 py-2 text-sm text-emerald-100"
        >
          Add Student
        </button>
      </div>
    </form>
  )
}
