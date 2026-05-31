import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium', // small, medium, large, full
  showClose = true
}) {
  // Lock body scroll and register keyboard escape dismiss handler when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className={styles.modalOverlay}>
          {/* Backdrop click to close */}
          <motion.div 
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div 
            className={`${styles.modalContainer} ${styles[size]}`}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className={styles.modalHeader}>
                {title && <h3 className={styles.modalTitle}>{title}</h3>}
                {showClose && (
                  <button 
                    type="button" 
                    className={styles.closeBtn} 
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className={styles.modalBody}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
