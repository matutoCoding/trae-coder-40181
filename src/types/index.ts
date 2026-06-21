export type UserRole = 'partyA' | 'supplier'

export type EmotionType = 'positive' | 'neutral' | 'negative'

export type ViolationCategory = 'attitude' | 'process' | 'script' | 'other'

export type TaskStatus = 'pending' | 'appealing' | 'rectifying' | 'rejected' | 'confirmed' | 'completed'

export interface User {
  id: string
  name: string
  role: UserRole
  company: string
  avatar: string
}

export interface Project {
  id: string
  name: string
}

export interface TranscriptLine {
  id: string
  role: 'agent' | 'customer'
  speaker: string
  content: string
  timestamp: string
  timeSeconds: number
  emotion?: EmotionType
}

export interface Violation {
  id: string
  transcriptLineId: string
  category: ViolationCategory
  description: string
  createdAt: string
  createdBy: string
}

export interface CallRecord {
  id: string
  projectId: string
  projectName: string
  agentName: string
  agentId: string
  supplierName: string
  date: string
  startTime: string
  duration: number
  customerEmotion: EmotionType
  suspectedViolationCount: number
  transcript: TranscriptLine[]
  violations: Violation[]
  status: 'unchecked' | 'marked' | 'processing' | 'closed'
}

export interface Attachment {
  id: string
  type: 'image' | 'text'
  url?: string
  content?: string
  name: string
  createdAt: string
}

export interface RejectionRecord {
  rejectedAt: string
  rejectedBy: string
  reason: string
  previousStatus: TaskStatus
}

export interface RectificationTask {
  id: string
  callId: string
  callRecord: CallRecord
  violationIds: string[]
  status: TaskStatus
  assignedTo: string
  assignedAt: string
  appealReason?: string
  appealAttachments?: Attachment[]
  appealAt?: string
  admitted?: boolean
  rectificationAction?: string
  rectificationAttachments?: Attachment[]
  rectificationAt?: string
  confirmedBy?: string
  confirmedAt?: string
  confirmResult?: 'accepted' | 'rejected'
  confirmRemark?: string
  rejectionHistory?: RejectionRecord[]
  resubmitCount?: number
}

export const VIOLATION_CATEGORY_MAP: Record<ViolationCategory, { label: string; color: string }> = {
  attitude: { label: '服务态度', color: '#EF4444' },
  process: { label: '流程遗漏', color: '#F59E0B' },
  script: { label: '话术错误', color: '#8B5CF6' },
  other: { label: '其他问题', color: '#6B7280' }
}

export const EMOTION_MAP: Record<EmotionType, { label: string; color: string; bg: string }> = {
  positive: { label: '正面', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  neutral: { label: '中性', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
  negative: { label: '负面', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' }
}

export const TASK_STATUS_MAP: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待确认', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  appealing: { label: '申诉中', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  rectifying: { label: '整改中', color: '#2B5AFF', bg: 'rgba(43, 90, 255, 0.08)' },
  rejected: { label: '已驳回待补充', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)' },
  confirmed: { label: '已确认', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  completed: { label: '已完成', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' }
}
