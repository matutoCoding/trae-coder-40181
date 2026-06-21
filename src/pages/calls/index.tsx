import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { mockProjects } from '@/data/calls'
import { Project } from '@/types'
import { getTodayDate } from '@/utils'
import { useQCStore } from '@/store'
import CallCard from '@/components/CallCard'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

const CallsPage: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const calls = useQCStore(state => state.calls)

  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      const projectMatch = !selectedProject || call.projectId === selectedProject.id
      const dateMatch = call.date === selectedDate
      return projectMatch && dateMatch
    })
  }, [calls, selectedProject, selectedDate])

  const stats = useMemo(() => {
    const total = filteredCalls.length
    const withIssues = filteredCalls.filter(c => c.violations.length > 0).length
    const clean = total - withIssues
    return { total, withIssues, clean }
  }, [filteredCalls])

  const showProjectPicker = () => {
    Taro.showActionSheet({
      itemList: ['全部项目', ...mockProjects.map(p => p.name)]
    }).then(res => {
      if (res.tapIndex === 0) {
        setSelectedProject(null)
      } else {
        setSelectedProject(mockProjects[res.tapIndex - 1])
      }
    }).catch(() => {})
  }

  const showDatePicker = () => {
    const dates: string[] = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    Taro.showActionSheet({
      itemList: dates
    }).then(res => {
      setSelectedDate(dates[res.tapIndex])
    }).catch(() => {})
  }

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      refresherTriggered={false}
      onRefresherRefresh={() => {
        setTimeout(() => Taro.stopPullDownRefresh(), 800)
      }}
    >
      <View className={styles.filterBar}>
        <View className={styles.filterRow}>
          <View className={styles.filterItem} onClick={showProjectPicker}>
            <View>
              <Text className={styles.filterLabel}>所属项目</Text>
              <Text className={styles.filterValue}>{selectedProject ? selectedProject.name : '全部项目'}</Text>
            </View>
            <Text className={styles.filterArrow}>▼</Text>
          </View>
          <View className={styles.filterItem} onClick={showDatePicker}>
            <View>
              <Text className={styles.filterLabel}>质检日期</Text>
              <Text className={styles.filterValue}>{selectedDate}</Text>
            </View>
            <Text className={styles.filterArrow}>▼</Text>
          </View>
        </View>

        <View className={styles.statRow}>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{stats.total}</Text>
            <Text className={styles.statLabel}>今日待检</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={`${styles.statNum} ${styles.warn}`}>{stats.withIssues}</Text>
            <Text className={styles.statLabel}>已标记问题</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={`${styles.statNum} ${styles.ok}`}>{stats.clean}</Text>
            <Text className={styles.statLabel}>无异常</Text>
          </View>
        </View>
      </View>

      <View className={styles.listSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>通话记录</Text>
          <Text className={styles.sectionCount}>共 {filteredCalls.length} 通</Text>
        </View>

        <View className={styles.listWrap}>
          {filteredCalls.length > 0 ? (
            filteredCalls.map(call => (
              <CallCard key={call.id} call={call} />
            ))
          ) : (
            <EmptyState text='当前筛选条件下暂无通话记录' icon='📞' />
          )}
        </View>
      </View>
    </ScrollView>
  )
}

export default CallsPage
