import React, { useState } from 'react'
import { View, Text, Button, ScrollView, Textarea, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import {
  TASK_STATUS_MAP, VIOLATION_CATEGORY_MAP,
  TaskStatus, UserRole, Violation, Attachment
} from '@/types'
import { generateId, getTodayDate } from '@/utils'
import { useQCStore } from '@/store'
import TranscriptItem from '@/components/TranscriptItem'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

type ActionType = 'appeal' | 'admit' | null

const PICSUM_IMAGES = [
  'https://picsum.photos/id/180/600/400',
  'https://picsum.photos/id/48/600/400',
  'https://picsum.photos/id/42/600/400',
  'https://picsum.photos/id/225/600/400'
]

const getTimeStr = () => {
  const now = new Date()
  return `${getTodayDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const RectificationPage: React.FC = () => {
  const router = useRouter()
  const taskId = router.params.id || 't1'

  const task = useQCStore(state => state.tasks.find(t => t.id === taskId) || state.tasks[0])
  const submitAppeal = useQCStore(state => state.submitAppeal)
  const submitRectification = useQCStore(state => state.submitRectification)
  const confirmTask = useQCStore(state => state.confirmTask)
  const updateTask = useQCStore(state => state.updateTask)

  const [currentRole, setCurrentRole] = useState<UserRole>(
    task?.status === 'confirmed' || task?.status === 'completed' ? 'partyA' : 'supplier'
  )
  const [actionType, setActionType] = useState<ActionType>(null)
  const [appealReason, setAppealReason] = useState(task?.appealReason || '')
  const [appealAttachments, setAppealAttachments] = useState<Attachment[]>(task?.appealAttachments || [])
  const [rectificationAction, setRectificationAction] = useState(task?.rectificationAction || '')
  const [rectificationAttachments, setRectificationAttachments] = useState<Attachment[]>(task?.rectificationAttachments || [])
  const [confirmRemark, setConfirmRemark] = useState(task?.confirmRemark || '')

  if (!task) return null

  const statusInfo = TASK_STATUS_MAP[task.status as TaskStatus]
  const violations: Violation[] = task.callRecord.violations.filter(v => task.violationIds.includes(v.id))
  const violationMap = new Map(violations.map(v => [v.transcriptLineId, v]))

  const isRejected = task.status === 'rejected'
  const isPending = task.status === 'pending'
  const isAppealing = task.status === 'appealing'
  const isRectifying = task.status === 'rectifying'
  const isConfirmed = task.status === 'confirmed' || task.status === 'completed'
  const canEditSupplier = currentRole === 'supplier' && (isPending || isRejected)
  const canConfirmPartyA = currentRole === 'partyA' && (isAppealing || isRectifying)

  const handleRoleSwitch = () => {
    Taro.showActionSheet({
      itemList: ['供应商主管视角', '甲方质检员视角']
    }).then(res => {
      setCurrentRole(res.tapIndex === 0 ? 'supplier' : 'partyA')
    }).catch(() => {})
  }

  const handleActionClick = (type: ActionType) => {
    setActionType(type)
    if (type === 'appeal') {
      setAppealReason(task.appealReason || '')
      setAppealAttachments(task.appealAttachments || [])
    } else if (type === 'admit') {
      setRectificationAction(task.rectificationAction || '')
      setRectificationAttachments(task.rectificationAttachments || [])
    }
  }

  const addMockAttachment = (field: 'appeal' | 'rectification', type: 'image' | 'text') => {
    const baseAttachments = field === 'appeal' ? appealAttachments : rectificationAttachments
    const setAttachments = field === 'appeal' ? setAppealAttachments : setRectificationAttachments

    if (type === 'image') {
      const randomUrl = PICSUM_IMAGES[Math.floor(Math.random() * PICSUM_IMAGES.length)]
      const newAtt: Attachment = {
        id: generateId(),
        type: 'image',
        url: randomUrl,
        name: `凭证图片_${baseAttachments.length + 1}.jpg`,
        createdAt: getTimeStr()
      }
      setAttachments([...baseAttachments, newAtt])
      Taro.showToast({ title: '图片已添加', icon: 'success' })
    } else {
      Taro.showModal({
        title: '添加文字说明',
        editable: true,
        placeholderText: '请输入说明内容...',
        success: (res) => {
          if (res.confirm && res.content?.trim()) {
            const newAtt: Attachment = {
              id: generateId(),
              type: 'text',
              content: res.content.trim(),
              name: `文字说明_${baseAttachments.length + 1}`,
              createdAt: getTimeStr()
            }
            setAttachments([...baseAttachments, newAtt])
            Taro.showToast({ title: '说明已添加', icon: 'success' })
          }
        }
      })
    }
  }

  const removeAttachment = (field: 'appeal' | 'rectification', attId: string) => {
    const baseAttachments = field === 'appeal' ? appealAttachments : rectificationAttachments
    const setAttachments = field === 'appeal' ? setAppealAttachments : setRectificationAttachments
    setAttachments(baseAttachments.filter(a => a.id !== attId))
  }

  const handleAttachmentClick = (att: Attachment) => {
    if (att.type === 'image' && att.url) {
      Taro.previewImage({
        urls: [att.url],
        current: att.url
      })
    } else if (att.type === 'text') {
      Taro.showModal({
        title: att.name,
        content: att.content || '',
        showCancel: false
      })
    }
  }

  const handleSubmit = () => {
    if (actionType === 'appeal') {
      if (!appealReason.trim()) {
        Taro.showToast({ title: '请填写申诉理由', icon: 'none' })
        return
      }
      submitAppeal(task.id, appealReason, appealAttachments)
      Taro.showToast({ title: isRejected ? '重新申诉已提交' : '申诉已提交', icon: 'success' })
      setActionType(null)
    } else if (actionType === 'admit') {
      if (!rectificationAction.trim()) {
        Taro.showToast({ title: '请填写整改动作', icon: 'none' })
        return
      }
      submitRectification(task.id, rectificationAction, rectificationAttachments)
      Taro.showToast({ title: isRejected ? '整改已重新提交' : '整改已提交', icon: 'success' })
      setActionType(null)
    }
  }

  const handleConfirm = (accepted: boolean) => {
    if (!accepted && !confirmRemark.trim()) {
      Taro.showModal({
        title: '驳回提醒',
        content: '请在上方填写驳回理由，以便供应商了解问题所在。',
        editable: true,
        placeholderText: '请输入驳回理由...',
        success: (res) => {
          if (res.confirm && res.content?.trim()) {
            setConfirmRemark(res.content)
            doConfirm(false, res.content)
          } else if (res.confirm) {
            Taro.showToast({ title: '请填写驳回理由', icon: 'none' })
          }
        }
      })
      return
    }
    doConfirm(accepted, confirmRemark || (accepted ? '处理结果符合要求' : ''))
  }

  const doConfirm = (accepted: boolean, remark: string) => {
    const title = accepted ? '确认通过' : '确认驳回'
    Taro.showModal({
      title,
      content: accepted
        ? '确认该处理结果通过？'
        : '确认驳回？驳回后供应商可继续补充整改或申诉。',
      success: (res) => {
        if (res.confirm) {
          confirmTask(task.id, accepted, remark, '质检-当前用户')
          Taro.showToast({ title: accepted ? '已通过' : '已驳回', icon: 'success' })
        }
      }
    })
  }

  const renderAttachments = (attachments: Attachment[], editable: boolean, field: 'appeal' | 'rectification') => {
    if (!attachments?.length && !editable) return null
    return (
      <View>
        {attachments?.length > 0 && (
          <View className={styles.attachmentList}>
            {attachments.map(att => (
              <View
                key={att.id}
                className={styles.attachmentItem}
                onClick={() => {
                  if (editable) {
                    Taro.showActionSheet({
                      itemList: ['查看内容', '删除附件']
                    }).then(r => {
                      if (r.tapIndex === 0) handleAttachmentClick(att)
                      if (r.tapIndex === 1) removeAttachment(field, att.id)
                    }).catch(() => {})
                  } else {
                    handleAttachmentClick(att)
                  }
                }}
              >
                <Text className={styles.attachmentIcon}>{att.type === 'image' ? '🖼️' : '📝'}</Text>
                <Text className={styles.attachmentName}>{att.name}</Text>
              </View>
            ))}
          </View>
        )}
        {attachments?.filter(a => a.type === 'image')?.map(att => att.url ? (
          <View key={`img-${att.id}`} className={styles.attachmentImage}>
            <Image src={att.url} mode='widthFix' onClick={() => Taro.previewImage({ urls: [att.url!] })} />
          </View>
        ) : null)}
      </View>
    )
  }

  const getSubmitBtnText = () => {
    if (isConfirmed) return '任务已完成'
    if (currentRole === 'partyA') return '请在上方操作确认'
    if (!canEditSupplier) return '等待对方处理'
    if (!actionType) return '请先选择处理方式'
    if (actionType === 'appeal') return isRejected ? '重新提交申诉' : '提交申诉'
    if (actionType === 'admit') return isRejected ? '重新提交整改' : '提交整改'
    return '提交'
  }

  const isSubmitDisabled = () => {
    if (isConfirmed || currentRole === 'partyA' || !canEditSupplier || !actionType) return true
    if (actionType === 'appeal' && !appealReason.trim()) return true
    if (actionType === 'admit' && !rectificationAction.trim()) return true
    return false
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
          {task.resubmitCount && task.resubmitCount > 0 && (
            <View className={styles.resubmitBadge}>⚠️ 已提交 {task.resubmitCount} 次</View>
          )}
        </View>

        {isRejected && task.confirmRemark && (
          <View className={styles.section}>
            <View className={styles.card}>
              <View className={styles.rejectionAlert}>
                <Text className={styles.rejectionTitle}>❗ 甲方驳回提醒</Text>
                <Text className={styles.rejectionReason}>{task.confirmRemark}</Text>
              </View>
              {task.rejectionHistory && task.rejectionHistory.length > 0 && (
                <View>
                  <Text className={styles.inputLabel} style={{ marginBottom: '$spacing-sm' }}>
                    历史驳回记录
                  </Text>
                  {task.rejectionHistory.map((rh, idx) => (
                    <View key={idx} className={styles.rejectionHistoryItem}>
                      <Text className={styles.rejectionHistoryTime}>
                        {rh.rejectedAt} · {rh.rejectedBy}
                      </Text>
                      <Text className={styles.rejectionHistoryReason}>{rh.reason}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

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

        {(task.appealReason || task.appealAttachments?.length || task.admitted || task.confirmedBy) && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>📋 处理记录</Text>
            </View>
            <View className={styles.card}>
              {(task.appealReason || task.appealAttachments?.length) && (
                <View className={styles.infoBlock}>
                  <View className={styles.blockLabel}>
                    <Text>申诉理由</Text>
                    {task.appealAt && <Text className={styles.blockTime}>{task.appealAt}</Text>}
                  </View>
                  {task.appealReason && <View className={styles.blockContent}>{task.appealReason}</View>}
                  {renderAttachments(task.appealAttachments || [], false, 'appeal')}
                </View>
              )}
              {task.admitted && task.rectificationAction && (
                <View className={styles.infoBlock}>
                  <View className={styles.blockLabel}>
                    <Text>整改动作</Text>
                    {task.rectificationAt && <Text className={styles.blockTime}>{task.rectificationAt}</Text>}
                  </View>
                  <View className={styles.blockContent}>{task.rectificationAction}</View>
                  {renderAttachments(task.rectificationAttachments || [], false, 'rectification')}
                </View>
              )}
              {task.confirmedBy && (
                <View className={styles.infoBlock}>
                  <View className={styles.blockLabel}>
                    <Text>甲方确认结果</Text>
                    {task.confirmedAt && <Text className={styles.blockTime}>{task.confirmedBy} · {task.confirmedAt}</Text>}
                  </View>
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
                      {task.confirmResult === 'accepted' ? '✓ 处理通过' : '✗ 已驳回待补充'}
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

        {canEditSupplier && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                ✏️ {isRejected ? '补充处理（驳回后）' : '我的处理'}
              </Text>
            </View>
            <View className={styles.card}>
              {(isPending || isRejected) && (
                <View className={styles.actionSwitch}>
                  <View
                    className={classnames(styles.switchBtn, { [styles.activeAppeal]: actionType === 'appeal' })}
                    onClick={() => handleActionClick('appeal')}
                  >
                    发起申诉
                    <View className={styles.switchHint}>
                      {isRejected ? '重新申诉质疑质检结论' : '认为质检结论存在偏差'}
                    </View>
                  </View>
                  <View
                    className={classnames(styles.switchBtn, { [styles.activeAdmit]: actionType === 'admit' })}
                    onClick={() => handleActionClick('admit')}
                  >
                    承认并整改
                    <View className={styles.switchHint}>
                      {isRejected ? '补充完善整改措施' : '接受问题并提交整改方案'}
                    </View>
                  </View>
                </View>
              )}

              {actionType === 'appeal' && (
                <View>
                  <View className={styles.inputBlock}>
                    <Text className={styles.inputLabel}>申诉理由 *</Text>
                    <Textarea
                      className={styles.textarea}
                      placeholder='请详细说明申诉理由，如：通话背景说明、坐席当时的实际情况、规范条例引用等...'
                      value={appealReason}
                      onInput={(e) => setAppealReason(e.detail.value)}
                      maxlength={800}
                    />
                  </View>
                  <View className={styles.uploadSection}>
                    <Text className={styles.uploadLabel}>附件凭证（点击可查看/删除）</Text>
                    <View className={styles.uploadActions}>
                      <View className={styles.uploadBtn} onClick={() => addMockAttachment('appeal', 'image')}>
                        🖼️ 添加图片凭证
                      </View>
                      <View className={styles.uploadBtn} onClick={() => addMockAttachment('appeal', 'text')}>
                        📝 添加文字说明
                      </View>
                    </View>
                    {renderAttachments(appealAttachments, true, 'appeal')}
                  </View>
                </View>
              )}

              {actionType === 'admit' && (
                <View>
                  <View className={styles.inputBlock}>
                    <Text className={styles.inputLabel}>整改动作 *</Text>
                    <Textarea
                      className={styles.textarea}
                      placeholder={
                        isRejected
                          ? '请根据驳回意见补充完善整改措施，如：具体培训计划、考核方案、监督机制等...'
                          : '请填写具体的整改措施，如：培训计划、人员辅导、制度调整、考核要求等...'
                      }
                      value={rectificationAction}
                      onInput={(e) => setRectificationAction(e.detail.value)}
                      maxlength={800}
                    />
                  </View>
                  <View className={styles.uploadSection}>
                    <Text className={styles.uploadLabel}>证明材料（点击可查看/删除）</Text>
                    <View className={styles.uploadActions}>
                      <View className={styles.uploadBtn} onClick={() => addMockAttachment('rectification', 'image')}>
                        🖼️ 上传培训记录
                      </View>
                      <View className={styles.uploadBtn} onClick={() => addMockAttachment('rectification', 'text')}>
                        📝 添加整改说明
                      </View>
                    </View>
                    {renderAttachments(rectificationAttachments, true, 'rectification')}
                  </View>
                </View>
              )}

              {(isAppealing || isRectifying) && !actionType && (
                <View className={styles.blockContent} style={{ color: '#6B7280' }}>
                  {isAppealing ? '申诉已提交，等待甲方审核确认...' : '整改已提交，等待甲方审核确认...'}
                </View>
              )}
            </View>
          </View>
        )}

        {canConfirmPartyA && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>✅ 甲方确认</Text>
            </View>
            <View className={styles.card}>
              <View className={styles.inputBlock}>
                <Text className={styles.inputLabel}>确认备注（驳回必填）</Text>
                <Textarea
                  className={styles.textarea}
                  placeholder='通过请填写肯定的意见；驳回请说明理由，指导供应商改进方向...'
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
        <Button
          className={classnames(styles.btnSubmit, {
            [styles.disabled]: isSubmitDisabled(),
            [styles.resubmit]: isRejected && !isSubmitDisabled()
          })}
          onClick={handleSubmit}
          disabled={isSubmitDisabled()}
        >
          {getSubmitBtnText()}
        </Button>
      </View>
    </>
  )
}

export default RectificationPage
