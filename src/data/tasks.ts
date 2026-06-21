import { RectificationTask } from '@/types'
import { mockCalls } from './calls'

export const mockTasks: RectificationTask[] = [
  {
    id: 't1',
    callId: 'c1',
    callRecord: mockCalls[0],
    violationIds: ['v1', 'v2'],
    status: 'pending',
    assignedTo: '恒信外包-张主管',
    assignedAt: '2024-06-20 14:40',
    responsiblePerson: '李明',
    expectedCompleteDate: '2024-06-22',
    priority: 'high',
    resubmitCount: 0
  },
  {
    id: 't2',
    callId: 'c3',
    callRecord: mockCalls[2],
    violationIds: ['v3'],
    status: 'appealing',
    assignedTo: '卓越客服-王主管',
    assignedAt: '2024-06-20 15:10',
    responsiblePerson: '王芳',
    expectedCompleteDate: '2024-06-23',
    priority: 'medium',
    appealReason: '该通话中坐席语气符合服务标准，客户当时情绪较激动，坐席已尽力安抚，请重新复核。',
    appealAttachments: [
      {
        id: 'att1',
        type: 'image',
        url: 'https://picsum.photos/id/180/600/400',
        name: '服务规范截图.png',
        createdAt: '2024-06-20 16:30'
      },
      {
        id: 'att2',
        type: 'text',
        content: '该坐席当月质检评分96分，近30天无态度类投诉，本次为首次被标注态度问题。',
        name: '坐席历史记录说明',
        createdAt: '2024-06-20 16:31'
      }
    ],
    appealAt: '2024-06-20 16:30',
    resubmitCount: 0
  },
  {
    id: 't3',
    callId: 'c6',
    callRecord: mockCalls[5],
    violationIds: ['v4'],
    status: 'rectifying',
    assignedTo: '卓越客服-李经理',
    assignedAt: '2024-06-19 16:30',
    responsiblePerson: '刘洋',
    expectedCompleteDate: '2024-06-21',
    priority: 'high',
    overdue: true,
    admitted: true,
    rectificationAction: '1. 对坐席刘洋进行话术规范再培训；2. 要求每日早会抽验5通开场话术；3. 本周内完成全员话术考核。',
    rectificationAt: '2024-06-19 18:00',
    rectificationVersions: [
      {
        version: 1,
        action: '1. 对坐席刘洋进行话术规范再培训；2. 要求每日早会抽验5通开场话术；3. 本周内完成全员话术考核。',
        attachments: [],
        submittedAt: '2024-06-19 18:00',
        submittedBy: '刘洋'
      }
    ],
    resubmitCount: 0
  },
  {
    id: 't4',
    callId: 'c8',
    callRecord: mockCalls[7],
    violationIds: [],
    status: 'confirmed',
    assignedTo: '速达服务-赵主管',
    assignedAt: '2024-06-19 17:00',
    responsiblePerson: '周磊',
    expectedCompleteDate: '2024-06-20',
    priority: 'low',
    admitted: true,
    rectificationAction: '已对坐席周磊进行一对一辅导，并要求提交服务心得。',
    rectificationAt: '2024-06-19 19:20',
    rectificationVersions: [
      {
        version: 1,
        action: '已对坐席周磊进行一对一辅导，并要求提交服务心得。',
        attachments: [],
        submittedAt: '2024-06-19 19:20',
        submittedBy: '周磊'
      }
    ],
    confirmedBy: '质检-陈主管',
    confirmedAt: '2024-06-20 09:00',
    confirmResult: 'accepted',
    spotChecked: false,
    resubmitCount: 0
  },
  {
    id: 't5',
    callId: 'c1',
    callRecord: mockCalls[0],
    violationIds: ['v1'],
    status: 'rejected',
    assignedTo: '恒信外包-刘主管',
    assignedAt: '2024-06-19 10:00',
    responsiblePerson: '张晓',
    expectedCompleteDate: '2024-06-21',
    priority: 'high',
    admitted: true,
    rectificationAction: '对坐席进行了口头提醒。',
    rectificationAt: '2024-06-19 11:30',
    rectificationVersions: [
      {
        version: 1,
        action: '对坐席进行了口头提醒。',
        attachments: [],
        submittedAt: '2024-06-19 11:30',
        submittedBy: '张晓'
      }
    ],
    confirmedBy: '质检-陈主管',
    confirmedAt: '2024-06-19 14:00',
    confirmResult: 'rejected',
    confirmRemark: '整改措施过于简单，仅口头提醒不足以防止同类问题再次发生。请补充具体的培训记录和考核方案。',
    rejectionHistory: [
      {
        rejectedAt: '2024-06-19 14:00',
        rejectedBy: '质检-陈主管',
        reason: '整改措施过于简单，仅口头提醒不足以防止同类问题再次发生。',
        previousStatus: 'rectifying'
      }
    ],
    resubmitCount: 1
  },
  {
    id: 't6',
    callId: 'c2',
    callRecord: mockCalls[1],
    violationIds: ['v5'],
    status: 'completed',
    assignedTo: '恒信外包-张主管',
    assignedAt: '2024-06-18 09:00',
    responsiblePerson: '陈红',
    expectedCompleteDate: '2024-06-19',
    priority: 'medium',
    admitted: true,
    rectificationAction: '已组织服务态度专项培训，全员通过考核，并更新了现场巡检制度。',
    rectificationAt: '2024-06-18 17:00',
    rectificationVersions: [
      {
        version: 1,
        action: '已组织服务态度专项培训，全员通过考核，并更新了现场巡检制度。',
        attachments: [
          {
            id: 'att3',
            type: 'image',
            url: 'https://picsum.photos/id/20/600/400',
            name: '培训签到表.jpg',
            createdAt: '2024-06-18 17:00'
          }
        ],
        submittedAt: '2024-06-18 17:00',
        submittedBy: '陈红'
      }
    ],
    confirmedBy: '质检-陈主管',
    confirmedAt: '2024-06-19 10:00',
    confirmResult: 'accepted',
    spotChecked: true,
    spotCheckResult: 'pass',
    spotCheckedBy: '质检-李经理',
    spotCheckedAt: '2024-06-20 14:00',
    spotCheckRemark: '整改到位，抽检通话均符合规范。',
    completedBy: '系统',
    completedAt: '2024-06-20 14:00',
    completionType: 'spotcheck-pass',
    resubmitCount: 0
  },
  {
    id: 't7',
    callId: 'c4',
    callRecord: mockCalls[3],
    violationIds: ['v6'],
    status: 'completed',
    assignedTo: '卓越客服-李经理',
    assignedAt: '2024-06-17 14:00',
    responsiblePerson: '王静',
    expectedCompleteDate: '2024-06-18',
    priority: 'low',
    admitted: true,
    rectificationAction: '已进行流程规范学习，坐席已掌握正确退款操作流程。',
    rectificationAt: '2024-06-17 18:30',
    rectificationVersions: [
      {
        version: 1,
        action: '已进行流程规范学习，坐席已掌握正确退款操作流程。',
        attachments: [],
        submittedAt: '2024-06-17 18:30',
        submittedBy: '王静'
      }
    ],
    confirmedBy: '质检-陈主管',
    confirmedAt: '2024-06-18 09:30',
    confirmResult: 'accepted',
    completedBy: '系统',
    completedAt: '2024-06-20 09:30',
    completionType: 'auto',
    spotChecked: false,
    resubmitCount: 0
  }
]
