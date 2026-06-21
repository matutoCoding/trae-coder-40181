import React, { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView, Textarea } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { mockTasks } from '@/data/tasks'
import {
  RectificationTask, TASK_STATUS_MAP, VIOLATION_CATEGORY_MAP,
  TaskStatus, UserRole, Violation
} from '@/types'
import { getTodayDate } from '@/utils'
import TranscriptItem from '@/components/TranscriptItem'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

type ActionType = 'appeal' | 'admit' | null

const RectificationPage: React.FC = () => {
  const router = useRouter()
  const taskId = router.params.id || 't1'

  const [task, setTask] = useState<RectificationTask | null>(null)
  const [currentRole, setCurrentRole] = useState<UserRole>('supplier')
  const [actionType, setActionType] = useState<ActionType>(null)
  const [appealReason, setAppealReason] = useState('')
  const [rectificationAction, setRectificationAction] = useState('')
  const [confirmRemark, setConfirmRemark] = useState('')

  useEffect(() => {
    const found = mockTasks.find(t => t.id === taskId) || mockTasks[0]
    setTask(found)
    console.log('[Rectification] Loaded task:', found.id, 'status:', found.status)
    if (found.status === 'pending' || found.status === 'appealing') {
      setCurrentRole('supplier')
    } else {
      setCurrentRole('partyA')
    }
  }, [taskId])

  if (!task) return null

  const statusInfo = TASK_STATUS_MAP[task.status as TaskStatus]
  const violations: Violation[] = task.callRecord.violations.filter(v => task.violationIds.includes(v.id))
  const violationMap = new Map(violations.map(v => [v.transcriptLineId, v]))

  const canEdit = task.status === 'pending' || (task.status === 'appealing' && currentRole === 'partyA')
  const canConfirm = task.status === 'appealing' || task.status === 'rectifying'

  const getTimeStr = () => {
    const now = new Date()
    return `${getTodayDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }

  const handleRoleSwitch = () => {
    Taro.showActionSheet({
      itemList: ['供应商主管视角', '甲方质检员视角']
    }).then(res => {
      setCurrentRole(res.tapIndex === 0 ? 'supplier' : 'partyA')
    }).catch(() => {})
  }

  const handleSubmit = () => {
    if (actionType === 'appeal') {
      if (!appealReason.trim()) {
        Taro.showToast({ title: '请填写申诉理由', icon: 'none' })
        return
      }
      setTask({
        ...task,
        status: 'appealing',
        appealReason: appealReason,
        appealAt: getTimeStr()
      })
      Taro.showToast({ title: '申诉已提交', icon: 'success' })
      console.log('[Rectification] Submitted appeal:', appealReason)
      setActionType(null)
    } else if (actionType === 'admit') {
      if (!rectificationAction.trim()) {
        Taro.showToast({ title: '请填写整改动作', icon: 'none' })
        return
      }
      setTask({
        ...task,
        status: 'rectifying',
        admitted: true,
        rectificationAction,
        rectificationAt: getTimeStr()
      })
      Taro.showToast({ title: '整改已提交', icon: 'success' })
      console.log('[Rectification] Submitted rectification:', rectificationAction)
      setActionType(null)
    }
  }

  const handleConfirm = (accepted: boolean) => {
    const title = accepted ? '确认通过' : '确认驳回'
    Taro.showModal({
      title,
      content: accepted ? '确认该处理结果通过？' : '确认驳回该申诉/整改？需要供应商重新处理。',
      success: (res) => {
        if (res.confirm) {
          setTask({
            ...task,
            status: 'confirmed',
            confirmedBy: '质检-当前用户',
            confirmedAt: getTimeStr(),
            confirmResult: accepted ? 'accepted' : 'rejected',
            confirmRemark: confirmRemark || (accepted ? '处理结果符合要求' : '整改力度不足，请重新处理')
          })
          Taro.showToast({ title: accepted ? '已通过' : '已驳回', icon: 'success' })
          console.log('[Rectification] Confirmed:', accepted, 'remark:', confirmRemark)
        }
      }
    })
  }

  return (
    <>
      <ScrollView className={styles.page} scrollY>
        <View className={styles.headerCard} onClick={handleRoleSwitch}>
          <View className={styles.taskStatus} style={{ background: statusInfo.bg, color: statusInfo.color }}>
            {statusInfo.label} · {currentRole === 'supplier' ? '供应商视角' : '甲方视角'} ⚙
          </View>
          <Text className={styles.taskTitle}>{task.callRecord.agentName} - {task.callRecord.projectName}</Text>
          <Text className={styles.taskMeta}>
            处理对象：{task.assignedTo}{'\n'}
            分配时间：{task.assignedAt}{'\n'}
            通话时间：{task.callRecord.date} {task.callRecord.startTime}
          </Text>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>⚠️ 问题列表（共 {violations.length} 处）</Text>
          </View>
          <View className={styles.card}>
            {violations.length > 0 ? (
              violations.map(v => {
                const line = task.callRecord.transcript.find(l => l.id === v.transcriptLineId)
                const catInfo = VIOLATION_CATEGORY_MAP[v.category]
                return (
                  <View key={v.id} className={styles.violationItem}>
                    <View className={styles.violationHeader}>
                      <View className={styles.catTag} style={{ background: catInfo.color }}>
                        {catInfo.label}
                      </View>
                      <Text className={styles.violationTime}>{v.createdAt}</Text>
                    </View>
                    {line && (
                      <View className={styles.violationQuote}>"{line.content}"</View>
                    )}
                    <Text className={styles.violationDesc}>📌 {v.description}</Text>
                  </View>
                )
              })
            ) : (
              <EmptyState text='暂无问题标记' icon='✅' />
            )}
          </View>
        </View>

        {(task.appealReason || task.rectificationAction) && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>📋 处理记录</Text>
            </View>
            <View className={styles.card}>
              {task.appealReason && (
                <View className={styles.infoBlock}>
                  <Text className={styles.blockLabel}>申诉理由 {task.appealAt ? `（${task.appealAt}）` : ''}</Text>
                  <View className={styles.blockContent}>{task.appealReason}</View>
                </View>
              )}
              {task.admitted && task.rectificationAction && (
                <View className={styles.infoBlock}>
                  <Text className={styles.blockLabel}>整改动作 {task.rectificationAt ? `（${task.rectificationAt}）` : ''}</Text>
                  <View className={styles.blockContent}>{task.rectificationAction}</View>
                </View>
              )}
              {task.confirmedBy && (
                <View className={styles.infoBlock}>
                  <Text className={styles.blockLabel}>
                    甲方确认结果 {task.confirmedAt ? `（${task.confirmedAt} · ${task.confirmedBy}）` : ''}
                  </Text>
                  <View
                    className={classnames(styles.resultBlock, {
                      [styles.resultAccepted]: task.confirmResult === 'accepted',
                      [styles.resultRejected]: task.confirmResult === 'rejected'
                    })}
                  >
                    <View
                      className={styles.resultTag}
                      style={{
                        background: task.confirmResult === 'accepted' ? '#10B981' : '#EF4444',
                        color: '#fff'
                      }}
                    >
                      {task.confirmResult === 'accepted' ? '✓ 处理通过' : '✗ 已驳回'}
                    </View>
                    {task.confirmRemark && (
                      <Text className={styles.resultRemark}>{task.confirmRemark}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {currentRole === 'supplier' && canEdit && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>✏️ 我的处理</Text>
            </View>
            <View className={styles.card}>
              {task.status === 'pending' && (
                <View className={styles.actionSwitch}>
                  <View
                    className={classnames(styles.switchBtn, { [styles.activeAppeal]: actionType === 'appeal' })}
                    onClick={() => setActionType('appeal')}
                  >
                    发起申诉
                  </View>
                  <View
                    className={classnames(styles.switchBtn, { [styles.activeAdmit]: actionType === 'admit' })}
                    onClick={() => setActionType('admit')}
                  >
                    承认并整改
                  </View>
                </View>
              )}

              {(actionType === 'appeal' || task.status === 'appealing') && (
                <View className={styles.inputBlock}>
                  <Text className={styles.inputLabel}>申诉理由 *</Text>
                  <Textarea
                    className={styles.textarea}
                    placeholder='请详细说明申诉理由，如：通话背景说明、坐席当时的实际情况等...'
                    value={appealReason || task.appealReason || ''}
                    onInput={(e) => setAppealReason(e.detail.value)}
                    maxlength={500}
                    disabled={task.status === 'appealing'}
                  />
                </View>
              )}

              {actionType === 'admit' && (
                <View className={styles.inputBlock}>
                  <Text className={styles.inputLabel}>整改动作 *</Text>
                  <Textarea
                    className={styles.textarea}
                    placeholder='请填写具体的整改措施，如：培训计划、人员辅导、制度调整等...'
                    value={rectificationAction}
                    onInput={(e) => setRectificationAction(e.detail.value)}
                    maxlength={500}
                  />
                </View>
              )}

              {(task.status === 'appealing' || task.status === 'rectifying') && (
                <View className={styles.blockContent} style={{ color: '#6B7280' }}>
                  {task.status === 'appealing' ? '申诉已提交，等待甲方审核确认...' : '整改已提交，等待甲方审核确认...'}
                </View>
              )}
            </View>
          </View>
        )}

        {currentRole === 'partyA' && canConfirm && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>✅ 甲方确认</Text>
            </View>
            <View className={styles.card}>
              <View className={styles.inputBlock}>
                <Text className={styles.inputLabel}>确认备注（选填）</Text>
                <Textarea
                  className={styles.textarea}
                  placeholder='请输入确认意见...'
                  value={confirmRemark}
                  onInput={(e) => setConfirmRemark(e.detail.value)}
                  maxlength={300}
                />
              </View>
              <View className={styles.confirmActions}>
                <View className={classnames(styles.confirmBtn, styles.reject)} onClick={() => handleConfirm(false)}>
                  驳回整改
                </View>
                <View className={classnames(styles.confirmBtn, styles.accept)} onClick={() => handleConfirm(true)}>
                  通过确认
                </View>
              </View>
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📞 完整转写</Text>
          </View>
          <View className={styles.card}>
            {task.callRecord.transcript.map(line => (
              <TranscriptItem
                key={line.id}
                line={line}
                violation={violationMap.get(line.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <Button className={styles.btnBack} onClick={() => Taro.navigateBack()}>
          返回
        </Button>
        {currentRole === 'supplier' && canEdit && actionType && task.status === 'pending' ? (
          <Button
            className={classnames(styles.btnSubmit, {
              [styles.disabled]: (actionType === 'appeal' && !appealReason.trim()) ||
                (actionType === 'admit' && !rectificationAction.trim())
            })}
            onClick={handleSubmit}
          >
            {actionType === 'appeal' ? '提交申诉' : '提交整改'}
          </Button>
        ) : (
          <Button
            className={classnames(styles.btnSubmit, styles.disabled)}
            disabled
          >
            {task.status === 'confirmed' || task.status === 'completed' ? '任务已完成' :
              currentRole === 'partyA' ? '请在上方操作确认' : '等待对方处理'}
          </Button>
        )}
      </View>
    </>
  )
}

export default RectificationPage
