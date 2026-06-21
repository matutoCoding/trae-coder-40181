import React, { useState } from 'react'
import { View, Text, Button, Textarea } from '@tarojs/components'
import classnames from 'classnames'
import { TranscriptLine, ViolationCategory, VIOLATION_CATEGORY_MAP } from '@/types'
import styles from './index.module.scss'

interface TagSelectorProps {
  visible: boolean
  line: TranscriptLine | null
  onClose: () => void
  onConfirm: (category: ViolationCategory, description: string) => void
}

const CATEGORY_LIST: ViolationCategory[] = ['attitude', 'process', 'script', 'other']

const TagSelector: React.FC<TagSelectorProps> = ({ visible, line, onClose, onConfirm }) => {
  const [selectedCategory, setSelectedCategory] = useState<ViolationCategory | null>(null)
  const [description, setDescription] = useState('')

  if (!visible || !line) return null

  const handleCategoryClick = (cat: ViolationCategory) => {
    setSelectedCategory(cat)
  }

  const handleConfirm = () => {
    if (!selectedCategory) return
    onConfirm(selectedCategory, description.trim())
    setSelectedCategory(null)
    setDescription('')
    onClose()
  }

  const handleClose = () => {
    setSelectedCategory(null)
    setDescription('')
    onClose()
  }

  return (
    <View className={styles.mask} onClick={handleClose}>
      <View className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <View className={styles.panelHeader}>
          <Text className={styles.panelTitle}>标记问题</Text>
          <Text className={styles.closeBtn} onClick={handleClose}>×</Text>
        </View>

        <View className={styles.quoteBox}>
          <Text className={styles.quoteLabel}>选中的对话内容：</Text>
          <Text className={styles.quoteContent}>{line.content}</Text>
        </View>

        <Text className={styles.sectionTitle}>选择问题分类</Text>
        <View className={styles.tagsWrap}>
          {CATEGORY_LIST.map((cat) => {
            const catInfo = VIOLATION_CATEGORY_MAP[cat]
            const isActive = selectedCategory === cat
            return (
              <View
                key={cat}
                className={classnames(styles.tagItem, { [styles.active]: isActive })}
                style={isActive ? { background: catInfo.color } : {}}
                onClick={() => handleCategoryClick(cat)}
              >
                {catInfo.label}
              </View>
            )
          })}
        </View>

        <View className={styles.inputWrap}>
          <Text className={styles.sectionTitle}>问题描述（选填）</Text>
          <Textarea
            className={styles.textarea}
            placeholder='请描述具体问题，如：语气生硬、未按流程确认信息等...'
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={200}
          />
        </View>

        <View className={styles.btnRow}>
          <Button className={styles.btnCancel} onClick={handleClose}>取消</Button>
          <Button
            className={classnames(styles.btnConfirm, { [styles.disabled]: !selectedCategory })}
            onClick={handleConfirm}
            disabled={!selectedCategory}
          >
            确认标记
          </Button>
        </View>
      </View>
    </View>
  )
}

export default TagSelector
