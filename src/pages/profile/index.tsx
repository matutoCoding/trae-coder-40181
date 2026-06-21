import React, { useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { mockUsers, statistics } from '@/data/profile'
import { UserRole } from '@/types'
import styles from './index.module.scss'

interface MenuItemType {
  icon: string
  iconBg: string
  text: string
  onClick?: () => void
}

const ProfilePage: React.FC = () => {
  const [role, setRole] = useState<UserRole>('partyA')
  const user = mockUsers[role]
  const stats = statistics[role]

  const handleRoleSwitch = () => {
    Taro.showModal({
      title: '切换角色',
      content: `是否切换为${role === 'partyA' ? '供应商主管' : '甲方质检员'}视角？`,
      success: (res) => {
        if (res.confirm) {
          setRole(role === 'partyA' ? 'supplier' : 'partyA')
          Taro.showToast({ title: '角色已切换', icon: 'success' })
        }
      }
    })
  }

  const menuItems: MenuItemType[][] = [
    [
      { icon: '📊', iconBg: 'rgba(43, 90, 255, 0.08)', text: '质检报告查看', onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
      { icon: '🏢', iconBg: 'rgba(16, 185, 129, 0.1)', text: '项目管理', onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) }
    ],
    [
      { icon: '📖', iconBg: 'rgba(245, 158, 11, 0.1)', text: '质检规范文档', onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
      { icon: '🔔', iconBg: 'rgba(239, 68, 68, 0.08)', text: '消息通知设置', onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) }
    ],
    [
      { icon: '❓', iconBg: 'rgba(139, 92, 246, 0.1)', text: '帮助与反馈', onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
      { icon: 'ℹ️', iconBg: 'rgba(107, 114, 128, 0.1)', text: '关于质检协同板', onClick: () => Taro.showToast({ title: 'v1.0.0', icon: 'none' }) }
    ]
  ]

  const renderStatBlocks = () => {
    if (role === 'partyA') {
      return (
        <View className={styles.statGrid}>
          <View className={styles.statBlock}>
            <Text className={styles.statBlockNum}>{stats.todayChecked}</Text>
            <Text className={styles.statBlockLabel}>今日已质检</Text>
          </View>
          <View className={styles.statBlock}>
            <Text className={classnames(styles.statBlockNum, styles.accent)}>{stats.pendingReview}</Text>
            <Text className={styles.statBlockLabel}>待审核申诉</Text>
          </View>
          <View className={styles.statBlock}>
            <Text className={styles.statBlockNum}>{stats.thisMonthTotal}</Text>
            <Text className={styles.statBlockLabel}>本月总质检</Text>
          </View>
          <View className={styles.statBlock}>
            <Text className={classnames(styles.statBlockNum, styles.accent)}>{stats.appealCount}</Text>
            <Text className={styles.statBlockLabel}>本月申诉</Text>
          </View>
        </View>
      )
    }
    return (
      <View className={styles.statGrid}>
        <View className={styles.statBlock}>
          <Text className={classnames(styles.statBlockNum, styles.accent)}>{stats.pendingTasks}</Text>
          <Text className={styles.statBlockLabel}>待处理任务</Text>
        </View>
        <View className={styles.statBlock}>
          <Text className={styles.statBlockNum}>{stats.rectifyingTasks}</Text>
          <Text className={styles.statBlockLabel}>整改中</Text>
        </View>
        <View className={styles.statBlock}>
          <Text className={classnames(styles.statBlockNum, styles.success)}>{stats.completedThisMonth}</Text>
          <Text className={styles.statBlockLabel}>本月已完成</Text>
        </View>
        <View className={styles.statBlock}>
          <Text className={classnames(styles.statBlockNum, styles.success)}>{stats.complianceRate}%</Text>
          <Text className={styles.statBlockLabel}>合规率</Text>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.roleBadge}>
          <Text>{role === 'partyA' ? '🎯 甲方质检员' : '🏭 供应商主管'}</Text>
        </View>

        <View className={styles.userRow}>
          <View className={styles.avatar}>
            <Text>{user.name.charAt(0)}</Text>
          </View>
          <View className={styles.userInfo}>
            <Text className={styles.userName}>{user.name}</Text>
            <Text className={styles.userCompany}>{user.company}</Text>
            <Button className={styles.roleSwitchBtn} onClick={handleRoleSwitch}>
              切换角色
            </Button>
          </View>
        </View>
      </View>

      <View className={styles.statSection}>
        <Text className={styles.statTitle}>数据概览</Text>
        {renderStatBlocks()}
      </View>

      <View className={styles.menuSection}>
        {menuItems.map((group, gIdx) => (
          <View key={gIdx} className={styles.menuGroup}>
            {group.map((item, idx) => (
              <View key={idx}>
                <View className={styles.menuItem} onClick={item.onClick}>
                  <View className={styles.menuIcon} style={{ background: item.iconBg }}>
                    <Text>{item.icon}</Text>
                  </View>
                  <View className={styles.menuContent}>
                    <Text className={styles.menuText}>{item.text}</Text>
                  </View>
                  <Text className={styles.menuArrow}>›</Text>
                </View>
                {idx < group.length - 1 && <View className={styles.menuDivider} />}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}

export default ProfilePage
