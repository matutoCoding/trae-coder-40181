import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { RectificationTask, TASK_STATUS_MAP, VIOLATION_CATEGORY_MAP, Violation } from '@/types'
import styles from './index.module.scss'

interface TaskCardProps {
  task: RectificationTask
  selectable?: boolean
  selected?: boolean
  onSelectChange?: (taskId: string, selected: boolean) => void
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  selectable = false,
  selected = false,
  onSelectChange
}) => {
  const status = TASK_STATUS_MAP[task.status]
  const violations: Violation[] = task.callRecord.violations.filter(v => task.violationIds.includes(v.id))

  const handleClick = () => {
    if (selectable) {
      onSelectChange?.(task.id, !selected)
    } else {
      Taro.navigateTo({
        url: `/pages/rectification/index?id=${task.id}`
      })
    }
  }

  const handleCheckboxClick = (e: any) => {
    e.stopPropagation()
    onSelectChange?.(task.id, !selected)
  }

  const handleActionClick = (e: any) => {
    e.stopPropagation()
    Taro.navigateTo({
      url: `/pages/rectification/index?id=${task.id}`
    })
  }

  return (
    <View
      className={classnames(styles.card, { [styles.selected]: selected && selectable })}
      onClick={handleClick}
    >
      {selectable && (
        <View className={styles.checkboxCol} onClick={handleCheckboxClick}>
          <View className={classnames(styles.checkbox, { [styles.checked]: selected })}>
            {selected && <Text>✓</Text>}
          </View>
        </View>
      )}
      <View className={styles.mainCol}>
        <View className={styles.cardHeader}>
          <Text className={styles.taskTitle}>
            {task.callRecord.agentName} - {task.callRecord.projectName}
          </Text>
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
          {task.resubmitCount && task.resubmitCount > 0 && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>提交次数</Text>
              <Text className={styles.infoValue} style={{ color: '#EF4444' }}>
                已提交 {task.resubmitCount} 次
              </Text>
            </View>
          )}
        </View>

        <View className={styles.cardFooter}>
          <Text className={styles.timeInfo}>通话：{task.callRecord.date}</Text>
          <Button className={styles.actionBtn} onClick={handleActionClick}>
            {selectable ? '查看详情' : '处理'}
          </Button>
        </View>
      </View>
    </View>
  )
}

export default TaskCard
