import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { RectificationTask, TASK_STATUS_MAP, VIOLATION_CATEGORY_MAP, Violation } from '@/types'
import styles from './index.module.scss'

interface TaskCardProps {
  task: RectificationTask
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const status = TASK_STATUS_MAP[task.status]
  const violations: Violation[] = task.callRecord.violations.filter(v => task.violationIds.includes(v.id))

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/rectification/index?id=${task.id}`
    })
  }

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <Text className={styles.taskTitle}>{task.callRecord.agentName} - {task.callRecord.projectName}</Text>
        <View className={styles.statusBadge} style={{ background: status.bg, color: status.color }}>
          {status.label}
        </View>
      </View>

      <View className={styles.cardBody}>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>处理对象</Text>
          <Text className={styles.infoValue}>{task.assignedTo}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>分配时间</Text>
          <Text className={styles.infoValue}>{task.assignedAt}</Text>
        </View>
        {violations.length > 0 && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>问题类型</Text>
            <View className={styles.violationTags}>
              {violations.map(v => (
                <View
                  key={v.id}
                  className={styles.violationTag}
                  style={{ background: VIOLATION_CATEGORY_MAP[v.category].color }}
                >
                  {VIOLATION_CATEGORY_MAP[v.category].label}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View className={styles.cardFooter}>
        <Text className={styles.timeInfo}>通话时间：{task.callRecord.date}</Text>
        <Button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); handleClick() }}>
          处理
        </Button>
      </View>
    </View>
  )
}

export default TaskCard
