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
  const taskId = router.params.id || router.params.taskId || 't1'

  const task = useQCStore(state => state.tasks.find(t => t.id === taskId) || state.tasks[0])
  const submitAppeal = useQCStore(state => state.submitAppeal)
  const submitRectification = useQCStore(state => state.submitRectification)
  const confirmTask = useQCStore(state => state.confirmTask)
  const updateTask = useQCStore(state => state.updateTask)
  const spotCheckTask = useQCStore(state => state.spotCheckTask)
  const setCallsFilter = useQCStore(state => state.setCallsFilter)

  const [currentRole, setCurrentRole] = useState<UserRole>(
    task?.status === 'confirmed' || task?.status === 'completed' ? 'partyA' : 'supplier'
  )
  const [actionType, setActionType] = useState<ActionType>(null)
  const [appealReason, setAppealReason] = useState(task?.appealReason || '')
  const [appealAttachments, setAppealAttachments] = useState<Attachment[]>(task?.appealAttachments || [])
  const [rectificationAction, setRectificationAction] = useState(task?.rectificationAction || '')
  const [rectificationAttachments, setRectificationAttachments] = useState<Attachment[]>(task?.rectificationAttachments || [])
  const [confirmRemark, setConfirmRemark] = useState(task?.confirmRemark || '')
  const [spotCheckRemark, setSpotCheckRemark] = useState(task?.spotCheckRemark || '')
  const [viewVersion, setViewVersion] = useState<number | null>(null)

  if (!task) return null

  const statusInfo = TASK_STATUS_MAP[task.status as TaskStatus]
  const violations: Violation[] = task.callRecord.violations.filter(v => task.violationIds.includes(v.id))
  const violationMap = new Map(violations.map(v => [v.transcriptLineId, v]))

  const isRejected = task.status === 'rejected'
  const isPending = task.status === 'pending'
  const isAppealing = task.status === 'appealing'
  const isRectifying = task.status === 'rectifying'
  const isConfirmed = task.status === 'confirmed'
  const isCompleted = task.status === 'completed'
  const isClosed = isConfirmed || isCompleted
  const canEditSupplier = currentRole === 'supplier' && (isPending || isRejected)
  const canConfirmPartyA = currentRole === 'partyA' && (isAppealing || isRectifying)
  const canSpotCheck = currentRole === 'partyA' && isConfirmed && !task.spotChecked

  const versions = task.rectificationVersions || []
  const hasMultipleVersions = versions.length > 1

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

  const handleGotoCallList = () => {
    const callDate = task.callRecord.date
    const callProject = task.callRecord.projectName
    setCallsFilter({ date: callDate, project: callProject })
    Taro.switchTab({ url: '/pages/calls/index' })
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

  const handleSpotCheck = (pass: boolean) => {
    if (!pass && !spotCheckRemark.trim()) {
      Taro.showModal({
        title: '抽检驳回',
        content: '请填写抽检驳回理由，以便供应商了解整改方向。',
        editable: true,
        placeholderText: '请输入抽检驳回理由...',
        success: (res) => {
          if (res.confirm && res.content?.trim()) {
            setSpotCheckRemark(res.content)
            doSpotCheck(false, res.content)
          } else if (res.confirm) {
            Taro.showToast({ title: '请填写驳回理由', icon: 'none' })
          }
        }
      })
      return
    }
    doSpotCheck(pass, spotCheckRemark || (pass ? '抽检合格，整改到位' : ''))
  }

  const doSpotCheck = (pass: boolean, remark: string) => {
    Taro.showModal({
      title: pass ? '抽检通过' : '抽检驳回',
      content: pass
        ? '确认抽检通过？任务将进入已完成状态。'
        : '确认抽检驳回？任务将回到待补充状态。',
      success: (res) => {
        if (res.confirm) {
          spotCheckTask(task.id, pass, remark, '质检-当前用户')
          Taro.showToast({ title: pass ? '抽检通过' : '已驳回', icon: 'success' })
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
    if (isCompleted) return '任务已完成归档'
    if (isConfirmed) return '已确认，待抽检'
    if (currentRole === 'partyA') return '请在上方操作确认'
    if (!canEditSupplier) return '等待对方处理'
    if (!actionType) return '请先选择处理方式'
    if (actionType === 'appeal') return isRejected ? '重新提交申诉' : '提交申诉'
    if (actionType === 'admit') return isRejected ? '重新提交整改' : '提交整改'
    return '提交'
  }

  const isSubmitDisabled = () => {
    if (isClosed || currentRole === 'partyA' || !canEditSupplier || !actionType) return true
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
          <View className={styles.infoRow}>
            {task.responsiblePerson && (
              <View className={styles.infoItem}>
                👤 负责人：{task.responsiblePerson}
              </View>
            )}
            {task.expectedCompleteDate && (
              <View className={classnames(styles.infoItem, { [styles.overdue]: task.overdue })}>
                📅 预计完成：{task.expectedCompleteDate}
                {task.overdue && '（已超期）'}
              </View>
            )}
            {task.priority && (
              <View className={`${styles.priorityTag} ${task.priority}`}>
                {task.priority === 'high' ? '🔥 高优先级' : task.priority === 'low' ? '🌱 低优先级' : '⚡ 中优先级'}
              </View>
            )}
          </View>
          {task.resubmitCount && task.resubmitCount > 0 && (
            <View className={styles.resubmitBadge}>⚠️ 已提交 {task.resubmitCount} 次</View>
          )}
        </View>

        {isRejected && task.confirmRemark && (
          <View className={styles.section}>
            <View className={styles.card}>
              <View className={styles.rejectionAlert}>
                <Text className={styles.rejectionTitle}>
                  ❗ 甲方{task.rejectionHistory && task.rejectionHistory[task.rejectionHistory.length - 1]?.type === 'spotcheck' ? '抽检' : ''}驳回提醒
                </Text>
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
                        {rh.type && (
                          <Text
                            style={{
                              marginLeft: 12,
                              padding: '2rpx 10rpx',
                              borderRadius: 999,
                              fontSize: 20,
                              background: rh.type === 'spotcheck' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                              color: rh.type === 'spotcheck' ? '#EF4444' : '#F59E0B'
                            }}
                          >
                            {rh.type === 'spotcheck' ? '抽检驳回' : '初审驳回'}
                          </Text>
                        )}
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
              {isCompleted && (
                <View className={styles.completedBanner}>
                  <Text style={{ fontSize: 32 }}>✅</Text>
                  <View className={styles.completedText}>
                    任务已完成归档
                    <View className={styles.completedSub}>
                      {task.completionType === 'spotcheck-pass' ? `抽检通过 · ${task.spotCheckedBy || ''}` :
                       task.completionType === 'manual' ? '人工确认完成' : '系统自动归档'}
                      {task.completedAt && ` · ${task.completedAt}`}
                    </View>
                  </View>
                </View>
              )}

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

                  {hasMultipleVersions && (
                    <View className={styles.versionTabs}>
                      {versions.map((v, idx) => (
                        <View
                          key={v.version}
                          className={classnames(styles.versionTab, {
                            [styles.active]: (viewVersion === null && idx === versions.length - 1) || viewVersion === v.version
                          })}
                          onClick={() => setViewVersion(viewVersion === v.version ? null : v.version)}
                        >
                          第{v.version}版
                        </View>
                      ))}
                    </View>
                  )}

                  {hasMultipleVersions && viewVersion && (
                    <View className={styles.versionMeta}>
                      提交人：{versions.find(v => v.version === viewVersion)?.submittedBy || '-'} ·
                      提交时间：{versions.find(v => v.version === viewVersion)?.submittedAt || '-'}
                    </View>
                  )}

                  <View className={styles.blockContent}>
                    {hasMultipleVersions && viewVersion
                      ? versions.find(v => v.version === viewVersion)?.action
                      : task.rectificationAction
                    }
                  </View>

                  {hasMultipleVersions && viewVersion
                    ? renderAttachments(versions.find(v => v.version === viewVersion)?.attachments || [], false, 'rectification')
                    : renderAttachments(task.rectificationAttachments || [], false, 'rectification')
                  }

                  {hasMultipleVersions && !viewVersion && (
                    <View className={styles.versionMeta}>
                      💡 点击上方版本标签可查看历史整改内容对比
                    </View>
                  )}
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
                      {task.confirmResult === 'accepted' ? '✓ 初审通过' : '✗ 已驳回待补充'}
                    </View>
                    {task.confirmRemark && (
                      <Text className={styles.resultRemark}>{task.confirmRemark}</Text>
                    )}
                  </View>
                </View>
              )}

              {(task.spotChecked || canSpotCheck) && (
                <View className={styles.spotcheckSection}>
                  <View className={styles.spotcheckHeader}>
                    <Text className={styles.spotcheckTitle}>🔍 抽检复核</Text>
                    {task.spotChecked && (
                      <Text className={classnames(styles.spotcheckStatus, {
                        [styles.pass]: task.spotCheckResult === 'pass',
                        [styles.fail]: task.spotCheckResult === 'fail'
                      })}>
                        {task.spotCheckResult === 'pass' ? '✓ 抽检通过' : '✗ 抽检驳回'}
                      </Text>
                    )}
                  </View>

                  {task.spotChecked && task.spotCheckRemark && (
                    <View className={styles.spotcheckContent}>
                      {task.spotCheckedBy && <Text>{task.spotCheckedBy} · </Text>}
                      {task.spotCheckedAt && <Text>{task.spotCheckedAt}{'\n'}</Text>}
                      {task.spotCheckRemark}
                    </View>
                  )}

                  {canSpotCheck && (
                    <>
                      <Textarea
                        className={styles.textarea}
                        placeholder='请填写抽检意见（驳回必填）...'
                        value={spotCheckRemark}
                        onInput={(e) => setSpotCheckRemark(e.detail.value)}
                        maxlength={300}
                        style={{ marginBottom: 16 }}
                      />
                      <View className={styles.spotcheckActions}>
                        <View
                          className={classnames(styles.spotcheckBtn, styles.fail)}
                          onClick={() => handleSpotCheck(false)}
                        >
                          抽检驳回
                        </View>
                        <View
                          className={classnames(styles.spotcheckBtn, styles.pass)}
                          onClick={() => handleSpotCheck(true)}
                        >
                          抽检通过
                        </View>
                      </View>
                    </>
                  )}
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
        <Button className={styles.btnCallList} onClick={handleGotoCallList}>
          📞 当天通话
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
