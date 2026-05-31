import React from 'react';
import styles from './Button.module.css';

export default function Button({ 
  children, 
  variant = 'primary', // primary, secondary, outline, danger, ghost
  size = 'medium', // small, medium, large
  className = '', 
  disabled = false, 
  onClick, 
  type = 'button',
  icon: Icon,
  loading = false,
  ...props 
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className} ${loading ? styles.loading : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner}></span>
      ) : Icon ? (
        <span className={styles.iconWrapper}><Icon size={size === 'small' ? 14 : 16} /></span>
      ) : null}
      <span className={styles.btnText}>{children}</span>
    </button>
  );
}
