import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { mockCalls } from '@/data/calls'
import {
  CallRecord, TranscriptLine, Violation, ViolationCategory, EMOTION_MAP, VIOLATION_CATEGORY_MAP } from '@/types'
import { formatDuration, generateId, getTodayDate } from '@/utils'
import TranscriptItem from '@/components/TranscriptItem'
import TagSelector from '@/components/TagSelector'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

const CallDetailPage: React.FC = () => {
  const router = useRouter()
  const callId = router.params.id || 'c1'

  const [call, setCall] = useState<CallRecord | null>(null)
  const [selectorVisible, setSelectorVisible] = useState(false)
  const [selectedLine, setSelectedLine] = useState<TranscriptLine | null>(null)

  useEffect(() => {
    const found = mockCalls.find(c => c.id === callId) || mockCalls[0]
    setCall(found)
    console.log('[CallDetail] Loaded call:', found.id, 'violations:', found.violations.length)
  }, [callId])

  const violationMap = useMemo(() => {
    const map = new Map<string, Violation>()
    call?.violations.forEach(v => {
      map.set(v.transcriptLineId, v)
    })
    return map
  }, [call])

  const handleLineLongPress = (line: TranscriptLine) => {
    if (violationMap.has(line.id)) {
      Taro.showActionSheet({
        itemList: ['取消标记', '查看详情']
      }).then(res => {
        if (res.tapIndex === 0) {
          handleRemoveViolation(line.id)
        }
      }).catch(() => {})
      return
    }
    setSelectedLine(line)
    setSelectorVisible(true)
  }

  const handleRemoveViolation = (lineId: string) => {
    if (!call) return
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消此问题标记吗？',
      success: (res) => {
        if (res.confirm) {
          const newViolations = call.violations.filter(v => v.transcriptLineId !== lineId)
          setCall({ ...call, violations: newViolations })
          Taro.showToast({ title: '已取消', icon: 'success' })
        }
      }
    })
  }

  const handleMarkViolation = (category: ViolationCategory, description: string) => {
    if (!call || !selectedLine) return
    const now = new Date()
    const timeStr = `${getTodayDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const newViolation: Violation = {
      id: generateId(),
      transcriptLineId: selectedLine.id,
      category,
      description: description || VIOLATION_CATEGORY_MAP[category].label,
      createdAt: timeStr,
      createdBy: '质检-当前用户'
    }
    setCall({
      ...call,
      violations: [...call.violations, newViolation],
      status: 'marked'
    })
    Taro.showToast({ title: '标记成功', icon: 'success' })
    console.log('[CallDetail] Marked violation:', newViolation)
  }

  const handleSubmitTask = () => {
    if (!call) return
    if (call.violations.length === 0) {
      Taro.showModal({
        title: '提交任务',
        content: '当前未标记任何问题，是否确认标记为"无异常"？',
        success: (res) => {
          if (res.confirm) {
            Taro.showToast({ title: '已标记完成', icon: 'success' })
            setTimeout(() => Taro.navigateBack(), 800)
          }
        }
      })
      return
    } else {
      Taro.showModal({
        title: '提交整改任务',
        content: `共标记 ${call.violations.length} 处问题，是否分配给供应商处理？`,
        success: (res) => {
          if (res.confirm) {
            Taro.showToast({ title: '已分配任务', icon: 'success' })
            setTimeout(() => Taro.navigateBack(), 800)
          }
        }
      })
    }
  }

  if (!call) return null
  const emotion = EMOTION_MAP[call.customerEmotion]

  return (
    <>
      <ScrollView className={styles.page} scrollY>
        <View className={styles.summaryCard}>
          <View className={styles.summaryHeader}>
            <View className={styles.agentInfo}>
              <View className={styles.avatar}>
                <Text>{call.agentName.charAt(0)}</Text>
              </View>
              <View>
                <Text className={styles.agentName}>{call.agentName}</Text>
                <Text className={styles.supplierTag}>{call.supplierName}</Text>
              </View>
            </View>
            <View className={styles.emotionBadge} style={{ background: emotion.bg, color: emotion.color }}>
              {emotion.label}情绪
            </View>
          </View>

          <View className={styles.summaryInfo}>
            <View className={styles.infoChip}>
              <Text className={styles.infoLabel}>项目</Text>
              <Text className={styles.infoValue}>{call.projectName}</Text>
            </View>
            <View className={styles.infoChip}>
              <Text className={styles.infoLabel}>日期</Text>
              <Text className={styles.infoValue}>{call.date}</Text>
            </View>
            <View className={styles.infoChip}>
              <Text className={styles.infoLabel}>开始时间</Text>
              <Text className={styles.infoValue}>{call.startTime}</Text>
            </View>
            <View className={styles.infoChip}>
              <Text className={styles.infoLabel}>通话时长</Text>
              <Text className={styles.infoValue}>{formatDuration(call.duration)}</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.titleIcon}>📝</Text>
              通话转写
              <View className={styles.markCount}>已标记 {call.violations.length}</View>
            </Text>
            <Text className={styles.tipText}>长按可标记问题</Text>
          </View>
          <View className={styles.transcriptWrap}>
            {call.transcript.map(line => (
              <TranscriptItem
                key={line.id}
                line={line}
                violation={violationMap.get(line.id)}
                showLongPress
                onLongPress={handleLineLongPress}
              />
            ))}
          </View>
        </View>

        {call.violations.length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.titleIcon}>⚠️</Text>
                问题标记
                <View className={styles.markCount}>{call.violations.length} 处</View>
              </Text>
            </View>
            <View className={styles.violationList}>
              {call.violations.map(v => {
                const line = call.transcript.find(l => l.id === v.transcriptLineId)
                const catInfo = VIOLATION_CATEGORY_MAP[v.category]
                return (
                  <View key={v.id} className={styles.violationItem}>
                    <View className={styles.violationHeader}>
                      <View
                        className={styles.violationCategory}
                        style={{ background: catInfo.color }}
                      >
                        {catInfo.label}
                      </View>
                      <Text className={styles.violationTime}>{v.createdAt}</Text>
                    </View>
                    {line && (
                      <Text className={styles.violationContent}>
                        "{line.content}"
                      </Text>
                    )}
                    <Text className={styles.violationDesc}>
                      📌 {v.description}
                    </Text>
                    <Text
                      className={styles.removeBtn}
                      onClick={() => handleRemoveViolation(v.transcriptLineId)}
                    >
                      取消标记
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {call.violations.length === 0 && (
          <View className={styles.section}>
            <EmptyState text='暂无问题标记，可在上方转写中长按标记问题' icon='✅' />
          </View>
        )}
      </ScrollView>

      <View className={styles.bottomBar}>
        <Button className={styles.btnSecondary} onClick={() => Taro.navigateBack()}>
          返回
        </Button>
        <Button className={styles.btnPrimary} onClick={handleSubmitTask}>
          {call.violations.length > 0 ? '分配整改任务' : '标记为无异常'}
        </Button>
      </View>

      <TagSelector
        visible={selectorVisible}
        line={selectedLine}
        onClose={() => setSelectorVisible(false)}
        onConfirm={handleMarkViolation}
      />
    </>
  )
}

export default CallDetailPage
