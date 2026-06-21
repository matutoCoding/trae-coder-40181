import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useQCStore } from '@/store'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

interface ProjectStat {
  projectName: string
  totalCalls: number
  issueCalls: number
  issueRate: number
  appealCount: number
  appealRate: number
  rectifyCount: number
  rectifyPassCount: number
  rectifyPassRate: number
  completedCount: number
  pendingCount: number
}

const ReportPage: React.FC = () => {
  const calls = useQCStore(state => state.calls)
  const tasks = useQCStore(state => state.tasks)

  const availableDates = useMemo(() => {
    const set = new Set(calls.map(c => c.date))
    return Array.from(set).sort()
  }, [calls])

  const [startDate, setStartDate] = useState(availableDates[0] || '2024-06-19')
  const [endDate, setEndDate] = useState(availableDates[availableDates.length - 1] || '2024-06-20')

  const filteredCalls = useMemo(() => {
    return calls.filter(c => c.date >= startDate && c.date <= endDate)
  }, [calls, startDate, endDate])

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const d = t.callRecord.date
      return d >= startDate && d <= endDate
    })
  }, [tasks, startDate, endDate])

  const overall = useMemo(() => {
    const totalCalls = filteredCalls.length
    const issueCalls = filteredCalls.filter(c => c.violations.length > 0).length
    const issueRate = totalCalls > 0 ? Math.round((issueCalls / totalCalls) * 100) : 0

    const appealCount = filteredTasks.filter(t => t.status === 'appealing' || t.appealAt).length
    const appealRate = filteredTasks.length > 0 ? Math.round((appealCount / filteredTasks.length) * 100) : 0

    const rectifyCount = filteredTasks.filter(t => t.status === 'rectifying' || t.status === 'rejected' || t.status === 'confirmed' || t.status === 'completed').length
    const rectifyPassCount = filteredTasks.filter(t => t.status === 'confirmed' || t.status === 'completed').length
    const rectifyPassRate = rectifyCount > 0 ? Math.round((rectifyPassCount / rectifyCount) * 100) : 0

    const completed = filteredTasks.filter(t => t.status === 'completed').length

    return { totalCalls, issueCalls, issueRate, appealCount, appealRate, rectifyCount, rectifyPassCount, rectifyPassRate, completed }
  }, [filteredCalls, filteredTasks])

  const projectStats = useMemo((): ProjectStat[] => {
    const map = new Map<string, ProjectStat>()

    filteredCalls.forEach(c => {
      if (!map.has(c.projectName)) {
        map.set(c.projectName, {
          projectName: c.projectName,
          totalCalls: 0, issueCalls: 0, issueRate: 0,
          appealCount: 0, appealRate: 0,
          rectifyCount: 0, rectifyPassCount: 0, rectifyPassRate: 0,
          completedCount: 0, pendingCount: 0
        })
      }
      const s = map.get(c.projectName)!
      s.totalCalls++
      if (c.violations.length > 0) s.issueCalls++
    })

    filteredTasks.forEach(t => {
      const name = t.callRecord.projectName
      if (!map.has(name)) {
        map.set(name, {
          projectName: name,
          totalCalls: 0, issueCalls: 0, issueRate: 0,
          appealCount: 0, appealRate: 0,
          rectifyCount: 0, rectifyPassCount: 0, rectifyPassRate: 0,
          completedCount: 0, pendingCount: 0
        })
      }
      const s = map.get(name)!
      if (t.status === 'appealing' || t.appealAt) s.appealCount++
      if (t.status === 'rectifying' || t.status === 'rejected' || t.status === 'confirmed' || t.status === 'completed') {
        s.rectifyCount++
      }
      if (t.status === 'confirmed' || t.status === 'completed') s.rectifyPassCount++
      if (t.status === 'completed') s.completedCount++
      if (t.status === 'pending') s.pendingCount++
    })

    const list = Array.from(map.values())
    list.forEach(s => {
      s.issueRate = s.totalCalls > 0 ? Math.round((s.issueCalls / s.totalCalls) * 100) : 0
      const taskTotal = s.rectifyCount + s.pendingCount + s.appealCount
      s.appealRate = taskTotal > 0 ? Math.round((s.appealCount / taskTotal) * 100) : 0
      s.rectifyPassRate = s.rectifyCount > 0 ? Math.round((s.rectifyPassCount / s.rectifyCount) * 100) : 0
    })

    list.sort((a, b) => b.issueCalls - a.issueCalls)
    return list
  }, [filteredCalls, filteredTasks])

  const handleDatePick = (field: 'start' | 'end') => {
    Taro.showActionSheet({
      itemList: availableDates
    }).then(res => {
      const d = availableDates[res.tapIndex]
      if (field === 'start') {
        setStartDate(d)
        if (d > endDate) setEndDate(d)
      } else {
        setEndDate(d)
        if (d < startDate) setStartDate(d)
      }
    }).catch(() => {})
  }

  const handleProjectClick = (projectName: string) => {
    Taro.showActionSheet({
      itemList: ['查看对应任务', '查看对应通话']
    }).then(res => {
      if (res.tapIndex === 0) {
        Taro.switchTab({ url: '/pages/tasks/index' })
      } else if (res.tapIndex === 1) {
        Taro.switchTab({ url: '/pages/calls/index' })
      }
    }).catch(() => {})
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>📊 质检报表</Text>
        <Text className={styles.pageSubtitle}>按项目维度分析质检表现</Text>

        <View className={styles.filterRow}>
          <View className={styles.filterItem} onClick={() => handleDatePick('start')}>
            <Text className={styles.filterLabel}>开始日期</Text>
            <Text className={styles.filterValue}>{startDate} ▼</Text>
          </View>
          <View className={styles.filterItem} onClick={() => handleDatePick('end')}>
            <Text className={styles.filterLabel}>结束日期</Text>
            <Text className={styles.filterValue}>{endDate} ▼</Text>
          </View>
        </View>

        <View className={styles.summaryCard}>
          <Text className={styles.summaryTitle}>📈 总体概览</Text>
          <View className={styles.summaryGrid}>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryNum}>{overall.totalCalls}</Text>
              <Text className={styles.summaryLabel}>总通话</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryNum}>{overall.issueCalls}</Text>
              <Text className={styles.summaryLabel}>有问题</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryNum}>{overall.issueRate}%</Text>
              <Text className={styles.summaryLabel}>问题率</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryNum}>{overall.completed}</Text>
              <Text className={styles.summaryLabel}>已闭环</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>🏢 项目维度明细</Text>
          <Text className={styles.sectionHint}>共 {projectStats.length} 个项目</Text>
        </View>

        {projectStats.length > 0 ? (
          <View className={styles.projectList}>
            {projectStats.map(p => (
              <View key={p.projectName} className={styles.projectCard} onClick={() => handleProjectClick(p.projectName)}>
                <View className={styles.projectHeader}>
                  <Text className={styles.projectName}>{p.projectName}</Text>
                  <Text className={styles.projectArrow}>›</Text>
                </View>

                <View className={styles.metricsRow}>
                  <View className={styles.metricChip}>
                    <Text className={styles.metricChipNum}>{p.totalCalls}</Text>
                    <Text className={styles.metricChipLabel}>通话量</Text>
                  </View>
                  <View className={styles.metricChip}>
                    <Text className={`${styles.metricChipNum} ${styles.danger}`}>{p.issueCalls}</Text>
                    <Text className={styles.metricChipLabel}>问题数</Text>
                  </View>
                  <View className={styles.metricChip}>
                    <Text className={`${styles.metricChipNum} ${styles.warning}`}>{p.issueRate}%</Text>
                    <Text className={styles.metricChipLabel}>问题率</Text>
                  </View>
                </View>

                <View className={styles.metricsRow} style={{ marginTop: 12 }}>
                  <View className={styles.metricChip}>
                    <Text className={`${styles.metricChipNum} ${styles.purple}`}>{p.appealCount}</Text>
                    <Text className={styles.metricChipLabel}>申诉数</Text>
                  </View>
                  <View className={styles.metricChip}>
                    <Text className={`${styles.metricChipNum} ${styles.primary}`}>{p.rectifyCount}</Text>
                    <Text className={styles.metricChipLabel}>整改数</Text>
                  </View>
                  <View className={styles.metricChip}>
                    <Text className={`${styles.metricChipNum} ${styles.success}`}>{p.rectifyPassRate}%</Text>
                    <Text className={styles.metricChipLabel}>整改通过率</Text>
                  </View>
                </View>

                <View className={styles.projectProgress}>
                  <View
                    className={styles.projectProgressBar}
                    style={{ width: `${p.rectifyPassRate}%` }}
                  />
                </View>
                <View className={styles.projectProgressLabel}>
                  <Text>整改进度</Text>
                  <Text>{p.rectifyPassCount} / {p.rectifyCount} 通过</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState text='当前日期范围内暂无数据' icon='📊' />
        )}
      </View>
    </ScrollView>
  )
}

export default ReportPage
