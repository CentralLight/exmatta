import React from 'react'
import { AnimatePresence } from 'framer-motion'
import Toast from './Toast'

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className={`toast-container ${toasts.length > 0 ? 'active' : 'hidden'}`}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
