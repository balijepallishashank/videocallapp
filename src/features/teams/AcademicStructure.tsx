import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CalendarDays, CheckCheck, Copy, Download, FileText, Users, X } from 'lucide-react'
import { lazy, Suspense } from 'react'
import type {
  AcademicDepartment,
  AcademicFacultyRoot,
  AcademicSection,
  StudentRecord,
} from '../../components/layout/HierarchicalSidebar'
const BranchTree = lazy(() => import('./academic-selector/BranchTree'))
const YearSection = lazy(() => import('./academic-selector/YearSection'))
const DragDropArea = lazy(() => import('./academic-selector/DragDropArea'))
const ExcelUploader = lazy(() => import('./academic-selector/ExcelUploader'))
const AddStudentForm = lazy(() => import('./academic-selector/AddStudentForm'))
import type { AcademicStudent, BranchNode, SelectorToast, UploadRow } from './academic-selector/types'

export type { AcademicFacultyRoot, AcademicSection, StudentRecord } from '../../components/layout/HierarchicalSidebar'

export interface FacultyProfile {
  facultyId: string
  name: string
  email: string
  department: string
  phone?: string
  designation?: string
}

interface AcademicStructureProps {
  facultyRoot: AcademicFacultyRoot
  facultyProfile?: FacultyProfile
  role: 'faculty' | 'student'
  studentUpcomingMeetings?: Array<{ id: string; title: string; date: Date }>
  studentAttendanceHistory?: Array<{ id: string; title: string; date: Date; status: 'Attended' | 'Absent' }>
  studentNotifications?: Array<{ id: string; title: string; message: string }>
  studentSharedResources?: Array<{ id: string; title: string; date: Date; recording?: string; summary?: string }>
  onOpenRecording?: (recordingUrl: string) => void
  onDownloadResourceSummary?: (resourceId: string) => void
  onStartMeetingForSection?: (section: AcademicSection) => void
  onInviteStudentToMeeting?: (student: StudentRecord) => void
  onSendMessageToStudent?: (student: StudentRecord) => void
  onViewStudentProfile?: (student: StudentRecord) => void
  onAcademicRootChange?: (departments: AcademicDepartment[]) => void
}

interface GeneratedStudentCredentials {
  name: string
  studentId: string
  email: string
  password: string
}

const ORDINALS = ['1st', '2nd', '3rd', '4th']

const BRANCH_DISPLAY_ALIASES: Record<string, string> = {
  cse: 'Computer Science & Engineering',
  'computer science': 'Computer Science & Engineering',
  'computer science engineering': 'Computer Science & Engineering',
  'computer science and engineering': 'Computer Science & Engineering',
}

const normalizeBranchToken = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const canonicalBranchDisplayName = (value: string) => {
  const normalized = normalizeBranchToken(value)
  return BRANCH_DISPLAY_ALIASES[normalized] || value.trim().replace(/\s+/g, ' ')
}

const canonicalBranchKey = (value: string) => normalizeBranchToken(canonicalBranchDisplayName(value))

const yearFromStudent = (student: StudentRecord) => {
  if (student.yearNumber && student.yearNumber > 0) return Math.min(4, Math.max(1, student.yearNumber))
  if (student.semester && student.semester > 0) return Math.min(4, Math.max(1, Math.ceil(student.semester / 2)))
  return 1
}

const avatarFromName = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() || '')
    .join('') || 'ST'

const DEMO_NAMES = [
  'Aarav Patel',
  'Priya Sharma',
  'Rahul Verma',
  'Sneha Reddy',
  'Karan Mehta',
  'Pooja Nair',
  'Arjun Das',
  'Meera Iyer',
  'Rohit Kumar',
  'Ananya Singh',
  'Vivek Gupta',
  'Ishita Rao',
]

const createSeedStudents = (branchName: string, branchId: string, year: number, count = 8): AcademicStudent[] => {
  const code = branchName
    .replace(/\([^)]*\)/g, '')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 4)
    .toUpperCase() || 'STU'

  return Array.from({ length: count }, (_, index) => {
    const name = DEMO_NAMES[(year * 3 + index) % DEMO_NAMES.length]
    const studentId = `${code}${year}${String(index + 1).padStart(3, '0')}`
    return {
      uid: `${branchId}-${studentId}`,
      studentId,
      name,
      avatar: avatarFromName(name),
      status: index % 4 === 0 ? 'offline' : 'online',
      branchId,
      year,
    }
  })
}

const mapStudentRecord = (student: StudentRecord, branchId: string, year: number): AcademicStudent => ({
  uid: `${branchId}-${student.id}`,
  studentId: student.id,
  name: student.name,
  avatar: avatarFromName(student.name),
  status: student.status === 'Active' ? 'online' : 'offline',
  branchId,
  year,
})

const buildDummyBranches = (): BranchNode[] => {
  const branchNames = ['CSE', 'ECE', 'MECH', 'CIVIL']
  return branchNames.map((name) => ({
    id: `${name.toLowerCase()}_branch`,
    name,
    years: [1, 2, 3, 4].map((year) => ({
      id: `${name.toLowerCase()}_y${year}`,
      year,
      students: Array.from({ length: 12 }, (_, index) => {
        const roll = `${name}${year}${String(index + 1).padStart(3, '0')}`
        return {
          uid: `${name.toLowerCase()}_${year}_${index + 1}`,
          studentId: roll,
          name: `Student ${year}-${index + 1}`,
          avatar: `S${index + 1}`,
          status: index % 3 === 0 ? 'offline' : 'online',
          branchId: `${name.toLowerCase()}_branch`,
          year,
        }
      }),
    })),
  }))
}

const normalizeBranches = (root: AcademicFacultyRoot): BranchNode[] => {
  const normalized = root.departments.map((department: unknown) => {
    const dept = department as { id: string; name: string; code?: string; branches?: unknown[] };
    const bucket = new Map<number, AcademicStudent[]>()
    for (let year = 1; year <= 4; year += 1) bucket.set(year, [])

    dept.branches?.forEach((branch: unknown) => {
      const br = branch as { sections: unknown[] };
      br.sections.forEach((section: unknown) => {
        const sec = section as { students: StudentRecord[] };
        sec.students.forEach((student: StudentRecord) => {
          const year = yearFromStudent(student)
          const current = bucket.get(year) || []
          if (!current.some((existing) => existing.studentId === student.id)) {
            current.push(mapStudentRecord(student, dept.id, year))
          }
          bucket.set(year, current)
        })
      })
    })

    const years = [1, 2, 3, 4].map((year) => {
      const existing = (bucket.get(year) || []).sort((a, b) => a.name.localeCompare(b.name))
      const students = existing.length > 0
        ? existing
        : createSeedStudents(dept.name, dept.id, year)

      return {
        id: `${dept.id}_year_${year}`,
        year,
        students,
      }
    })

    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      years,
    }
  })

  return normalized.length > 0 ? normalized : buildDummyBranches()
}

const toStudentRecord = (student: AcademicStudent): StudentRecord => ({
  id: student.studentId,
  name: student.name,
  email: `${student.studentId.toLowerCase()}@student.edu`,
  attendancePct: 0,
  status: student.status === 'online' ? 'Active' : 'Inactive',
  yearNumber: student.year,
  semester: student.year * 2,
})

const toDepartmentsPayload = (branches: BranchNode[]): AcademicDepartment[] =>
  branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    code: branch.code || branch.name.split(' ')[0].slice(0, 4).toUpperCase(),
    totalYears: 4,
    branches: [
      {
        id: `${branch.id}_branch`,
        name: branch.name,
        sections: branch.years.map((year) => ({
          id: year.id,
          name: `${branch.name} - ${year.year} Year`,
          subject: `${branch.name} Subject`,
          yearNumber: year.year,
          students: year.students.map(toStudentRecord),
        })),
      }
    ]
  }))

export default function AcademicStructure({
  facultyRoot,
  role,
  studentUpcomingMeetings = [],
  studentAttendanceHistory = [],
  studentNotifications = [],
  studentSharedResources = [],
  onOpenRecording,
  onDownloadResourceSummary,
  onStartMeetingForSection,
  onInviteStudentToMeeting,
  onAcademicRootChange,
}: AcademicStructureProps) {
  const [branches, setBranches] = useState<BranchNode[]>(() => normalizeBranches(facultyRoot))
  const isHydratingFromPropsRef = useRef(false)
  const lastSyncedDepartmentsRef = useRef<string>('')
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null)
  const [activeYearId, setActiveYearId] = useState<string | null>(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [participantIds, setParticipantIds] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState(30)
  const [isDragOver, setIsDragOver] = useState(false)
  const [toasts, setToasts] = useState<SelectorToast[]>([])
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedStudentCredentials | null>(null)
  const isFaculty = role === 'faculty'

  const copyCredentials = async (credentials: GeneratedStudentCredentials) => {
    const text = [
      `Name: ${credentials.name}`,
      `Student ID: ${credentials.studentId}`,
      `Email: ${credentials.email}`,
      `Password: ${credentials.password}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      pushToast('Credentials copied to clipboard', 'success')
    } catch {
      pushToast('Unable to copy credentials. Please copy manually.', 'error')
    }
  }

  const downloadCredentialsCsv = (credentials: GeneratedStudentCredentials) => {
    const rows = [
      'name,studentId,email,password',
      `${credentials.name},${credentials.studentId},${credentials.email},${credentials.password}`,
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `student_credentials_${credentials.studentId}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    isHydratingFromPropsRef.current = true
    const normalized = normalizeBranches(facultyRoot)
    lastSyncedDepartmentsRef.current = JSON.stringify(toDepartmentsPayload(normalized))
    setBranches(normalized)
  }, [facultyRoot])

  useEffect(() => {
    if (isHydratingFromPropsRef.current) {
      isHydratingFromPropsRef.current = false
      return
    }
    if (!onAcademicRootChange) return

    const payload = toDepartmentsPayload(branches)
    const payloadKey = JSON.stringify(payload)
    const incomingKey = JSON.stringify(facultyRoot.departments)
    if (payloadKey === incomingKey) {
      lastSyncedDepartmentsRef.current = payloadKey
      return
    }
    if (payloadKey === lastSyncedDepartmentsRef.current) return

    lastSyncedDepartmentsRef.current = payloadKey
    onAcademicRootChange(payload)
  }, [branches, facultyRoot.departments, onAcademicRootChange])

  useEffect(() => {
    if (!activeBranchId && branches[0]) {
      setActiveBranchId(branches[0].id)
      setActiveYearId(branches[0].years[0]?.id || null)
    }
  }, [activeBranchId, branches])

  useEffect(() => {
    setVisibleCount(30)
  }, [activeBranchId, activeYearId])

  const pushToast = (message: string, type: SelectorToast['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`
    setToasts((previous) => [...previous, { id, message, type }])
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id))
    }, 2800)
  }

  const studentMap = useMemo(() => {
    const map = new Map<string, AcademicStudent>()
    branches.forEach((branch) =>
      branch.years.forEach((year) => year.students.forEach((student) => map.set(student.uid, student))),
    )
    return map
  }, [branches])

  const activeBranch = useMemo(
    () => branches.find((branch) => branch.id === activeBranchId) || branches[0] || null,
    [branches, activeBranchId],
  )

  const activeYear = useMemo(
    () => activeBranch?.years.find((year) => year.id === activeYearId) || activeBranch?.years[0] || null,
    [activeBranch, activeYearId],
  )

  const activeStudents = useMemo(() => activeYear?.students || [], [activeYear])

  const selectedStudents = useMemo(
    () => Array.from(selectedStudentIds).map((id) => studentMap.get(id)).filter(Boolean) as AcademicStudent[],
    [selectedStudentIds, studentMap],
  )

  const participantStudents = useMemo(
    () => Array.from(participantIds).map((id) => studentMap.get(id)).filter(Boolean) as AcademicStudent[],
    [participantIds, studentMap],
  )

  const toggleStudent = (student: AcademicStudent) => {
    if (!isFaculty) return
    setSelectedStudentIds((previous) => {
      const next = new Set(previous)
      if (next.has(student.uid)) {
        next.delete(student.uid)
      } else {
        next.add(student.uid)
      }
      return next
    })
  }

  const selectAllActiveStudents = () => {
    if (!isFaculty) return
    const activeIds = activeStudents.map((student) => student.uid)
    setSelectedStudentIds((previous) => {
      const next = new Set(previous)
      activeIds.forEach((id) => next.add(id))
      return next
    })
  }

  const clearAllActiveStudents = () => {
    if (!isFaculty) return
    const activeIds = new Set(activeStudents.map((student) => student.uid))
    setSelectedStudentIds((previous) => {
      const next = new Set(previous)
      Array.from(next).forEach((id) => {
        if (activeIds.has(id)) next.delete(id)
      })
      return next
    })
  }

  const toggleSelectAllYear = (branchId: string, yearId: string) => {
    if (!isFaculty) return
    const branch = branches.find((item) => item.id === branchId)
    const year = branch?.years.find((item) => item.id === yearId)
    if (!year) return

    const yearIds = year.students.map((student) => student.uid)
    setSelectedStudentIds((previous) => {
      const next = new Set(previous)
      const areAllSelected = yearIds.every((id) => next.has(id))
      if (areAllSelected) {
        yearIds.forEach((id) => next.delete(id))
      } else {
        yearIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const toggleSelectAllBranch = (branchId: string) => {
    if (!isFaculty) return
    const branch = branches.find((item) => item.id === branchId)
    if (!branch) return
    const branchIds = branch.years.flatMap((year) => year.students.map((student) => student.uid))

    setSelectedStudentIds((previous) => {
      const next = new Set(previous)
      const areAllSelected = branchIds.every((id) => next.has(id))
      if (areAllSelected) {
        branchIds.forEach((id) => next.delete(id))
      } else {
        branchIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const addParticipantByUid = (uid: string) => {
    if (!isFaculty) return
    const student = studentMap.get(uid)
    if (!student) return

    setParticipantIds((previous) => {
      if (previous.has(uid)) return previous
      const next = new Set(previous)
      next.add(uid)
      return next
    })

    setSelectedStudentIds((previous) => {
      const next = new Set(previous)
      next.add(uid)
      return next
    })

    onInviteStudentToMeeting?.(toStudentRecord(student))
    pushToast(`${student.name} added to meeting participants`, 'success')
  }

  const addSelectedToParticipants = () => {
    if (!isFaculty) return
    if (selectedStudents.length === 0) {
      pushToast('Select students before inviting.', 'info')
      return
    }

    setParticipantIds((previous) => {
      const next = new Set(previous)
      selectedStudents.forEach((student) => next.add(student.uid))
      return next
    })

    selectedStudents.forEach((student) => onInviteStudentToMeeting?.(toStudentRecord(student)))
    pushToast(`${selectedStudents.length} students invited to meeting`, 'success')
  }

  const removeParticipant = (uid: string) => {
    if (!isFaculty) return
    const student = studentMap.get(uid)
    setParticipantIds((previous) => {
      const next = new Set(previous)
      next.delete(uid)
      return next
    })
    if (student) {
      pushToast(`${student.name} removed from meeting`, 'info')
    }
  }

  const addBranch = (branchName: string) => {
    if (!isFaculty) return
    const normalized = canonicalBranchDisplayName(branchName)
    const normalizedKey = canonicalBranchKey(normalized)
    if (!normalized) return

    setBranches((previous) => {
      const exists = previous.some((branch) => canonicalBranchKey(branch.name) === normalizedKey)
      if (exists) return previous

      const id = `${normalizedKey.replace(/\s+/g, '_')}_${Date.now()}`
      const created: BranchNode = {
        id,
        name: normalized,
        code: normalized.slice(0, 4).toUpperCase(),
        years: [1, 2, 3, 4].map((year) => ({
          id: `${id}_year_${year}`,
          year,
          students: [],
        })),
      }

      setActiveBranchId(id)
      setActiveYearId(created.years[0].id)
      pushToast(`Branch ${normalized} added`, 'success')
      return [...previous, created]
    })
  }

  const addStudent = async (payload: { name: string; studentId: string; branchId: string; year: number }) => {
    if (!isFaculty) return false
    const cleanedName = payload.name.trim()
    const cleanedStudentId = payload.studentId.trim()
    if (!cleanedName || !cleanedStudentId) return false

    const alreadyListed = Array.from(studentMap.values()).some(
      (student) => student.studentId.toLowerCase() === cleanedStudentId.toLowerCase(),
    )
    if (alreadyListed) {
      pushToast(`Student ID ${cleanedStudentId} is already in the academic structure`, 'error')
      return false
    }

    const { generatePassword, registerStudentAccount, studentEmail } = await import('./academic-selector/studentAuth')
    const email = studentEmail(cleanedStudentId)
    const password = generatePassword()
    let accountStatus: 'created' | 'exists' = 'created'

    try {
      accountStatus = await registerStudentAccount(cleanedName, cleanedStudentId, email, password)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to create the Firebase account'
      pushToast(`Student was not added: ${message}`, 'error')
      return false
    }

    setBranches((previous) =>
      previous.map((branch) => {
        if (branch.id !== payload.branchId) return branch

        return {
          ...branch,
          years: branch.years.map((year) => {
            if (year.year !== payload.year) return year
            const student: AcademicStudent = {
              uid: `${payload.branchId}-${cleanedStudentId}`,
              studentId: cleanedStudentId,
              name: cleanedName,
              avatar: avatarFromName(cleanedName),
              status: 'online',
              branchId: payload.branchId,
              year: payload.year,
            }
            if (year.students.some((item) => item.studentId === cleanedStudentId)) return year
            return { ...year, students: [student, ...year.students] }
          }),
        }
      }),
    )

    setActiveBranchId(payload.branchId)
    setActiveYearId(`${payload.branchId}_year_${payload.year}`)
    if (accountStatus === 'created') {
      setGeneratedCredentials({ name: cleanedName, studentId: cleanedStudentId, email, password })
    } else {
      setGeneratedCredentials(null)
      pushToast(`Student added. Account already existed for ${email}, so no new password was generated.`, 'info')
    }
    pushToast(`${cleanedName} added successfully`, 'success')
    return true
  }

  const uploadRows = (rows: UploadRow[]) => {
    if (!isFaculty) return
    const byBranch = new Map<string, UploadRow[]>()
    rows.forEach((row) => {
      const displayName = canonicalBranchDisplayName(row.branch)
      const key = canonicalBranchKey(displayName)
      const existing = byBranch.get(key) || []
      existing.push({ ...row, branch: displayName })
      byBranch.set(key, existing)
    })

    setBranches((previous) => {
      let next = [...previous]

      byBranch.forEach((items, branchKey) => {
        const displayName = items[0]?.branch || 'Branch'
        let branch = next.find((item) => canonicalBranchKey(item.name) === branchKey)
        if (!branch) {
          const id = `${branchKey.replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
          branch = {
            id,
            name: displayName,
            code: displayName.slice(0, 4).toUpperCase(),
            years: [1, 2, 3, 4].map((year) => ({
              id: `${id}_year_${year}`,
              year,
              students: [],
            })),
          }
          next = [...next, branch]
        }

        next = next.map((candidate) => {
          if (candidate.id !== branch!.id) return candidate
          return {
            ...candidate,
            years: candidate.years.map((year) => {
              const incoming = items.filter((item) => item.year === year.year)
              if (incoming.length === 0) return year

              const dedupe = new Map(year.students.map((student) => [student.studentId, student]))
              incoming.forEach((item) => {
                dedupe.set(item.studentId, {
                  uid: `${candidate.id}-${item.studentId}`,
                  studentId: item.studentId,
                  name: item.name,
                  avatar: avatarFromName(item.name),
                  status: 'online',
                  branchId: candidate.id,
                  year: year.year,
                })
              })

              return {
                ...year,
                students: Array.from(dedupe.values()),
              }
            }),
          }
        })
      })

      return next
    })
    pushToast(`Student credentials generated and downloaded! (${rows.length} students added)`, 'success')
  }
  const branchOptions = useMemo(
    () => branches.map((branch) => ({ id: branch.id, name: branch.name, years: branch.years.map((year) => year.year) })),
    [branches],
  )

  const startCallWithSelectedStudents = () => {
    if (!isFaculty) return
    if (selectedStudents.length === 0) {
      pushToast('Select at least one student to start a call.', 'info')
      return
    }
    if (!activeBranch || !activeYear) {
      pushToast('Select branch and year first.', 'info')
      return
    }

    onStartMeetingForSection?.({
      id: `${activeBranch.id}_${activeYear.id}_meeting_${Date.now()}`,
      name: `${activeBranch.name} - ${ORDINALS[(activeYear.year || 1) - 1]} Year`,
      students: selectedStudents.map(toStudentRecord),
      subject: `${activeBranch.name} Meeting`,
      departmentName: activeBranch.name,
      yearNumber: activeYear.year,
    })
    pushToast(`Starting call with ${selectedStudents.length} students`, 'success')
  }

  const title = `${activeBranch?.name || 'Branch'} • ${ORDINALS[(activeYear?.year || 1) - 1]} Year`

  return (
    <div className="space-y-6">
      {!isFaculty && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 backdrop-blur p-4 md:p-5">
          <h3 className="text-cyan-200 font-semibold">Student Academic Structure</h3>
          <p className="text-xs text-cyan-100/80 mt-1">
            Browse branch → year → students. Students can view status and join meetings from the Meetings section.
          </p>
          <ul className="mt-3 text-xs text-cyan-100/80 space-y-1 list-disc list-inside">
            <li>Can browse students and view online/offline status</li>
            <li>Can join meetings using meeting ID</li>
            <li>Cannot start/conduct meetings or use admin tools</li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Academic Hierarchy</h2>
              <div className="text-xs text-slate-400">{branches.length} branches</div>
            </div>

            <BranchTree
              branches={branches}
              activeBranchId={activeBranchId}
              activeYearId={activeYearId}
              selectedIds={selectedStudentIds}
              canBulkSelect={isFaculty}
              onActivateBranch={(branchId) => {
                const branch = branches.find((item) => item.id === branchId)
                setActiveBranchId(branchId)
                setActiveYearId(branch?.years[0]?.id || null)
              }}
              onActivateYear={(branchId, yearId) => {
                setActiveBranchId(branchId)
                setActiveYearId(yearId)
              }}
              onSelectAllBranch={toggleSelectAllBranch}
              onSelectAllYear={toggleSelectAllYear}
            />
          </div>
        </aside>

        <section className="lg:col-span-6 space-y-4">
          <Suspense fallback={<div className="p-4 text-slate-400">Loading branches…</div>}>
            <YearSection
              title={title}
              students={activeStudents}
              selectedIds={selectedStudentIds}
              participantIds={participantIds}
              canManageInvites={isFaculty}
              visibleCount={visibleCount}
              onToggleStudent={toggleStudent}
              onSelectAll={selectAllActiveStudents}
              onClearAll={clearAllActiveStudents}
              onLoadMore={() => setVisibleCount((previous) => previous + 30)}
            />
          </Suspense>
        </section>

        <aside className="lg:col-span-3 space-y-4">
          {isFaculty ? (
            <>
              <DragDropArea
                participants={participantStudents}
                isDragOver={isDragOver}
                onDragEnter={() => setIsDragOver(true)}
                onDragLeave={() => setIsDragOver(false)}
                onDragOver={(event) => {
                  event.preventDefault()
                  setIsDragOver(true)
                }}
                onDropStudent={(event) => {
                  event.preventDefault()
                  const uid = event.dataTransfer.getData('application/x-student-uid')
                  if (uid) addParticipantByUid(uid)
                  setIsDragOver(false)
                }}
                onRemoveParticipant={removeParticipant}
              />

              <div className="rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Call Actions</h3>
                  <span className="text-xs text-cyan-200">{selectedStudents.length} selected</span>
                </div>
                <button
                  onClick={addSelectedToParticipants}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 px-3 py-2 text-sm text-cyan-100"
                >
                  <CheckCheck className="h-4 w-4" /> Add selected to call panel
                </button>
                <button
                  onClick={startCallWithSelectedStudents}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 px-3 py-2 text-sm text-emerald-100"
                >
                  Start Meeting
                </button>
                <div className="flex items-center gap-2 text-indigo-200 text-xs mt-3">
                  <Users className="h-4 w-4" />
                  <span>{participantStudents.length} in call panel</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur p-4 shadow-lg">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                  <CalendarDays className="h-4 w-4 text-cyan-300" /> My Upcoming Meetings
                </div>
                {studentUpcomingMeetings.length === 0 ? (
                  <p className="text-xs text-slate-500">No upcoming meetings scheduled.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-auto pr-1">
                    {studentUpcomingMeetings.slice(0, 5).map((meeting) => (
                      <div key={meeting.id} className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2">
                        <div className="text-xs text-slate-100 truncate">{meeting.title}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{meeting.date.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur p-4 shadow-lg">
                <h3 className="text-sm font-semibold text-white mb-2">Attendance History</h3>
                {studentAttendanceHistory.length === 0 ? (
                  <p className="text-xs text-slate-500">No attendance data yet.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-auto pr-1">
                    {studentAttendanceHistory.slice(0, 6).map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-100 truncate">{entry.title}</p>
                          <p className="text-[11px] text-slate-500">{entry.date.toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${entry.status === 'Attended' ? 'text-emerald-200 border-emerald-400/30 bg-emerald-500/10' : 'text-rose-200 border-rose-400/30 bg-rose-500/10'}`}>
                          {entry.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur p-4 shadow-lg">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                  <Bell className="h-4 w-4 text-amber-300" /> Personal Notifications / Reminders
                </div>
                {studentNotifications.length === 0 ? (
                  <p className="text-xs text-slate-500">No reminders yet.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-auto pr-1">
                    {studentNotifications.slice(0, 6).map((notification) => (
                      <div key={notification.id} className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2">
                        <p className="text-xs text-slate-100">{notification.title}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur p-4 shadow-lg">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                  <Download className="h-4 w-4 text-emerald-300" /> Shared Recording / Resources
                </div>
                {studentSharedResources.length === 0 ? (
                  <p className="text-xs text-slate-500">No shared recordings/resources yet.</p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-auto pr-1">
                    {studentSharedResources.slice(0, 8).map((resource) => (
                      <div key={resource.id} className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2">
                        <p className="text-xs text-slate-100 truncate">{resource.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1">{resource.date.toLocaleDateString()}</p>
                        <div className="flex gap-2 mt-2">
                          {resource.recording && (
                            <button
                              onClick={() => onOpenRecording?.(resource.recording!)}
                              className="px-2 py-1 rounded text-[11px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-200"
                            >
                              Open
                            </button>
                          )}
                          {resource.summary && (
                            <button
                              onClick={() => onDownloadResourceSummary?.(resource.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200"
                            >
                              <FileText className="w-3 h-3" /> Summary
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {isFaculty && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/35 backdrop-blur p-4 md:p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Admin Management</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ExcelUploader onParsedRows={uploadRows} onError={(message) => pushToast(message, 'error')} />
            <AddStudentForm branchOptions={branchOptions} onAddBranch={addBranch} onAddStudent={addStudent} />
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className={`rounded-xl border px-4 py-2 text-sm shadow-lg backdrop-blur ${toast.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-300/30 text-emerald-100'
                : toast.type === 'error'
                  ? 'bg-rose-500/20 border-rose-300/30 text-rose-100'
                  : 'bg-slate-700/40 border-slate-400/30 text-slate-100'
                }`}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {generatedCredentials && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              className="w-full max-w-lg rounded-2xl border border-cyan-400/30 bg-slate-900 p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-cyan-100">Student account created</h3>
                  <p className="mt-1 text-sm text-slate-300">Share these credentials securely with the student.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGeneratedCredentials(null)}
                  className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
                  aria-label="Close credentials dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/70 p-4 text-sm">
                <div className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-slate-200">
                  <span className="text-slate-400">Name</span>
                  <span>{generatedCredentials.name}</span>
                  <span className="text-slate-400">Student ID</span>
                  <span>{generatedCredentials.studentId}</span>
                  <span className="text-slate-400">Email</span>
                  <span className="font-mono text-cyan-200 break-all">{generatedCredentials.email}</span>
                  <span className="text-slate-400">Password</span>
                  <span className="font-mono text-amber-200 break-all">{generatedCredentials.password}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyCredentials(generatedCredentials)}
                  className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20"
                >
                  <Copy className="h-4 w-4" /> Copy
                </button>
                <button
                  type="button"
                  onClick={() => downloadCredentialsCsv(generatedCredentials)}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20"
                >
                  <Download className="h-4 w-4" /> Download CSV
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
