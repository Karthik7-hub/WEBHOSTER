import React from 'react';
import { X, FileCode, Palette, FileText, FileImage, File } from 'lucide-react';
import styles from './TabManager.module.css';

const getFileIcon = (fileName) => {
  const parts = fileName.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
  
  if (fileName.toLowerCase() === 'index.html') {
    return <FileCode size={13} style={{ color: '#e44d26' }} />;
  }
  if (ext === 'html') {
    return <FileCode size={13} style={{ color: '#f06529' }} />;
  }
  if (ext === 'css') {
    return <Palette size={13} style={{ color: '#30a9dc' }} />;
  }
  if (ext === 'js' || ext === 'jsx') {
    return <FileCode size={13} style={{ color: '#f7df1e' }} />;
  }
  if (ext === 'json') {
    return <FileCode size={13} style={{ color: 'var(--accent-secondary)' }} />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg'].includes(ext)) {
    return <FileImage size={13} style={{ color: '#10b981' }} />;
  }
  if (ext === 'md') {
    return <FileText size={13} style={{ color: '#38bdf8' }} />;
  }
  return <File size={13} style={{ color: '#94a3b8' }} />;
};

export default function TabManager({
  openTabs = [],
  activeFile = null,
  onTabClick,
  onTabClose,
  unsavedChanges = {}
}) {
  if (openTabs.length === 0) {
    return <div className={styles.emptyTabs}>No files open</div>;
  }

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabsList}>
        {openTabs.map(filePath => {
          const fileName = filePath.split('/').pop();
          const isActive = activeFile === filePath;
          const hasUnsaved = !!unsavedChanges[filePath];

          return (
            <div 
              key={filePath}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => onTabClick(filePath)}
            >
              <div className={styles.tabContent}>
                {getFileIcon(fileName)}
                <span className={styles.tabName} title={filePath}>
                  {fileName}
                </span>
              </div>

              {/* Close Button / Unsaved changes Indicator */}
              <button 
                type="button" 
                className={`${styles.closeBtn} ${hasUnsaved ? styles.unsaved : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(filePath);
                }}
                title={hasUnsaved ? 'Unsaved changes' : 'Close tab'}
              >
                {hasUnsaved ? (
                  <span className={styles.unsavedDot}></span>
                ) : (
                  <X size={12} />
                )}
                <X size={12} className={styles.hoverCloseIcon} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
