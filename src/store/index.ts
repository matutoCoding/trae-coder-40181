import { create } from 'zustand'
import {
  CallRecord, RectificationTask, Violation, ViolationCategory,
  TaskStatus, Attachment, RejectionRecord, RectificationVersion, ReviewRecord
} from '@/types'
import { mockCalls } from '@/data/calls'
import { mockTasks } from '@/data/tasks'
import { generateId, getTodayDate } from '@/utils'

interface ConfirmRejectionItem {
  taskId: string
  remark: string
}

interface QCStore {
  calls: CallRecord[]
  tasks: RectificationTask[]

  getCallById: (id: string) => CallRecord | undefined
  getTaskById: (id: string) => RectificationTask | undefined
  getTasksByCallId: (callId: string) => RectificationTask[]

  updateCall: (callId: string, updates: Partial<CallRecord>) => void
  addViolationToCall: (callId: string, lineId: string, category: ViolationCategory, description: string, createdBy: string) => Violation
  removeViolationFromCall: (callId: string, lineId: string) => void

  createTaskFromCall: (callId: string, assignedTo: string, responsiblePerson?: string, expectedCompleteDate?: string) => RectificationTask | null
  updateTask: (taskId: string, updates: Partial<RectificationTask>) => void
  updateTaskStatus: (taskId: string, status: TaskStatus) => void

  submitAppeal: (taskId: string, reason: string, attachments?: Attachment[]) => void
  submitRectification: (taskId: string, action: string, attachments?: Attachment[], submittedBy?: string) => void

  confirmTask: (taskId: string, accepted: boolean, remark: string, confirmedBy: string) => void

  addAttachmentToTask: (taskId: string, field: 'appeal' | 'rectification', attachment: Attachment) => void

  batchRectify: (taskIds: string[], action: string) => number
  batchConfirm: (taskIds: string[], confirmedBy: string, directComplete?: boolean) => number
  batchReject: (rejections: ConfirmRejectionItem[], confirmedBy: string) => number

  spotCheckTask: (taskId: string, pass: boolean, remark: string, checkedBy: string) => void
  batchSpotCheck: (taskIds: string[], pass: boolean, remark: string, checkedBy: string) => number
  batchSpotCheckReject: (rejections: ConfirmRejectionItem[], checkedBy: string) => number
  completeTask: (taskId: string, completedBy: string, type: 'auto' | 'spotcheck-pass' | 'manual', remark?: string) => void
  batchComplete: (taskIds: string[], completedBy: string, type: 'auto' | 'spotcheck-pass' | 'manual') => number

  lastCreatedTaskId: string | null
  setLastCreatedTaskId: (id: string | null) => void

  callsFilter: { project: string | null; date: string | null }
  setCallsFilter: (filter: Partial<{ project: string | null; date: string | null }>) => void

  tasksFilter: { project: string | null; supplier: string | null; tab: TaskStatus | 'all' }
  setTasksFilter: (filter: Partial<{ project: string | null; supplier: string | null; tab: TaskStatus | 'all' }>) => void

  reportFilter: { startDate: string; endDate: string; lastDrillProject: string | null }
  setReportFilter: (filter: Partial<{ startDate: string; endDate: string; lastDrillProject: string | null }>) => void
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

  createTaskFromCall: (callId, assignedTo, responsiblePerson, expectedCompleteDate) => {
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
      responsiblePerson: responsiblePerson || assignedTo,
      expectedCompleteDate,
      priority: call.violations.length >= 2 ? 'high' : 'medium',
      resubmitCount: 0,
      rectificationVersions: []
    }
    console.log('[Store] createTaskFromCall success:', newTask.id)
    set(state => ({
      tasks: [newTask, ...state.tasks],
      calls: state.calls.map(c => c.id === callId ? { ...c, status: 'processing' } : c),
      lastCreatedTaskId: newTask.id,
      callsFilter: { ...state.callsFilter, date: call.date, project: call.projectName },
      tasksFilter: { ...state.tasksFilter, project: call.projectName, supplier: assignedTo, tab: 'pending' }
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

  submitRectification: (taskId, action, attachments, submittedBy) => {
    console.log('[Store] submitRectification:', taskId)
    const task = get().tasks.find(t => t.id === taskId)
    if (!task) return
    const versionNum = (task.resubmitCount || 0) + 1
    const newVersion: RectificationVersion = {
      version: versionNum,
      action,
      attachments: attachments || task.rectificationAttachments || [],
      submittedAt: getTimeStr(),
      submittedBy: submittedBy || task.responsiblePerson || task.assignedTo
    }
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? {
        ...t,
        status: 'rectifying',
        admitted: true,
        rectificationAction: action,
        rectificationAttachments: attachments || t.rectificationAttachments || [],
        rectificationAt: getTimeStr(),
        resubmitCount: versionNum,
        rectificationVersions: [...(t.rectificationVersions || []), newVersion]
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
  },

  batchRectify: (taskIds, action) => {
    console.log('[Store] batchRectify, ids:', taskIds.length)
    const timeStr = getTimeStr()
    let count = 0
    set(state => ({
      tasks: state.tasks.map(t => {
        if (!taskIds.includes(t.id)) return t
        count++
        const versionNum = (t.resubmitCount || 0) + 1
        const newVersion: RectificationVersion = {
          version: versionNum,
          action,
          attachments: t.rectificationAttachments || [],
          submittedAt: timeStr,
          submittedBy: t.responsiblePerson || t.assignedTo
        }
        return {
          ...t,
          status: 'rectifying',
          admitted: true,
          rectificationAction: action,
          rectificationAt: timeStr,
          resubmitCount: versionNum,
          rectificationVersions: [...(t.rectificationVersions || []), newVersion]
        }
      })
    }))
    return count
  },

  batchConfirm: (taskIds, confirmedBy, directComplete = true) => {
    console.log('[Store] batchConfirm, ids:', taskIds.length, 'directComplete:', directComplete)
    const timeStr = getTimeStr()
    let count = 0
    set(state => ({
      tasks: state.tasks.map(t => {
        if (!taskIds.includes(t.id)) return t
        count++
        const reviewRecord: ReviewRecord = {
          reviewedAt: timeStr,
          reviewedBy: confirmedBy,
          result: 'accepted',
          type: 'first'
        }
        const base = {
          ...t,
          confirmedBy,
          confirmedAt: timeStr,
          confirmResult: 'accepted' as const,
          confirmRemark: directComplete ? '批量审核通过并完成归档' : '批量审核通过',
          reviewHistory: [...(t.reviewHistory || []), reviewRecord]
        }
        if (directComplete) {
          return {
            ...base,
            status: 'completed' as const,
            completedBy: confirmedBy,
            completedAt: timeStr,
            completionType: 'manual' as const
          }
        }
        return { ...base, status: 'confirmed' as const }
      })
    }))
    return count
  },

  batchReject: (rejections, confirmedBy) => {
    console.log('[Store] batchReject, items:', rejections.length)
    const timeStr = getTimeStr()
    const rejectionMap = new Map(rejections.map(r => [r.taskId, r.remark]))
    let count = 0
    set(state => ({
      tasks: state.tasks.map(t => {
        const remark = rejectionMap.get(t.id)
        if (remark === undefined) return t
        count++
        const rejectionRecord: RejectionRecord = {
          rejectedAt: timeStr,
          rejectedBy: confirmedBy,
          reason: remark,
          previousStatus: t.status
        }
        const reviewRecord: ReviewRecord = {
          reviewedAt: timeStr,
          reviewedBy: confirmedBy,
          result: 'rejected',
          remark,
          type: 'first'
        }
        return {
          ...t,
          status: 'rejected',
          confirmedBy,
          confirmedAt: timeStr,
          confirmResult: 'rejected',
          confirmRemark: remark,
          rejectionHistory: [...(t.rejectionHistory || []), rejectionRecord],
          reviewHistory: [...(t.reviewHistory || []), reviewRecord]
        }
      })
    }))
    return count
  },

  spotCheckTask: (taskId, pass, remark, checkedBy) => {
    console.log('[Store] spotCheckTask:', taskId, pass)
    const timeStr = getTimeStr()
    const task = get().tasks.find(t => t.id === taskId)
    if (!task) return

    const reviewRecord: ReviewRecord = {
      reviewedAt: timeStr,
      reviewedBy: checkedBy,
      result: pass ? 'accepted' : 'rejected',
      remark,
      type: 'spotcheck'
    }

    set(state => ({
      tasks: state.tasks.map(t => {
        if (t.id !== taskId) return t
        const base = {
          ...t,
          spotChecked: true,
          spotCheckResult: pass ? 'pass' : 'fail',
          spotCheckedBy: checkedBy,
          spotCheckedAt: timeStr,
          spotCheckRemark: remark,
          reviewHistory: [...(t.reviewHistory || []), reviewRecord]
        }
        if (pass) {
          return {
            ...base,
            status: 'completed' as const,
            completedBy: checkedBy,
            completedAt: timeStr,
            completionType: 'spotcheck-pass' as const
          }
        }
        if (!pass && task.status === 'confirmed') {
          const rejectionRecord: RejectionRecord = {
            rejectedAt: timeStr,
            rejectedBy: checkedBy,
            reason: remark,
            previousStatus: 'confirmed'
          }
          return {
            ...base,
            status: 'rejected' as const,
            rejectionHistory: [...(t.rejectionHistory || []), rejectionRecord]
          }
        }
        return base
      })
    }))
  },

  completeTask: (taskId, completedBy, type, remark) => {
    console.log('[Store] completeTask:', taskId, type)
    const timeStr = getTimeStr()
    set(state => ({
      tasks: state.tasks.map(t => {
        if (t.id !== taskId) return t
        return {
          ...t,
          status: 'completed',
          completedBy,
          completedAt: timeStr,
          completionType: type,
          confirmRemark: remark || t.confirmRemark
        }
      })
    }))
  },

  batchComplete: (taskIds, completedBy, type) => {
    console.log('[Store] batchComplete, ids:', taskIds.length)
    const timeStr = getTimeStr()
    let count = 0
    set(state => ({
      tasks: state.tasks.map(t => {
        if (!taskIds.includes(t.id)) return t
        count++
        return {
          ...t,
          status: 'completed',
          completedBy,
          completedAt: timeStr,
          completionType: type
        }
      })
    }))
    return count
  },

  batchSpotCheck: (taskIds, pass, remark, checkedBy) => {
    console.log('[Store] batchSpotCheck, ids:', taskIds.length, pass)
    const timeStr = getTimeStr()
    let count = 0
    set(state => ({
      tasks: state.tasks.map(t => {
        if (!taskIds.includes(t.id) || t.status !== 'confirmed') return t
        count++
        const reviewRecord: ReviewRecord = {
          reviewedAt: timeStr,
          reviewedBy: checkedBy,
          result: pass ? 'accepted' : 'rejected',
          remark,
          type: 'spotcheck'
        }
        const base = {
          ...t,
          spotChecked: true,
          spotCheckResult: pass ? 'pass' : 'fail',
          spotCheckedBy: checkedBy,
          spotCheckedAt: timeStr,
          spotCheckRemark: remark,
          reviewHistory: [...(t.reviewHistory || []), reviewRecord]
        }
        if (pass) {
          return {
            ...base,
            status: 'completed' as const,
            completedBy: checkedBy,
            completedAt: timeStr,
            completionType: 'spotcheck-pass' as const
          }
        }
        const rejectionRecord: RejectionRecord = {
          rejectedAt: timeStr,
          rejectedBy: checkedBy,
          reason: remark,
          previousStatus: 'confirmed',
          type: 'spotcheck'
        }
        return {
          ...base,
          status: 'rejected' as const,
          rejectionHistory: [...(t.rejectionHistory || []), rejectionRecord]
        }
      })
    }))
    return count
  },

  batchSpotCheckReject: (rejections, checkedBy) => {
    console.log('[Store] batchSpotCheckReject, items:', rejections.length)
    const timeStr = getTimeStr()
    const rejectionMap = new Map(rejections.map(r => [r.taskId, r.remark]))
    let count = 0
    set(state => ({
      tasks: state.tasks.map(t => {
        const remark = rejectionMap.get(t.id)
        if (remark === undefined || t.status !== 'confirmed') return t
        count++
        const reviewRecord: ReviewRecord = {
          reviewedAt: timeStr,
          reviewedBy: checkedBy,
          result: 'rejected',
          remark,
          type: 'spotcheck'
        }
        const rejectionRecord: RejectionRecord = {
          rejectedAt: timeStr,
          rejectedBy: checkedBy,
          reason: remark,
          previousStatus: 'confirmed',
          type: 'spotcheck'
        }
        return {
          ...t,
          status: 'rejected',
          spotChecked: true,
          spotCheckResult: 'fail',
          spotCheckedBy: checkedBy,
          spotCheckedAt: timeStr,
          spotCheckRemark: remark,
          reviewHistory: [...(t.reviewHistory || []), reviewRecord],
          rejectionHistory: [...(t.rejectionHistory || []), rejectionRecord]
        }
      })
    }))
    return count
  },

  lastCreatedTaskId: null,
  setLastCreatedTaskId: (id) => set({ lastCreatedTaskId: id }),

  callsFilter: { project: null, date: null },
  setCallsFilter: (filter) => set(state => ({ callsFilter: { ...state.callsFilter, ...filter } })),

  tasksFilter: { project: null, supplier: null, tab: 'all' as TaskStatus | 'all' },
  setTasksFilter: (filter) => set(state => ({ tasksFilter: { ...state.tasksFilter, ...filter } })),

  reportFilter: { startDate: '2024-06-17', endDate: '2024-06-20', lastDrillProject: null },
  setReportFilter: (filter) => set(state => ({ reportFilter: { ...state.reportFilter, ...filter } }))
}))
