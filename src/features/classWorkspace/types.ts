export interface StudentRecord {
  id: string
  name: string
  email: string
  attendancePct?: number
  status: 'Active' | 'At Risk' | 'Inactive'
  phone?: string
  semester?: number
  yearNumber?: number
  lifecycleStatus?: 'active' | 'graduated'
  studentId?: string
  profilePhoto?: string
}

export interface AcademicSection {
  id: string
  name: string
  students: StudentRecord[]
  subject?: string
  faculty?: string
  facultyAdvisor?: string
  classRepresentative?: string
  departmentName?: string
  branchName?: string
  yearNumber?: number
}

export interface WorkspaceMember {
  id: string
  name: string
  email: string
  attendancePct?: number
  status?: string
  studentId?: string
  profilePhoto?: string
}

export interface WorkspaceMeeting {
  id: string
  title: string
  subject?: string
  classId?: string
  status?: 'scheduled' | 'live' | 'ended'
  description?: string
  recordingUrl?: string
  meetingCode?: string
  startedAt?: string
  scheduledAt?: string
  duration?: number
  host?: string
}

export interface WorkspaceMaterial {
  id: string
  title: string
  fileName?: string
  fileUrl?: string
  fileSize?: string
  fileType?: string
  cloudinaryResourceType?: string
  uploadedBy?: string
  uploadedAt?: string
}

export interface AcademicBranch {
  id: string
  name: string
  sections?: AcademicSection[]
}

export interface AcademicDepartment {
  id: string
  name: string
  code?: string
  totalYears?: number
  branches?: AcademicBranch[]
}

export interface AcademicFacultyRoot {
  id: string
  name: string
  departments: AcademicDepartment[]
}
