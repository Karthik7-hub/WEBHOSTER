import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import styles from './Toast.module.css';

export default function Toast({ 
  message, 
  type = 'info', // success, error, info, loading
  duration = 4000, 
  onClose 
}) {
  useEffect(() => {
    if (type === 'loading') return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [type, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className={styles.successIcon} size={18} />;
      case 'error':
        return <AlertCircle className={styles.errorIcon} size={18} />;
      case 'loading':
        return <Loader2 className={styles.loadingIcon} size={18} />;
      case 'info':
      default:
        return <Info className={styles.infoIcon} size={18} />;
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.content}>
        {getIcon()}
        <span className={styles.message}>{message}</span>
      </div>
      {type !== 'loading' && onClose && (
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
