import { User, UserRole } from '@/types'

export const mockUsers: Record<UserRole, User> = {
  partyA: {
    id: 'u1',
    name: '李明',
    role: 'partyA',
    company: '甲方运营中心',
    avatar: 'https://picsum.photos/id/1005/200/200'
  },
  supplier: {
    id: 'u2',
    name: '张主管',
    role: 'supplier',
    company: '恒信外包服务有限公司',
    avatar: 'https://picsum.photos/id/1012/200/200'
  }
}

export const statistics = {
  partyA: {
    todayChecked: 12,
    thisMonthTotal: 256,
    pendingReview: 8,
    appealCount: 3
  },
  supplier: {
    pendingTasks: 5,
    rectifyingTasks: 2,
    completedThisMonth: 45,
    complianceRate: 92.5
  }
}
