import { create } from 'zustand'
import {
  CallRecord, RectificationTask, Violation, ViolationCategory,
  TaskStatus, Attachment, RejectionRecord
} from '@/types'
import { mockCalls } from '@/data/calls'
import { mockTasks } from '@/data/tasks'
import { generateId, getTodayDate } from '@/utils'

interface QCStore {
  calls: CallRecord[]
  tasks: RectificationTask[]

  getCallById: (id: string) => CallRecord | undefined
  getTaskById: (id: string) => RectificationTask | undefined
  getTasksByCallId: (callId: string) => RectificationTask[]

  updateCall: (callId: string, updates: Partial<CallRecord>) => void
  addViolationToCall: (callId: string, lineId: string, category: ViolationCategory, description: string, createdBy: string) => Violation
  removeViolationFromCall: (callId: string, lineId: string) => void

  createTaskFromCall: (callId: string, assignedTo: string) => RectificationTask | null
  updateTask: (taskId: string, updates: Partial<RectificationTask>) => void
  updateTaskStatus: (taskId: string, status: TaskStatus) => void

  submitAppeal: (taskId: string, reason: string, attachments?: Attachment[]) => void
  submitRectification: (taskId: string, action: string, attachments?: Attachment[]) => void

  confirmTask: (taskId: string, accepted: boolean, remark: string, confirmedBy: string) => void

  addAttachmentToTask: (taskId: string, field: 'appeal' | 'rectification', attachment: Attachment) => void
}

const getTimeStr = () => {
  const now = new Date()
  return `${getTodayDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export const useQCStore = create<QCStore>((set, get) => ({
  calls: [...mockCalls],
  tasks: [...mockTasks],

  getCallById: (id) => get().calls.find(c => c.id === id),
  getTaskById: (id) => get().tasks.find(t => t.id === id),
  getTasksByCallId: (callId) => get().tasks.filter(t => t.callId === callId),

  updateCall: (callId, updates) => {
    console.log('[Store] updateCall:', callId, Object.keys(updates))
    set(state => ({
      calls: state.calls.map(c => c.id === callId ? { ...c, ...updates } : c)
    }))
  },

  addViolationToCall: (callId, lineId, category, description, createdBy) => {
    const newViolation: Violation = {
      id: generateId(),
      transcriptLineId: lineId,
      category,
      description: description || (category === 'attitude' ? '服务态度问题' : category === 'process' ? '流程遗漏问题' : category === 'script' ? '话术规范问题' : '其他问题'),
      createdAt: getTimeStr(),
      createdBy
    }
    console.log('[Store] addViolationToCall:', callId, newViolation)
    set(state => ({
      calls: state.calls.map(c => c.id === callId ? {
        ...c,
        violations: [...c.violations, newViolation],
        status: 'marked'
      } : c)
    }))
    return newViolation
  },

  removeViolationFromCall: (callId, lineId) => {
    console.log('[Store] removeViolationFromCall:', callId, lineId)
    set(state => ({
      calls: state.calls.map(c => c.id === callId ? {
        ...c,
        violations: c.violations.filter(v => v.transcriptLineId !== lineId)
      } : c)
    }))
  },

  createTaskFromCall: (callId, assignedTo) => {
    const call = get().calls.find(c => c.id === callId)
    if (!call) {
      console.error('[Store] createTaskFromCall: call not found', callId)
      return null
    }
    if (call.violations.length === 0) {
      console.warn('[Store] createTaskFromCall: no violations')
      return null
    }
    const newTask: RectificationTask = {
      id: generateId(),
      callId,
      callRecord: { ...call },
      violationIds: call.violations.map(v => v.id),
      status: 'pending',
      assignedTo,
      assignedAt: getTimeStr(),
      resubmitCount: 0
    }
    console.log('[Store] createTaskFromCall success:', newTask.id)
    set(state => ({
      tasks: [newTask, ...state.tasks],
      calls: state.calls.map(c => c.id === callId ? { ...c, status: 'processing' } : c)
    }))
    return newTask
  },

  updateTask: (taskId, updates) => {
    console.log('[Store] updateTask:', taskId, Object.keys(updates))
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    }))
  },

  updateTaskStatus: (taskId, status) => {
    console.log('[Store] updateTaskStatus:', taskId, status)
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, status } : t)
    }))
  },

  submitAppeal: (taskId, reason, attachments) => {
    console.log('[Store] submitAppeal:', taskId)
    const task = get().tasks.find(t => t.id === taskId)
    if (!task) return
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? {
        ...t,
        status: 'appealing',
        appealReason: reason,
        appealAttachments: attachments || t.appealAttachments || [],
        appealAt: getTimeStr()
      } : t)
    }))
  },

  submitRectification: (taskId, action, attachments) => {
    console.log('[Store] submitRectification:', taskId)
    const task = get().tasks.find(t => t.id === taskId)
    if (!task) return
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? {
        ...t,
        status: 'rectifying',
        admitted: true,
        rectificationAction: action,
        rectificationAttachments: attachments || t.rectificationAttachments || [],
        rectificationAt: getTimeStr(),
        resubmitCount: (t.resubmitCount || 0) + 1
      } : t)
    }))
  },

  confirmTask: (taskId, accepted, remark, confirmedBy) => {
    console.log('[Store] confirmTask:', taskId, accepted)
    const task = get().tasks.find(t => t.id === taskId)
    if (!task) return

    let rejectionRecord: RejectionRecord | undefined
    if (!accepted) {
      rejectionRecord = {
        rejectedAt: getTimeStr(),
        rejectedBy: confirmedBy,
        reason: remark,
        previousStatus: task.status
      }
    }

    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? {
        ...t,
        status: accepted ? 'confirmed' : 'rejected',
        confirmedBy,
        confirmedAt: getTimeStr(),
        confirmResult: accepted ? 'accepted' : 'rejected',
        confirmRemark: remark,
        rejectionHistory: rejectionRecord
          ? [...(t.rejectionHistory || []), rejectionRecord]
          : t.rejectionHistory
      } : t)
    }))
  },

  addAttachmentToTask: (taskId, field, attachment) => {
    console.log('[Store] addAttachmentToTask:', taskId, field)
    const fieldKey = field === 'appeal' ? 'appealAttachments' : 'rectificationAttachments'
    set(state => ({
      tasks: state.tasks.map(t => {
        if (t.id !== taskId) return t
        const existing = (t[fieldKey] as Attachment[] | undefined) || []
        return { ...t, [fieldKey]: [...existing, attachment] }
      })
    }))
  }
}))
