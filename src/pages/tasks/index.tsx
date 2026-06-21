import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import classnames from 'classnames'
import { mockTasks } from '@/data/tasks'
import { TaskStatus, RectificationTask, UserRole, TASK_STATUS_MAP } from '@/types'
import TaskCard from '@/components/TaskCard'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

interface TabItem {
  key: TaskStatus | 'all'
  label: string
}

const TABS: TabItem[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待确认' },
  { key: 'appealing', label: '申诉中' },
  { key: 'rectifying', label: '整改中' },
  { key: 'confirmed', label: '已确认' }
]

const TasksPage: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('supplier')
  const [activeTab, setActiveTab] = useState<TabItem['key']>('all')
  const [tasks] = useState<RectificationTask[]>(mockTasks)

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (activeTab === 'all') return true
      return task.status === activeTab
    })
  }, [tasks, activeTab])

  const summary = useMemo(() => {
    const pending = tasks.filter(t => t.status === 'pending').length
    const appealing = tasks.filter(t => t.status === 'appealing').length
    const rectifying = tasks.filter(t => t.status === 'rectifying').length
    const done = tasks.filter(t => t.status === 'confirmed' || t.status === 'completed').length
    return { pending, appealing, rectifying, done }
  }, [tasks])

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.roleSwitch}>
          <View
            className={classnames(styles.roleItem, { [styles.active]: currentRole === 'supplier' })}
            onClick={() => setCurrentRole('supplier')}
          >
            供应商视角
          </View>
          <View
            className={classnames(styles.roleItem, { [styles.active]: currentRole === 'partyA' })}
            onClick={() => setCurrentRole('partyA')}
          >
            甲方视角
          </View>
        </View>

        <View className={styles.summaryRow}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryNum} style={{ color: '#F59E0B' }}>{summary.pending}</Text>
            <Text className={styles.summaryLabel}>待确认</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryNum} style={{ color: '#8B5CF6' }}>{summary.appealing}</Text>
            <Text className={styles.summaryLabel}>申诉中</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryNum} style={{ color: '#2B5AFF' }}>{summary.rectifying}</Text>
            <Text className={styles.summaryLabel}>整改中</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryNum} style={{ color: '#10B981' }}>{summary.done}</Text>
            <Text className={styles.summaryLabel}>已完成</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        {TABS.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, { [styles.active]: activeTab === tab.key })}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </View>

      <View className={styles.listSection}>
        <View className={styles.sectionTitle}>
          <Text className={styles.titleText}>
            {currentRole === 'supplier' ? '我的待办' : '质检任务'}
          </Text>
          <Text className={styles.countText}>共 {filteredTasks.length} 条</Text>
        </View>

        <View className={styles.listWrap}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          ) : (
            <EmptyState text='暂无任务' icon='📋' />
          )}
        </View>
      </View>
    </ScrollView>
  )
}

export default TasksPage
