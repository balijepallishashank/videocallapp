export type PresenceStatus = 'online' | 'offline'

export interface AcademicStudent {
  uid: string
  studentId: string
  name: string
  avatar: string
  status: PresenceStatus
  branchId: string
  year: number
  sectionId: string
}

export interface AcademicSectionNode {
  id: string
  name: string
  sectionId: string
  students: AcademicStudent[]
  classRepresentative?: string
  facultyAdvisor?: string
  subject?: string
}

export interface BranchYear {
  id: string
  year: number
  sections: AcademicSectionNode[]
}

export interface BranchNode {
  id: string
  name: string
  code?: string
  departmentId: string
  departmentName: string
  years: BranchYear[]
}

export interface UploadRow {
  name: string
  studentId: string
  branch: string
  year: number
  email?: string
  password?: string
}

export interface SelectorToast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}
