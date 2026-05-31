import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './Drawer.module.css';

export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right', // right, left
  size = 'medium' // small, medium, large
}) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const slideVariants = {
    hidden: { x: position === 'right' ? '100%' : '-100%' },
    visible: { x: 0 },
    exit: { x: position === 'right' ? '100%' : '-100%' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.drawerOverlay}>
          {/* Backdrop */}
          <motion.div 
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer container */}
          <motion.div
            className={`${styles.drawerContainer} ${styles[position]} ${styles[size]}`}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
          >
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>{title}</h3>
              <button 
                type="button" 
                className={styles.closeBtn} 
                onClick={onClose}
                aria-label="Close drawer"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
