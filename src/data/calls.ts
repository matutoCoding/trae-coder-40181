import { CallRecord, Project } from '@/types'

export const mockProjects: Project[] = [
  { id: 'p1', name: '电商售后咨询项目' },
  { id: 'p2', name: '金融客服项目' },
  { id: 'p3', name: '快递物流项目' },
  { id: 'p4', name: '在线教育项目' }
]

const buildTranscript = (callId: string) => {
  const lines = [
    { role: 'agent' as const, speaker: '坐席-张丽', content: '您好，欢迎致电XX客服中心，请问有什么可以帮您？', emotion: 'neutral' as const },
    { role: 'customer' as const, speaker: '客户-王先生', content: '你好，我上周买的东西现在还没到，怎么回事啊？', emotion: 'negative' as const },
    { role: 'agent' as const, speaker: '坐席-张丽', content: '非常抱歉给您带来不便，请问您的订单号是多少呢？我这边帮您查询一下。', emotion: 'neutral' as const },
    { role: 'customer' as const, speaker: '客户-王先生', content: '订单号是2024061500012345，都一个礼拜了！', emotion: 'negative' as const },
    { role: 'agent' as const, speaker: '坐席-张丽', content: '好的王先生，我查到了，您的订单是从广州仓库发出的，由于最近暴雨天气，物流有所延误。', emotion: 'neutral' as const },
    { role: 'customer' as const, speaker: '客户-王先生', content: '那你们也不通知一下？我等到现在什么消息都没有！', emotion: 'negative' as const },
    { role: 'agent' as const, speaker: '坐席-张丽', content: '实在不好意思，我们确实没有及时跟进通知您，物流信息显示预计明天上午可以送达。', emotion: 'neutral' as const },
    { role: 'customer' as const, speaker: '客户-王先生', content: '明天再不到我就不要了，直接退货！', emotion: 'negative' as const },
    { role: 'agent' as const, speaker: '坐席-张丽', content: '好的我这边帮您备注加急派送，如果明天确实无法送达，您随时联系我们办理退货退款。还有其他可以帮您的吗？', emotion: 'positive' as const },
    { role: 'customer' as const, speaker: '客户-王先生', content: '没有了，希望这次说话算话。', emotion: 'neutral' as const },
    { role: 'agent' as const, speaker: '坐席-张丽', content: '好的请您放心，感谢您的来电，再见。', emotion: 'positive' as const }
  ]
  
  return lines.map((line, idx) => ({
    id: `${callId}-l${idx + 1}`,
    ...line,
    timestamp: `00:${String(Math.floor(idx * 15 / 60)).padStart(2, '0')}:${String(idx * 15 % 60).padStart(2, '0')}`,
    timeSeconds: idx * 15
  }))
}

export const mockCalls: CallRecord[] = [
  {
    id: 'c1',
    projectId: 'p1',
    projectName: '电商售后咨询项目',
    agentName: '张丽',
    agentId: 'a1',
    supplierName: '恒信外包',
    date: '2024-06-20',
    startTime: '09:32:15',
    duration: 185,
    customerEmotion: 'negative',
    suspectedViolationCount: 2,
    transcript: buildTranscript('c1'),
    violations: [
      { id: 'v1', transcriptLineId: 'c1-l6', category: 'process', description: '未主动告知物流延迟情况', createdAt: '2024-06-20 14:30', createdBy: '质检-李经理' },
      { id: 'v2', transcriptLineId: 'c1-l8', category: 'script', description: '道歉话术不够规范', createdAt: '2024-06-20 14:35', createdBy: '质检-李经理' }
    ],
    status: 'processing'
  },
  {
    id: 'c2',
    projectId: 'p1',
    projectName: '电商售后咨询项目',
    agentName: '李明',
    agentId: 'a2',
    supplierName: '恒信外包',
    date: '2024-06-20',
    startTime: '10:15:42',
    duration: 243,
    customerEmotion: 'neutral',
    suspectedViolationCount: 0,
    transcript: buildTranscript('c2'),
    violations: [],
    status: 'unchecked'
  },
  {
    id: 'c3',
    projectId: 'p2',
    projectName: '金融客服项目',
    agentName: '王芳',
    agentId: 'a3',
    supplierName: '卓越客服',
    date: '2024-06-20',
    startTime: '11:08:30',
    duration: 312,
    customerEmotion: 'negative',
    suspectedViolationCount: 3,
    transcript: buildTranscript('c3'),
    violations: [
      { id: 'v3', transcriptLineId: 'c3-l4', category: 'attitude', description: '语气不耐烦', createdAt: '2024-06-20 15:00', createdBy: '质检-陈主管' }
    ],
    status: 'marked'
  },
  {
    id: 'c4',
    projectId: 'p1',
    projectName: '电商售后咨询项目',
    agentName: '赵雪',
    agentId: 'a4',
    supplierName: '恒信外包',
    date: '2024-06-20',
    startTime: '14:22:08',
    duration: 156,
    customerEmotion: 'positive',
    suspectedViolationCount: 0,
    transcript: buildTranscript('c4'),
    violations: [],
    status: 'closed'
  },
  {
    id: 'c5',
    projectId: 'p3',
    projectName: '快递物流项目',
    agentName: '陈强',
    agentId: 'a5',
    supplierName: '速达服务',
    date: '2024-06-20',
    startTime: '15:45:18',
    duration: 198,
    customerEmotion: 'neutral',
    suspectedViolationCount: 1,
    transcript: buildTranscript('c5'),
    violations: [],
    status: 'unchecked'
  },
  {
    id: 'c6',
    projectId: 'p2',
    projectName: '金融客服项目',
    agentName: '刘洋',
    agentId: 'a6',
    supplierName: '卓越客服',
    date: '2024-06-19',
    startTime: '09:08:55',
    duration: 267,
    customerEmotion: 'negative',
    suspectedViolationCount: 2,
    transcript: buildTranscript('c6'),
    violations: [
      { id: 'v4', transcriptLineId: 'c6-l5', category: 'script', description: '未使用规范开场话术', createdAt: '2024-06-19 16:20', createdBy: '质检-陈主管' }
    ],
    status: 'closed'
  },
  {
    id: 'c7',
    projectId: 'p4',
    projectName: '在线教育项目',
    agentName: '孙婷',
    agentId: 'a7',
    supplierName: '优才服务',
    date: '2024-06-19',
    startTime: '11:30:42',
    duration: 345,
    customerEmotion: 'positive',
    suspectedViolationCount: 0,
    transcript: buildTranscript('c7'),
    violations: [],
    status: 'unchecked'
  },
  {
    id: 'c8',
    projectId: 'p3',
    projectName: '快递物流项目',
    agentName: '周磊',
    agentId: 'a8',
    supplierName: '速达服务',
    date: '2024-06-19',
    startTime: '16:12:09',
    duration: 178,
    customerEmotion: 'negative',
    suspectedViolationCount: 1,
    transcript: buildTranscript('c8'),
    violations: [],
    status: 'processing'
  }
]
