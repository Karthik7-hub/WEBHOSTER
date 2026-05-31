import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeployments } from '../../context/DeploymentContext';
import { Package, Globe, Plus, X } from 'lucide-react';
import GlassConfirmModal from '../ui/GlassConfirmModal';
import styles from './DeploymentList.module.css';

export default function DeploymentList({ onCreateClick }) {
  const { deployments, loading, removeDeployment } = useDeployments();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  
  // Storage ZIP Download and Error states
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorAlertOpen, setErrorAlertOpen] = useState(false);
  const [errorAlertMsg, setErrorAlertMsg] = useState('');
  const navigate = useNavigate();

  // 1. Project Friendly Naming Formatting
  const formatProjectName = (slug) => {
    if (!slug) return '';
    return slug
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // 2. Format Timestamp Helper
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // 3. Sort Filter Algorithm (Newest first)
  const filteredDeployments = [...deployments].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // 4. Safe Delete Trigger
  const handleDelete = (id, name, e) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  // 5. Secure ZIP Packaging Downloader (Falls back to CDN backupUrl if available)
  const handleDownloadZip = async (id, backupUrl, name, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (backupUrl) {
      window.open(backupUrl, '_blank');
      return;
    }

    setIsDownloading(true);
    try {
      const token = localStorage.getItem('webhoster_token');
      const response = await fetch(`/api/deployments/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to pack static resources from the server.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setErrorAlertMsg('Failed to package static project files. Please make sure the server is online.');
      setErrorAlertOpen(true);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading && deployments.length === 0) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Synchronizing active static assets...</p>
      </div>
    );
  }

  return (
    <div className={styles.historySection}>
      <div className={styles.sectionHeader}>
        <div className={styles.titleRow}>
          <h2>Projects</h2>
          <button 
            type="button" 
            className={styles.createBtn}
            onClick={onCreateClick}
          >
            <Plus size={15} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {filteredDeployments.length === 0 ? (
        <div className={styles.emptyCard}>
          <Package size={48} className={styles.emptyIcon} />
          <h3>No static hosting found</h3>
          <p>
            Create a new project or upload a static site ZIP archive to instantly see your hosted website list!
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredDeployments.map((deployment) => {
            return (
              <div 
                key={deployment.id} 
                className={styles.card}
                onClick={() => navigate(`/deployment/${deployment.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/deployment/${deployment.id}`);
                  }
                }}
              >
                <div className={styles.cardContent}>
                  <h4 className={styles.cardTitle}>{formatProjectName(deployment.name)}</h4>
                  <div className={styles.cardMetaInline}>
                    Created {formatTime(deployment.createdAt)} • {deployment.fileCount} {deployment.fileCount === 1 ? 'File' : 'Files'}
                  </div>
                </div>

                <div className={styles.cardActionsPill}>
                  <button
                    type="button"
                    className={`${styles.pillBtn} ${styles.primaryPill}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(`/project/${deployment.id}/edit`, '_blank');
                    }}
                  >
                    Open Editor
                  </button>
                  
                  <a
                    href={deployment.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.pillBtn} ${styles.outlinePill}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Visit Site
                  </a>

                  <button
                    type="button"
                    className={`${styles.pillBtn} ${styles.outlinePill}`}
                    onClick={(e) => handleDownloadZip(deployment.id, deployment.backupUrl, deployment.name, e)}
                    disabled={isDownloading}
                  >
                    Download ZIP
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GlassConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={async () => {
          if (projectToDelete) {
            await removeDeployment(projectToDelete.id);
          }
        }}
        title="Delete Project?"
        message={`This project "${formatProjectName(projectToDelete?.name || '')}" will be moved to Deleted Projects (Trash Bin) and can be restored for 7 days.`}
        confirmLabel="Delete Project"
        cancelLabel="Cancel"
        type="danger"
        isDestructive={true}
      />

      <GlassConfirmModal
        isOpen={errorAlertOpen}
        onClose={() => {
          setErrorAlertOpen(false);
          setErrorAlertMsg('');
        }}
        title="Download Error"
        message={errorAlertMsg}
        confirmLabel="OK"
        type="warning"
      />
    </div>
  );
}
