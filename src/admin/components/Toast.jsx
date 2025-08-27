import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Toast({ message, type = 'info', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'var(--admin-success)'
      case 'warning':
        return 'var(--admin-warning)'
      case 'error':
        return 'var(--admin-error)'
      case 'info':
      default:
        return 'var(--admin-info)'
    }
  }

  return (
    <motion.div
      className="toast"
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        background: getBackgroundColor(),
        borderLeft: `4px solid ${getBackgroundColor()}`
      }}
    >
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>
        ×
      </button>
    </motion.div>
  )
}
