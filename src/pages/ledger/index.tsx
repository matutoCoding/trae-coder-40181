import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useQCStore } from '@/store'
import { RectificationTask, TASK_STATUS_MAP, Attachment } from '@/types'
import { getTodayDate } from '@/utils'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

type FilterKey = 'all' | 'rectifying' | 'rejected' | 'confirmed' | 'completed' | 'overdue'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'overdue', label: '已超期' },
  { key: 'rectifying', label: '整改中' },
  { key: 'rejected', label: '已驳回' },
  { key: 'confirmed', label: '待抽检' },
  { key: 'completed', label: '已完成' }
]

const isTaskOverdue = (task: RectificationTask, today: string): boolean => {
  if (task.status === 'completed') return false
  if (!task.expectedCompleteDate) return false
  return task.expectedCompleteDate < today
}

const collectAllAttachments = (task: RectificationTask): Attachment[] => {
  const list: Attachment[] = []
  task.appealAttachments?.forEach(a => list.push(a))
  task.rectificationAttachments?.forEach(a => list.push(a))
  task.rectificationVersions?.forEach(v => v.attachments.forEach(a => list.push(a)))
  const seenIds = new Set<string>()
  return list.filter(a => {
    if (seenIds.has(a.id)) return false
    seenIds.add(a.id)
    return true
  })
}

const LedgerPage: React.FC = () => {
  const tasks = useQCStore(state => state.tasks)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const today = getTodayDate()

  const tasksWithMeta = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'pending' && t.status !== 'appealing')
      .map(t => ({
        task: t,
        overdue: isTaskOverdue(t, today),
        allAttachments: collectAllAttachments(t)
      }))
  }, [tasks, today])

  const stats = useMemo(() => {
    const total = tasksWithMeta.length
    const rectifying = tasksWithMeta.filter(x => x.task.status === 'rectifying').length
    const overdue = tasksWithMeta.filter(x => x.overdue).length
    const rejected = tasksWithMeta.filter(x => x.task.status === 'rejected').length
    const completed = tasksWithMeta.filter(x => x.task.status === 'completed').length
    return { total, rectifying, overdue, rejected, completed }
  }, [tasksWithMeta])

  const filteredList = useMemo(() => {
    if (activeFilter === 'all') return tasksWithMeta
    if (activeFilter === 'overdue') return tasksWithMeta.filter(x => x.overdue)
    return tasksWithMeta.filter(x => x.task.status === activeFilter)
  }, [tasksWithMeta, activeFilter])

  const handleTaskClick = (task: RectificationTask) => {
    Taro.navigateTo({
      url: `/pages/rectification/index?taskId=${task.id}`
    })
  }

  const getPriorityLabel = (p?: string) => {
    if (p === 'high') return '高优'
    if (p === 'low') return '低优'
    return '中优'
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>📋 整改跟进台账</Text>
        <Text className={styles.pageSubtitle}>跟踪每条整改的进度、材料和时限（今日 {today}）</Text>

        <View className={styles.statBar}>
          <View className={styles.statItem}>
            <Text className={`${styles.statNum} ${styles.primary}`}>{stats.rectifying}</Text>
            <Text className={styles.statLabel}>整改中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={`${styles.statNum} ${styles.danger}`}>{stats.overdue}</Text>
            <Text className={styles.statLabel}>已超期</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={`${styles.statNum} ${styles.warning}`}>{stats.rejected}</Text>
            <Text className={styles.statLabel}>已驳回</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={`${styles.statNum} ${styles.success}`}>{stats.completed}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        {FILTERS.map(f => (
          <View
            key={f.key}
            className={`${styles.filterChip} ${activeFilter === f.key ? styles.active : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </View>
        ))}
      </View>

      <View className={styles.list}>
        {filteredList.length > 0 ? (
          filteredList.map(({ task, overdue, allAttachments }) => (
            <View
              key={task.id}
              className={`${styles.ledgerCard} ${overdue ? styles.overdue : ''} ${task.priority || 'medium'}`}
              onClick={() => handleTaskClick(task)}
            >
              <View className={styles.cardHeader}>
                <Text className={styles.cardTitle}>
                  {overdue && <Text className={styles.overdueTag}>⚠️ 超期</Text>}
                  <Text className={`${styles.priorityTag} ${task.priority || 'medium'}`}>
                    {getPriorityLabel(task.priority)}
                  </Text>
                  {task.callRecord.agentName} - {task.callRecord.projectName}
                </Text>
                <Text className={`${styles.cardStatus} ${task.status}`}>
                  {TASK_STATUS_MAP[task.status].label}
                </Text>
              </View>

              <View className={styles.cardMeta}>
                <View className={styles.metaItem}>
                  👤 负责人：<Text className={styles.metaValue}>{task.responsiblePerson || '-'}</Text>
                </View>
                <View className={styles.metaItem}>
                  📅 预计完成：
                  <Text className={overdue ? styles.deadlineItem : styles.metaValue}>
                    {task.expectedCompleteDate || '-'}
                  </Text>
                </View>
                <View className={styles.metaItem}>
                  📎 材料：<Text className={styles.metaValue}>{allAttachments.length} 份（含历史版本）</Text>
                </View>
                <View className={styles.metaItem}>
                  🔄 版本：<Text className={styles.metaValue}>第{task.resubmitCount || 0}版</Text>
                </View>
              </View>

              {task.rectificationAction && (
                <View className={styles.actionPreview}>
                  {task.rectificationAction}
                </View>
              )}

              {(task.rectificationVersions?.length || 0) > 1 && (
                <View className={styles.versionBadge}>
                  📝 共 {task.rectificationVersions?.length} 版整改，点详情可对比查看
                </View>
              )}

              {allAttachments.length > 0 && (
                <View className={styles.attachmentsRow}>
                  {allAttachments.slice(0, 4).map(a => (
                    <View key={a.id} className={styles.attachItem}>
                      {a.type === 'image' ? '🖼️' : '📝'} {a.name}
                    </View>
                  ))}
                  {allAttachments.length > 4 && (
                    <View className={styles.attachItem}>+{allAttachments.length - 4}</View>
                  )}
                </View>
              )}
            </View>
          ))
        ) : (
          <EmptyState text='当前筛选条件下暂无整改记录' icon='📋' />
        )}
      </View>
    </ScrollView>
  )
}

export default LedgerPage
