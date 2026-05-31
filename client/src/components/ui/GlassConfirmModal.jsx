import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, Loader2, X } from 'lucide-react';
import styles from './GlassConfirmModal.module.css';

export default function GlassConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'warning', // warning, danger, success, info, alert
  isDestructive = false
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  // Lock body scroll and register keyboard escape dismiss handler
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsConfirming(false); // Reset confirmation loading state on close
    }
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isConfirming) {
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
  }, [isOpen, onClose, isConfirming]);

  const getIcon = () => {
    switch (type) {
      case 'danger':
      case 'warning':
        return <AlertTriangle size={32} className={styles.iconWarning} />;
      case 'success':
        return <CheckCircle size={32} className={styles.iconSuccess} />;
      case 'info':
      default:
        return <Info size={32} className={styles.iconInfo} />;
    }
  };

  const showSingleBtn = type === 'alert' || !onConfirm;

  const handleConfirmClick = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      if (onConfirm) {
        await onConfirm();
      }
      onClose();
    } catch (err) {
      console.error("Error during confirm action:", err);
    } finally {
      setIsConfirming(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className={styles.modalOverlay}>
          {/* Backdrop click to close - disabled while confirming */}
          <motion.div 
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isConfirming ? undefined : onClose}
          />

          {/* Frosted Container */}
          <motion.div 
            className={styles.modalContainer}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          >
            <div className={styles.modalHeader}>
              <div className={styles.iconContainer}>
                {getIcon()}
              </div>
              {!isConfirming && (
                <button 
                  type="button" 
                  className={styles.closeBtn} 
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className={styles.modalBody}>
              <h3 className={styles.modalTitle}>{title}</h3>
              <p className={styles.modalMessage}>{message}</p>
            </div>
            
            <div className={styles.modalActions}>
              {showSingleBtn ? (
                <button 
                  type="button" 
                  className={styles.confirmBtn} 
                  onClick={onClose}
                  disabled={isConfirming}
                >
                  {confirmLabel || 'OK'}
                </button>
              ) : (
                <>
                  <button 
                    type="button" 
                    className={styles.cancelBtn} 
                    onClick={onClose}
                    disabled={isConfirming}
                    style={isConfirming ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    {cancelLabel}
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.confirmBtn} ${isDestructive ? styles.destructiveBtn : ''}`}
                    onClick={handleConfirmClick}
                    disabled={isConfirming}
                    style={isConfirming ? { opacity: 0.8, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' } : {}}
                  >
                    {isConfirming && <Loader2 size={14} className={styles.spinner} />}
                    <span>{isConfirming ? 'Please wait...' : confirmLabel}</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
