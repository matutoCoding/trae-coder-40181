import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { TaskStatus, UserRole, TASK_STATUS_MAP, RectificationTask } from '@/types'
import { useQCStore } from '@/store'
import TaskCard from '@/components/TaskCard'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

interface TabItem {
  key: TaskStatus | 'all'
  label: string
  color: string
}

const METRICS: TabItem[] = [
  { key: 'pending', label: '待确认', color: '#F59E0B' },
  { key: 'appealing', label: '申诉中', color: '#8B5CF6' },
  { key: 'rectifying', label: '整改中', color: '#2B5AFF' },
  { key: 'rejected', label: '已驳回', color: '#EF4444' },
  { key: 'confirmed', label: '已确认', color: '#10B981' },
  { key: 'completed', label: '已完成', color: '#6B7280' }
]

interface RejectRemark {
  taskId: string
  remark: string
}

const TasksPage: React.FC = () => {
  const tasks = useQCStore(state => state.tasks)
  const batchRectify = useQCStore(state => state.batchRectify)
  const batchConfirm = useQCStore(state => state.batchConfirm)
  const batchReject = useQCStore(state => state.batchReject)

  const [currentRole, setCurrentRole] = useState<UserRole>('supplier')
  const [activeTab, setActiveTab] = useState<TabItem['key']>('all')
  const [filterProject, setFilterProject] = useState<string | null>(null)
  const [filterSupplier, setFilterSupplier] = useState<string | null>(null)

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchAction, setBatchAction] = useState<'rectify' | 'confirm' | 'reject'>('rectify')
  const [commonRectifyAction, setCommonRectifyAction] = useState('')
  const [rejectRemarks, setRejectRemarks] = useState<RejectRemark[]>([])

  const uniqueProjects = useMemo(() => {
    return Array.from(new Set(tasks.map(t => t.callRecord.projectName)))
  }, [tasks])

  const uniqueSuppliers = useMemo(() => {
    return Array.from(new Set(tasks.map(t => t.assignedTo.split('-')[0] || t.assignedTo)))
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const tabMatch = activeTab === 'all' || t.status === activeTab
      const projMatch = !filterProject || t.callRecord.projectName === filterProject
      const suppMatch = !filterSupplier || t.assignedTo.includes(filterSupplier)
      return tabMatch && projMatch && suppMatch
    })
  }, [tasks, activeTab, filterProject, filterSupplier])

  const metrics = useMemo(() => {
    const tempTasks = tasks.filter(t => {
      const projMatch = !filterProject || t.callRecord.projectName === filterProject
      const suppMatch = !filterSupplier || t.assignedTo.includes(filterSupplier)
      return projMatch && suppMatch
    })
    return METRICS.map(m => ({
      ...m,
      count: tempTasks.filter(t => t.status === m.key).length
    }))
  }, [tasks, filterProject, filterSupplier])

  const totalInFilters = useMemo(
    () => metrics.reduce((sum, m) => sum + m.count, 0),
    [metrics]
  )

  const availableForBatch = useMemo(() => {
    if (currentRole === 'supplier') {
      return filteredTasks.filter(t => t.status === 'pending' || t.status === 'rejected')
    }
    return filteredTasks.filter(t => t.status === 'appealing' || t.status === 'rectifying')
  }, [filteredTasks, currentRole])

  const batchCandidates = useMemo(() => {
    if (!selectMode) return []
    return availableForBatch.filter(t => selectedIds.includes(t.id))
  }, [selectMode, availableForBatch, selectedIds])

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role)
    setSelectMode(false)
    setSelectedIds([])
  }

  const handleMetricClick = (key: TaskStatus | 'all') => {
    setActiveTab(key)
    setSelectMode(false)
    setSelectedIds([])
  }

  const handleProjectFilter = () => {
    const options = ['全部项目', ...uniqueProjects]
    Taro.showActionSheet({ itemList: options }).then(res => {
      setFilterProject(res.tapIndex === 0 ? null : uniqueProjects[res.tapIndex - 1])
    }).catch(() => {})
  }

  const handleSupplierFilter = () => {
    const options = ['全部供应商', ...uniqueSuppliers]
    Taro.showActionSheet({ itemList: options }).then(res => {
      setFilterSupplier(res.tapIndex === 0 ? null : uniqueSuppliers[res.tapIndex - 1])
    }).catch(() => {})
  }

  const handleResetFilters = () => {
    setFilterProject(null)
    setFilterSupplier(null)
    setActiveTab('all')
  }

  const toggleSelectMode = () => {
    if (!selectMode && availableForBatch.length === 0) {
      Taro.showToast({
        title: currentRole === 'supplier' ? '暂无可批量处理的任务' : '暂无可批量审核的任务',
        icon: 'none'
      })
      return
    }
    setSelectMode(!selectMode)
    setSelectedIds([])
  }

  const handleSelectChange = (taskId: string, selected: boolean) => {
    setSelectedIds(prev =>
      selected ? [...prev, taskId] : prev.filter(id => id !== taskId)
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === availableForBatch.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(availableForBatch.map(t => t.id))
    }
  }

  const handleBatchRectifyOpen = () => {
    if (batchCandidates.length === 0) return
    setBatchAction('rectify')
    setCommonRectifyAction('已组织全员针对服务态度/流程规范/话术标准进行专项培训，加强现场巡检，本周内完成考核。')
    setShowBatchModal(true)
  }

  const handleBatchConfirmOpen = () => {
    if (batchCandidates.length === 0) return
    Taro.showModal({
      title: '批量确认通过',
      content: `确定通过 ${batchCandidates.length} 条任务的审核？`,
      success: (res) => {
        if (res.confirm) {
          const n = batchConfirm(batchCandidates.map(t => t.id), '质检-当前用户')
          Taro.showToast({ title: `已通过 ${n} 条`, icon: 'success' })
          setSelectMode(false)
          setSelectedIds([])
        }
      }
    })
  }

  const handleBatchRejectOpen = () => {
    if (batchCandidates.length === 0) return
    setBatchAction('reject')
    setRejectRemarks(batchCandidates.map(t => ({ taskId: t.id, remark: '' })))
    setShowBatchModal(true)
  }

  const handleRejectRemarkChange = (taskId: string, value: string) => {
    setRejectRemarks(prev => prev.map(r => r.taskId === taskId ? { ...r, remark: value } : r))
  }

  const handleBatchSubmit = () => {
    if (batchAction === 'rectify') {
      if (!commonRectifyAction.trim()) {
        Taro.showToast({ title: '请填写通用整改动作', icon: 'none' })
        return
      }
      const n = batchRectify(
        batchCandidates.map(t => t.id),
        commonRectifyAction
      )
      Taro.showToast({ title: `已处理 ${n} 条`, icon: 'success' })
      setShowBatchModal(false)
      setSelectMode(false)
      setSelectedIds([])
    } else if (batchAction === 'reject') {
      const unfilled = rejectRemarks.filter(r => !r.remark.trim())
      if (unfilled.length > 0) {
        Taro.showToast({ title: `有 ${unfilled.length} 条未填驳回意见`, icon: 'none' })
        return
      }
      const n = batchReject(
        rejectRemarks.filter(r => r.remark.trim()).map(r => ({ taskId: r.taskId, remark: r.remark.trim() })),
        '质检-当前用户'
      )
      Taro.showToast({ title: `已驳回 ${n} 条`, icon: 'success' })
      setShowBatchModal(false)
      setSelectMode(false)
      setSelectedIds([])
    }
  }

  return (
    <>
      <ScrollView className={styles.page} scrollY>
        <View className={styles.header}>
          <View className={styles.roleSwitch}>
            <View
              className={classnames(styles.roleItem, { [styles.active]: currentRole === 'supplier' })}
              onClick={() => handleRoleChange('supplier')}
            >
              供应商视角
            </View>
            <View
              className={classnames(styles.roleItem, { [styles.active]: currentRole === 'partyA' })}
              onClick={() => handleRoleChange('partyA')}
            >
              甲方视角
            </View>
          </View>

          <View className={styles.filterBar}>
            <View
              className={classnames(styles.filterChip, { [styles.active]: filterProject })}
              onClick={handleProjectFilter}
            >
              📂 {filterProject || '全部项目'} ▼
            </View>
            <View
              className={classnames(styles.filterChip, { [styles.active]: filterSupplier })}
              onClick={handleSupplierFilter}
            >
              🏭 {filterSupplier || '全部供应商'} ▼
            </View>
          </View>

          <View className={styles.dashboardCard}>
            <View className={styles.dashboardHeader}>
              <Text className={styles.dashboardTitle}>
                📊 数据概览（共 {totalInFilters} 条）
              </Text>
              <View className={styles.resetBtn} onClick={handleResetFilters}>重置筛选</View>
            </View>
            <View className={styles.metricsGrid}>
              {metrics.map(m => (
                <View
                  key={m.key}
                  className={classnames(styles.metricItem, {
                    [styles.active]: activeTab === m.key
                  })}
                  onClick={() => handleMetricClick(m.key)}
                >
                  <Text className={styles.metricNum} style={{ color: m.color }}>
                    {m.count}
                  </Text>
                  <Text className={styles.metricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.quickEntry}>
          <View
            className={styles.quickItem}
            onClick={() => Taro.navigateTo({ url: '/pages/report/index' })}
          >
            <Text className={styles.quickIcon}>📊</Text>
            <Text className={styles.quickLabel}>质检报表</Text>
          </View>
          <View
            className={styles.quickItem}
            onClick={() => Taro.navigateTo({ url: '/pages/ledger/index' })}
          >
            <Text className={styles.quickIcon}>📋</Text>
            <Text className={styles.quickLabel}>整改台账</Text>
          </View>
          {currentRole === 'partyA' && (
            <View
              className={styles.quickItem}
              onClick={() => handleMetricClick('confirmed')}
            >
              <Text className={styles.quickIcon}>🔍</Text>
              <Text className={styles.quickLabel}>抽检复核</Text>
            </View>
          )}
        </View>

        {selectMode && batchCandidates.length > 0 && (
          <View className={styles.batchBar}>
            <View className={styles.batchInfo}>
              已选 <Text className={styles.batchNum}>{batchCandidates.length}</Text> 条
              <View onClick={handleSelectAll} style={{ marginLeft: 12, opacity: 0.9 }}>
                [{selectedIds.length === availableForBatch.length ? '取消全选' : '全选'}]
              </View>
            </View>
            <View className={styles.batchActions}>
              {currentRole === 'supplier' ? (
                <View
                  className={classnames(styles.batchActionBtn, styles.primary)}
                  onClick={handleBatchRectifyOpen}
                >
                  批量整改
                </View>
              ) : (
                <>
                  <View
                    className={classnames(styles.batchActionBtn, styles.primary)}
                    onClick={handleBatchConfirmOpen}
                  >
                    批量通过
                  </View>
                  <View
                    className={classnames(styles.batchActionBtn, styles.danger)}
                    onClick={handleBatchRejectOpen}
                  >
                    批量驳回
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        <View className={styles.toolbar}>
          <View className={styles.toolbarLeft}>
            <Text className={styles.toolbarTitle}>
              {currentRole === 'supplier' ? '我的待办' : '质检任务'}
            </Text>
            <Text className={styles.toolbarCount}>共 {filteredTasks.length} 条</Text>
          </View>
          <View className={styles.toolbarRight}>
            <View
              className={classnames(styles.toolBtn, { [styles.active]: selectMode })}
              onClick={toggleSelectMode}
            >
              {selectMode ? '✓ 取消勾选' : '☑ 批量处理'}
            </View>
          </View>
        </View>

        <View className={styles.tabs}>
          <View
            className={classnames(styles.tabItem, { [styles.active]: activeTab === 'all' })}
            onClick={() => handleMetricClick('all')}
          >
            全部 <Text className={styles.tabCount}>{filteredTasks.length}</Text>
          </View>
          {METRICS.map(m => {
            const cnt = filteredTasks.filter(t => t.status === m.key).length
            return (
              <View
                key={m.key}
                className={classnames(styles.tabItem, { [styles.active]: activeTab === m.key })}
                onClick={() => handleMetricClick(m.key)}
              >
                {m.label} <Text className={styles.tabCount}>{cnt}</Text>
              </View>
            )
          })}
        </View>

        <View className={styles.listSection}>
          <View className={styles.listWrap}>
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => {
                const canSelect = selectMode && availableForBatch.some(t => t.id === task.id)
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    selectable={canSelect}
                    selected={selectedIds.includes(task.id)}
                    onSelectChange={handleSelectChange}
                  />
                )
              })
            ) : (
              <EmptyState text='当前筛选条件下暂无任务' icon='📋' />
            )}
          </View>
        </View>
      </ScrollView>

      {showBatchModal && (
        <View className={styles.modalMask} onClick={() => setShowBatchModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>
                {batchAction === 'rectify' ? `批量整改（${batchCandidates.length} 条）` :
                 `批量驳回（${batchCandidates.length} 条）`}
              </Text>
              <Text className={styles.modalClose} onClick={() => setShowBatchModal(false)}>×</Text>
            </View>

            <ScrollView className={styles.modalBody} scrollY>
              {batchAction === 'rectify' ? (
                <>
                  <Text className={styles.modalHint}>
                    对所选 {batchCandidates.length} 条任务统一填写以下整改动作（将写入每条任务详情）：
                  </Text>
                  <Textarea
                    className={styles.modalTextarea}
                    placeholder='如：已开展专项培训、现场巡检加强、考核标准更新等具体可落地措施...'
                    value={commonRectifyAction}
                    onInput={(e) => setCommonRectifyAction(e.detail.value)}
                    maxlength={500}
                  />
                  <Text className={styles.modalHint}>
                    包含任务：{batchCandidates.map(t => t.callRecord.agentName).join('、')}
                  </Text>
                </>
              ) : (
                <>
                  <Text className={styles.modalHint}>
                    请逐条填写驳回意见（未填写将不提交该条）：
                  </Text>
                  {batchCandidates.map((t: RectificationTask, idx: number) => {
                    const item = rejectRemarks.find(r => r.taskId === t.id)
                    const isWarning = item && !item.remark.trim()
                    return (
                      <View key={t.id} className={styles.rejectItem}>
                        <View className={styles.rejectItemTitle}>
                          <Text>{idx + 1}. {t.callRecord.agentName} - {t.callRecord.projectName}</Text>
                          <Text className={styles.rejectItemMeta}>
                            {TASK_STATUS_MAP[t.status].label}
                          </Text>
                        </View>
                        <Textarea
                          className={classnames(styles.rejectItemTextarea, {
                            [styles.warning]: isWarning
                          })}
                          placeholder='请输入驳回理由，指导供应商改进方向...'
                          value={item?.remark || ''}
                          onInput={(e) => handleRejectRemarkChange(t.id, e.detail.value)}
                          maxlength={200}
                        />
                      </View>
                    )
                  })}
                </>
              )}
            </ScrollView>

            <View className={styles.modalFooter}>
              <View
                className={classnames(styles.modalBtn, styles.cancel)}
                onClick={() => setShowBatchModal(false)}
              >
                取消
              </View>
              <View
                className={classnames(
                  styles.modalBtn,
                  batchAction === 'reject' ? styles.danger : styles.confirm
                )}
                onClick={handleBatchSubmit}
              >
                {batchAction === 'rectify' ? '提交整改' : '提交驳回'}
              </View>
            </View>
          </View>
        </View>
      )}
    </>
  )
}

export default TasksPage
