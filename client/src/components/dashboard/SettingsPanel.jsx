import React, { useState, useEffect } from 'react';
import { 
  Shield, AlertTriangle, Check, AlertCircle, Database, 
  Trash2, RefreshCw, Undo2, HardDrive, Info, Sun, Moon, Monitor
} from 'lucide-react';
import { useDeployments } from '../../context/DeploymentContext';
import { useTheme } from '../../context/ThemeContext.jsx';
import * as api from '../../api/api';
import Button from '../ui/Button';
import GlassConfirmModal from '../ui/GlassConfirmModal';
import styles from './SettingsPanel.module.css';

export default function SettingsPanel() {
  const { adminUser, setAdminUser } = useDeployments();
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState(adminUser || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Credentials States
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [credLoading, setCredLoading] = useState(false);
  const [credError, setCredError] = useState(null);

  // Storage Stats States
  const [storageStats, setStorageStats] = useState(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageError, setStorageError] = useState(null);
  
  const [errorAlertOpen, setErrorAlertOpen] = useState(false);
  const [errorAlertMsg, setErrorAlertMsg] = useState('');
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false);
  const [purgeItemId, setPurgeItemId] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoreItemId, setRestoreItemId] = useState(null);
  
  // Cleanup Sweep States
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [cleanupActionSuccess, setCleanupActionSuccess] = useState(null);

  const fetchStorageStats = async () => {
    try {
      setStorageLoading(true);
      const res = await api.getStorageAnalytics();
      if (res.success) {
        setStorageStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load storage analytics:', err);
      setStorageError('Failed to retrieve system disk metrics.');
    } finally {
      setStorageLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      setUsername(adminUser);
    }
    fetchStorageStats();
  }, [adminUser]);

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    setCredLoading(true);
    setCredError(null);
    setSaveSuccess(false);

    if (!currentPassword) {
      setCredError('Current password is required to verify changes.');
      setCredLoading(false);
      return;
    }

    try {
      const res = await api.updateCredentials(currentPassword, username, newPassword);
      if (res.success) {
        setSaveSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        if (res.data && res.data.username) {
          setAdminUser(res.data.username);
          localStorage.setItem('webhoster_user', res.data.username);
        }
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      setCredError(err.response?.data?.error || 'Failed to update credentials. Please verify your current password.');
    } finally {
      setCredLoading(false);
    }
  };

  const handleDryRunSweep = async () => {
    setCleanupLoading(true);
    setDryRunResult(null);
    setCleanupActionSuccess(null);
    try {
      const res = await api.cleanupStaleDeployments(true);
      if (res.success) {
        setDryRunResult({
          purgedCount: res.purgedCount,
          reclaimableSize: res.reclaimableSize,
          purgedFolders: res.purgedFolders
        });
      }
    } catch (err) {
      console.error('Dry run failed:', err);
      setCleanupActionSuccess({ type: 'error', msg: 'Dry run scan request failed.' });
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleApplyCleanup = async () => {
    setCleanupLoading(true);
    setDryRunResult(null);
    setCleanupActionSuccess(null);
    try {
      const res = await api.cleanupStaleDeployments(false);
      if (res.success) {
        setCleanupActionSuccess({
          type: 'success',
          msg: `Successfully moved ${res.purgedCount} inactive directories into the Trash Bin!`
        });
        await fetchStorageStats();
      }
    } catch (err) {
      console.error('Cleanup apply failed:', err);
      setCleanupActionSuccess({ type: 'error', msg: 'Storage cleanup failed.' });
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleRestoreFromTrash = (id) => {
    setRestoreItemId(id);
    setRestoreConfirmOpen(true);
  };

  const executeRestore = async () => {
    if (!restoreItemId) return;
    try {
      const res = await api.restoreQuarantine(restoreItemId);
      if (res.success) {
        setCleanupActionSuccess({ type: 'success', msg: `Restored project folder "${res.originalId}" from the Trash Bin back to active hosting!` });
        await fetchStorageStats();
      }
    } catch (err) {
      console.error('Trash Bin restore failed:', err);
      setErrorAlertMsg('Failed to restore the selected deleted project.');
      setErrorAlertOpen(true);
    } finally {
      setRestoreItemId(null);
    }
  };

  const handleDeletePermanently = (id) => {
    setPurgeItemId(id);
    setPurgeConfirmOpen(true);
  };

  const executePurge = async () => {
    if (!purgeItemId) return;
    try {
      const res = await api.purgeQuarantine(purgeItemId);
      if (res.success) {
        setCleanupActionSuccess({ type: 'success', msg: 'Project folder permanently deleted from disk.' });
        await fetchStorageStats();
      }
    } catch (err) {
      console.error('Permanent delete failed:', err);
      setErrorAlertMsg('Failed to permanently delete the selected project folder.');
      setErrorAlertOpen(true);
    } finally {
      setPurgeItemId(null);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getExpirationText = (dateString) => {
    const expiry = new Date(dateString);
    const now = new Date();
    const diffMs = expiry - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expiring now';
    if (diffDays === 1) return '1 day remaining';
    return `${diffDays} days remaining`;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Platform Settings & Storage</h2>
        <p className={styles.panelDesc}>Access controls, disk metrics analysis, and trash bin recovery.</p>
      </div>

      <div className={styles.grid}>
        
        {/* Appearance Theme Selector */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Moon className={styles.cardIcon} size={16} />
            <h3>Appearance</h3>
          </div>
          <p className={styles.miniText} style={{ marginBottom: '1.25rem' }}>
            Customize how WebHoster looks on your device. Choose between Dark, Light, or System-matching theme preference.
          </p>
          
          <div className={styles.themeSelector}>
            <div 
              className={`${styles.themeOption} ${theme === 'dark' ? styles.themeOptionActive : ''}`}
              onClick={() => setTheme('dark')}
              title="Switch to dark appearance"
            >
              <div className={styles.themeIcon}><Moon size={20} /></div>
              <span className={styles.themeLabel}>Dark</span>
            </div>
            <div 
              className={`${styles.themeOption} ${theme === 'light' ? styles.themeOptionActive : ''}`}
              onClick={() => setTheme('light')}
              title="Switch to light appearance"
            >
              <div className={styles.themeIcon}><Sun size={20} /></div>
              <span className={styles.themeLabel}>Light</span>
            </div>
            <div 
              className={`${styles.themeOption} ${theme === 'system' ? styles.themeOptionActive : ''}`}
              onClick={() => setTheme('system')}
              title="Follow system appearance preference"
            >
              <div className={styles.themeIcon}><Monitor size={20} /></div>
              <span className={styles.themeLabel}>System</span>
            </div>
          </div>
        </div>

        {/* 1. Access Credentials */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Shield className={styles.cardIcon} size={16} />
            <h3>Admin Credentials</h3>
          </div>
          
          <form onSubmit={handleSaveCredentials} className={styles.form}>
            {credError && (
              <div className={styles.formError}>
                <AlertCircle size={14} />
                <span>{credError}</span>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="username">Admin Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                placeholder="Leave blank to keep current"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="current-password">Current Password (Required)</label>
              <input
                id="current-password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <Button 
              type="submit" 
              variant={saveSuccess ? 'secondary' : 'primary'}
              loading={credLoading}
              className={saveSuccess ? styles.btnSuccess : ''}
            >
              {saveSuccess ? (
                <>
                  <Check size={14} />
                  <span>Credentials Updated</span>
                </>
              ) : 'Save Access Changes'}
            </Button>
          </form>
        </div>

        {/* 2. Platform Storage Analytics */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <HardDrive className={styles.cardIcon} size={16} />
            <h3>Storage Analytics</h3>
          </div>

          {storageLoading ? (
            <div className={styles.loaderArea}>
              <RefreshCw size={24} className={styles.spinner} />
              <p>Analyzing disk metrics...</p>
            </div>
          ) : storageError ? (
            <div className={styles.formError}>
              <AlertCircle size={14} />
              <span>{storageError}</span>
            </div>
          ) : (
            <div className={styles.storageContent}>
              <div className={styles.statsGrid}>
                <div className={styles.statCell}>
                  <span className={styles.statLabel}>Deployments Size</span>
                  <span className={styles.statVal}>{formatSize(storageStats.deploymentsSize)}</span>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLabel}>Uploads Buffer</span>
                  <span className={styles.statVal}>{formatSize(storageStats.uploadsSize)}</span>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLabel}>Temp Workspace</span>
                  <span className={styles.statVal}>{formatSize(storageStats.tempSize)}</span>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLabel}>Deleted Files (Trash)</span>
                  <span className={styles.statVal} style={{ color: storageStats.trashSize > 0 ? 'var(--status-warning)' : 'var(--text-secondary)' }}>
                    {formatSize(storageStats.trashSize)}
                  </span>
                </div>
              </div>

              {/* Maintenance Sweep Controls */}
              <div className={styles.maintenanceActions}>
                <h4>Inactive Files Cleanup</h4>
                <p className={styles.miniText}>Find and clean up folder directories that no longer belong to active projects.</p>
                
                {cleanupActionSuccess && (
                  <div className={cleanupActionSuccess.type === 'success' ? styles.actionSuccessAlert : styles.formError}>
                    <Check size={14} />
                    <span>{cleanupActionSuccess.msg}</span>
                  </div>
                )}

                {dryRunResult && (
                  <div className={styles.dryRunReport}>
                    <h5>Scan Summary:</h5>
                    <p>Found <strong>{dryRunResult.purgedCount}</strong> inactive directories ({formatSize(dryRunResult.reclaimableSize)} reclaimable).</p>
                    {dryRunResult.purgedFolders.length > 0 && (
                      <div className={styles.folderBadges}>
                        {dryRunResult.purgedFolders.map(name => (
                          <span key={name} className={styles.folderBadge}>{name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.sweepBtns}>
                  <Button 
                    variant="secondary" 
                    onClick={handleDryRunSweep} 
                    loading={cleanupLoading}
                    disabled={cleanupLoading}
                  >
                    Scan for Inactive Files
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleApplyCleanup}
                    loading={cleanupLoading}
                    disabled={cleanupLoading || (dryRunResult && dryRunResult.purgedCount === 0)}
                  >
                    Move to Trash Bin
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Trash Bin (Recently Deleted Projects) */}
      <div className={styles.quarantineSection}>
        <div className={styles.cardHeader}>
          <Database size={16} className={styles.cardIcon} />
          <h3>Trash Bin (Recently Deleted Projects)</h3>
        </div>
        <p className={styles.sectionCaption}>Deleted project folders remain held in this Recycle Bin for 7 days before being permanently deleted automatically.</p>

        {storageLoading ? (
          <div className={styles.loaderArea}>
            <RefreshCw size={20} className={styles.spinner} />
            <p>Fetching deleted entries...</p>
          </div>
        ) : !storageStats || storageStats.deletedItems.length === 0 ? (
          <div className={styles.emptyQuarantine}>
            <Info size={24} className={styles.emptyInfoIcon} />
            <p>Your Trash Bin is currently empty. No deleted folders found.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Deleted Folder</th>
                  <th>Project Name / ID</th>
                  <th>Space</th>
                  <th>Expires</th>
                  <th className={styles.textRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {storageStats.deletedItems.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <span className={styles.quarFolderName} title={item.folderName}>
                        {item.folderName}
                      </span>
                    </td>
                    <td>
                      <code className={styles.monoId}>{item.originalId}</code>
                    </td>
                    <td>
                      <span className={styles.sizeText}>{formatSize(item.sizeBytes)}</span>
                    </td>
                    <td>
                      <span className={styles.expiryBadge}>
                        {getExpirationText(item.expiresAt)}
                      </span>
                    </td>
                    <td className={styles.textRight}>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.rowActionBtn}
                          onClick={() => handleRestoreFromTrash(item._id)}
                          title="Restore to active deployments"
                        >
                          <Undo2 size={13} />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.rowActionBtn} ${styles.purgeBtn}`}
                          onClick={() => handleDeletePermanently(item._id)}
                          title="Delete permanently from disk"
                        >
                          <Trash2 size={13} />
                          <span>Delete Forever</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GlassConfirmModal
        isOpen={purgeConfirmOpen}
        onClose={() => {
          setPurgeConfirmOpen(false);
          setPurgeItemId(null);
        }}
        onConfirm={executePurge}
        title="Delete Forever?"
        message="This action cannot be undone. All files, generated ZIPs, and deployment data will be permanently removed."
        confirmLabel="Delete Forever"
        cancelLabel="Cancel"
        type="danger"
        isDestructive={true}
      />
      <GlassConfirmModal
        isOpen={restoreConfirmOpen}
        onClose={() => {
          setRestoreConfirmOpen(false);
          setRestoreItemId(null);
        }}
        onConfirm={executeRestore}
        title="Restore Project?"
        message={`This will restore project "${storageStats?.deletedItems?.find(item => item._id === restoreItemId)?.originalId || ''}" back to active deployments. Active edge serving will resume immediately.`}
        confirmLabel="Restore"
        cancelLabel="Cancel"
        type="info"
        isDestructive={false}
      />

      <GlassConfirmModal
        isOpen={errorAlertOpen}
        onClose={() => {
          setErrorAlertOpen(false);
          setErrorAlertMsg('');
        }}
        title="Operation Error"
        message={errorAlertMsg}
        confirmLabel="OK"
        type="warning"
      />
    </div>
  );
}
