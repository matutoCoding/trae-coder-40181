import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { TranscriptLine, Violation, VIOLATION_CATEGORY_MAP } from '@/types'
import styles from './index.module.scss'

interface TranscriptItemProps {
  line: TranscriptLine
  violation?: Violation
  showLongPress?: boolean
  onLongPress?: (line: TranscriptLine) => void
}

const TranscriptItem: React.FC<TranscriptItemProps> = ({ line, violation, showLongPress = false, onLongPress }) => {
  const [isPressed, setIsPressed] = useState(false)

  const handleLongPress = () => {
    setIsPressed(true)
    Taro.vibrateShort({ type: 'light' })
    setTimeout(() => setIsPressed(false), 300)
    onLongPress?.(line)
  }

  return (
    <View
      className={classnames(styles.item, {
        [styles.marked]: !!violation,
        [styles.pressed]: isPressed
      })}
      onLongPress={handleLongPress}
    >
      <View className={styles.itemHeader}>
        <View className={styles.speakerBox}>
          <View className={classnames(styles.roleTag, line.role === 'agent' ? styles.agent : styles.customer)}>
            {line.role === 'agent' ? '坐席' : '客户'}
          </View>
          <Text className={styles.speakerName}>{line.speaker}</Text>
        </View>
        <Text className={styles.timestamp}>{line.timestamp}</Text>
      </View>

      <Text className={styles.content}>{line.content}</Text>

      {violation && (
        <View className={styles.markIndicator}>
          <View
            className={styles.markTag}
            style={{ background: VIOLATION_CATEGORY_MAP[violation.category].color }}
          >
            {VIOLATION_CATEGORY_MAP[violation.category].label}
          </View>
        </View>
      )}

      {violation && violation.description && (
        <View className={styles.markDescription}>
          📝 {violation.description}
        </View>
      )}

      {showLongPress && !violation && (
        <Text className={styles.longPressHint}>长按标记问题</Text>
      )}
    </View>
  )
}

export default TranscriptItem
