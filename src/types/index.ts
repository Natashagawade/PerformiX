export type Role = 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
export type GoalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED'
export type GoalType = 'INDIVIDUAL' | 'SHARED'
export type UoM = 'NUMERIC' | 'PERCENTAGE' | 'TIMELINE' | 'ZERO_BASED'
export type CheckInStatus = 'NOT_STARTED' | 'ON_TRACK' | 'AT_RISK' | 'COMPLETED'
export type CyclePhase = 'GOAL_SETTING' | 'Q1' | 'Q2' | 'Q3' | 'Q4'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  departmentId?: string
  managerId?: string
  department?: Department
  manager?: User
  avatarUrl?: string
}

export interface Department {
  id: string
  name: string
}

export interface Goal {
  id: string
  title: string
  description?: string
  thrustArea: string
  uom: UoM
  goalType: GoalType
  target: number
  weightage: number
  deadline: string
  status: GoalStatus
  isLocked: boolean
  isShared: boolean
  ownerId: string
  cycleId: string
  approverId?: string
  managerComment?: string
  approvedAt?: string
  submittedAt?: string
  owner?: User
  approver?: User
  checkIns?: CheckIn[]
  progressScore?: number
}

export interface CheckIn {
  id: string
  goalId: string
  cycleId: string
  userId: string
  quarter: string
  plannedTarget: number
  actualAchieved: number
  status: CheckInStatus
  employeeComment?: string
  managerFeedback?: string
  progressScore: number
}

export interface Cycle {
  id: string
  name: string
  phase: CyclePhase
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
  startDate: string
  endDate: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  read: boolean
  link?: string | null
  createdAt: string | Date
}

export interface AuditLog {
  id: string
  action: string
  userId: string
  goalId?: string
  details: string
  createdAt: string
  user?: User
  goal?: Goal
}

export interface Escalation {
  id: string
  userId: string
  goalId?: string
  reason: string
  status: 'PENDING' | 'ESCALATED' | 'RESOLVED'
  createdAt: string
}

// Dashboard analytics types
export interface DashboardStats {
  totalGoals: number
  avgProgress: number
  totalWeightage: number
  completedGoals: number
  pendingApprovals?: number
  atRiskCount?: number
  teamSize?: number
  orgCompletion?: number
}

export interface GoalWithProgress extends Goal {
  progress: number
}

export interface TeamMember {
  user: User
  goals: Goal[]
  completion: number
  pendingCount: number
}

// Form types
export interface GoalFormData {
  title: string
  description: string
  thrustArea: string
  uom: UoM
  goalType: GoalType
  target: number
  weightage: number
  deadline: string
}

export interface CheckInFormData {
  quarter: string
  plannedTarget: number
  actualAchieved: number
  status: CheckInStatus
  employeeComment: string
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
