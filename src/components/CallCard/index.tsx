import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { CallRecord, EMOTION_MAP } from '@/types'
import { formatDuration } from '@/utils'
import styles from './index.module.scss'

interface CallCardProps {
  call: CallRecord
}

const CallCard: React.FC<CallCardProps> = ({ call }) => {
  const emotion = EMOTION_MAP[call.customerEmotion]

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/call-detail/index?id=${call.id}`
    })
  }

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <View className={styles.agentInfo}>
          <View className={styles.agentAvatar}>
            {call.agentName.charAt(0)}
          </View>
          <View className={styles.agentMeta}>
            <Text className={styles.agentName}>{call.agentName}</Text>
            <Text className={styles.supplierTag}>{call.supplierName}</Text>
          </View>
        </View>
        <View className={styles.emotionBadge} style={{ background: emotion.bg, color: emotion.color }}>
          {emotion.label}
        </View>
      </View>

      <View className={styles.cardBody}>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>通话时间</Text>
          <Text className={styles.infoValue}>{call.date} {call.startTime}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>通话时长</Text>
          <Text className={styles.infoValue}>{formatDuration(call.duration)}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>违规情况</Text>
          {call.violations.length > 0 ? (
            <View className={styles.suspectedBox}>
              <Text className={styles.suspectedNum}>{call.violations.length}</Text>
              <Text className={styles.suspectedText}>处问题</Text>
            </View>
          ) : (
            <View className={styles.cleanBox}>无异常</View>
          )}
        </View>
      </View>

      <View className={styles.cardFooter}>
        <View className={styles.projectTag}>
          <Text>{call.projectName}</Text>
        </View>
        <Text className={styles.actionText}>查看详情 →</Text>
      </View>
    </View>
  )
}

export default CallCard
