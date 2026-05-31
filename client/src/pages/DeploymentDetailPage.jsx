import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, Zap, Copy, Check, ExternalLink, Cloud, Download, Layout, 
  RefreshCw, Terminal, ArrowLeft, AlertCircle, Lock, Loader2, Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import AppShell from '../components/common/AppShell';
import Button from '../components/ui/Button';
import GlassConfirmModal from '../components/ui/GlassConfirmModal';
import { useDeployments } from '../context/DeploymentContext';
import * as api from '../api/api';
import styles from './DeploymentDetailPage.module.css';

export default function DeploymentDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('preview'); // preview, logs
  
  const { removeDeployment, error: contextError } = useDeployments();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const justDeployed = location.state?.justDeployed || false;

  // 1. Fetch Deployment Details
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const response = await api.getDeployment(id);
        if (response.success) {
          setDeployment(response.data);
        } else {
          setError(response.error || 'Failed to load details');
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to fetch deployment details from cloud.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  // 2. Clipboard Copy Helper
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AppShell>
        <div className={styles.loadingState}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Retrieving server hosting parameters...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !deployment) {
    return (
      <AppShell>
        <div className={styles.errorState}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h2>Failed to Load Project</h2>
          <p>{error || 'The deployment you requested could not be located.'}</p>
          <Link to="/" className={styles.backBtn}>Back to Dashboard</Link>
        </div>
      </AppShell>
    );
  }

  const displayUrl = deployment.publicUrl.replace(/^https?:\/\//, '');

  const buildLogs = [
    { time: '14:55:01', msg: '[SYSTEM] WebHoster Build Container initialized.' },
    { time: '14:55:02', msg: '[RECEIVER] Receiving uploaded ZIP file archive...' },
    { time: '14:55:02', msg: `[ARCHIVE] Archive identified: "${deployment.originalFileName}" (${deployment.fileCount} files).` },
    { time: '14:55:03', msg: '[SECURITY] Scanning package structural integrity...' },
    { time: '14:55:03', msg: '[SECURITY] ZIP Slip prevention traversal validation: [PASSED]' },
    { time: '14:55:03', msg: '[SECURITY] Executable code verification scanners: [PASSED]' },
    { time: '14:55:04', msg: `[COMPILER] Deploying files to directory sandbox...` },
    { time: '14:55:04', msg: `[SCANNER] Scan: Found Entrypoint: "${deployment.indexFilePath}"` },
    { time: '14:55:05', msg: '[BACKUP] Synchronizing backup to ImageKit CDN...' },
    { time: '14:55:06', msg: `[BACKUP] ImageKit Backup successfully mounted: ID: ${deployment.backupFileId || 'N/A'}` },
    { time: '14:55:06', msg: '[LAUNCH] Instantiating dynamic hosting server ports...' },
    { time: '14:55:07', msg: '[SUCCESS] Hosting successfully established!' },
    { time: '14:55:07', msg: `[LINK] Public address: ${deployment.publicUrl}` },
  ];

  const pipelineStages = [
    { label: 'Initialize', desc: 'Initialize Node Server', duration: 0.1 },
    { label: 'Decompress', desc: 'Verify Sandboxing Slip Checks', duration: 0.3 },
    { label: 'Sync Backup', desc: 'ImageKit Cloud CDN Mount', duration: 0.5 },
    { label: 'Establish Link', desc: 'Exposing Route Endpoint', duration: 0.7 }
  ];

  return (
    <AppShell>
      <div className={styles.pageWrapper}>
        {justDeployed && (
          <motion.div 
            className={styles.successBanner}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.successBadgeContainer}>
              <CheckCircle size={14} className={styles.successBadgeIcon} />
              <span className={styles.successBadge}>DEPLOYMENT SUCCESSFUL</span>
            </div>
            <h2>Your website is live!</h2>
            <p>We've processed your static files and deployed them securely to our accelerated serving node.</p>
          </motion.div>
        )}

        <div className={styles.specsCard}>
          <div className={styles.specsHeader}>
            <div className={styles.titleArea}>
              <div className={styles.specsIcon}>
                <Zap size={24} className={styles.specsZapIcon} />
              </div>
              <div>
                <h1>{deployment.name}</h1>
                <p className={styles.specsMeta}>Subdomain: <span className={styles.mono}>{deployment.id}</span></p>
              </div>
            </div>

            <div className={styles.actionRow}>
              <Button 
                variant="secondary" 
                size="small"
                onClick={() => handleCopy(deployment.publicUrl)}
                icon={copied ? Check : Copy}
              >
                {copied ? 'Copied address' : 'Copy link'}
              </Button>

              <Button 
                variant="secondary" 
                size="small"
                onClick={() => window.open(`/project/${deployment.id}/edit`, '_blank')}
                icon={Zap}
                className={styles.ideEditorBtn}
              >
                IDE Editor
              </Button>
              
              <a 
                href={deployment.publicUrl} 
                target="_blank" 
                rel="noreferrer" 
                className={styles.visitBtn}
              >
                <ExternalLink size={14} />
                <span>Visit site</span>
              </a>
            </div>
          </div>

          {/* Staggered animated deploy pipeline indicators */}
          <div className={styles.specsGrid}>
            <div className={styles.specCell}>
              <span className={styles.cellLabel}>Serve Status</span>
              <span className={styles.activeLabel}>Active (Hosted)</span>
            </div>
            <div className={styles.specCell}>
              <span className={styles.cellLabel}>Assets Quantity</span>
              <span className={styles.cellVal}>{deployment.fileCount} static resources</span>
            </div>
            <div className={styles.specCell}>
              <span className={styles.cellLabel}>Root Entry</span>
              <span className={styles.cellVal}>{deployment.indexFilePath}</span>
            </div>
            <div className={styles.specCell}>
              <span className={styles.cellLabel}>Last Deploy</span>
              <span className={styles.cellVal}>{formatDate(deployment.createdAt)}</span>
            </div>
          </div>

          {/* Pipeline animation */}
          <div className={styles.pipelineContainer}>
            <div className={styles.pipelineTrack} />
            <div className={styles.pipelineStages}>
              {pipelineStages.map((stage, idx) => (
                <motion.div 
                  key={idx} 
                  className={styles.pipelineStage}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: stage.duration, type: 'spring' }}
                >
                  <div className={styles.stageDotActive}>
                    <Check size={10} />
                  </div>
                  <span className={styles.stageLabel}>{stage.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {deployment.backupUrl && (
            <div className={styles.cdnAlert}>
              <div className={styles.cdnInfo}>
                <div className={styles.cdnIcon}>
                  <Cloud size={18} />
                </div>
                <div>
                  <p className={styles.cdnTitle}>Accelerated serving active</p>
                  <p className={styles.cdnDesc}>Your original ZIP source is stored securely and accelerated globally via ImageKit CDN backup nodes.</p>
                </div>
              </div>
              <a href={deployment.backupUrl} target="_blank" rel="noreferrer" className={styles.cdnDownloadBtn}>
                <Download size={14} />
                <span>Download Source ZIP</span>
              </a>
            </div>
          )}
        </div>

        {/* Danger Zone Card - Minimalist premium SaaS Style */}
        <div className={styles.dangerZoneCard}>
          <div className={styles.dangerZoneHeader}>
            <div className={styles.dangerIconWrapper}>
              <AlertCircle size={18} className={styles.dangerIcon} />
            </div>
            <div className={styles.dangerZoneTitleSection}>
              <h3 className={styles.dangerZoneTitle}>Danger Zone</h3>
              <p className={styles.dangerZoneDesc}>Delete operations for this active static site deployment node.</p>
            </div>
          </div>
          <div className={styles.dangerZoneAction}>
            <p className={styles.dangerWarningText}>
              Move this project to the Recycle Bin. Active edge serving will cease, but files are held for 7 days before permanent disk erasure.
            </p>
            <Button
              variant="danger"
              size="small"
              onClick={() => {
                setDeleteError(null);
                setDeleteConfirmOpen(true);
              }}
              className={styles.deleteZoneBtn}
              loading={isDeleting}
            >
              Move to Recycle Bin
            </Button>
          </div>
        </div>

        {/* Dynamic tabs selector */}
        <div className={styles.tabsContainer}>
          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <Layout size={15} />
            <span>Sandbox Preview</span>
          </button>
          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === 'logs' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <Terminal size={15} />
            <span>Pipeline Logs</span>
          </button>
        </div>

        {/* Tab content bodies */}
        <section className={styles.tabContent}>
          {activeTab === 'preview' && (
            <div className={styles.browserContainer}>
              <div className={styles.browserHeader}>
                <div className={styles.browserDots}>
                  <span className={styles.dotRed}></span>
                  <span className={styles.dotYellow}></span>
                  <span className={styles.dotGreen}></span>
                </div>
                <div className={styles.browserAddressBar}>
                  <Lock size={12} className={styles.lockIcon} />
                  <span className={styles.addressText}>{displayUrl}</span>
                </div>
                <button type="button" className={styles.browserRefreshBtn} onClick={() => {
                  const iframe = document.getElementById('preview-frame');
                  if (iframe) iframe.src = iframe.src;
                }}>
                  <RefreshCw size={12} />
                </button>
              </div>

              <div className={styles.iframeWrapper}>
                {!isDeleting ? (
                  <iframe 
                    id="preview-frame"
                    src={deployment.publicUrl} 
                    title={deployment.name}
                    className={styles.previewIframe}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  ></iframe>
                ) : (
                  <div className={styles.iframeUnmountedState}>
                    <p>Releasing server hosting ports...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className={styles.logsConsole}>
              <div className={styles.consoleHeader}>
                <span className={styles.consoleTitle}>Build Logs Terminal</span>
                <span className={styles.consoleDot}></span>
              </div>
              <div className={styles.consoleBody}>
                {buildLogs.map((log, idx) => (
                  <div key={idx} className={styles.consoleRow}>
                    <span className={styles.logTime}>[{log.time}]</span>
                    <span className={styles.logMsg}>{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className={styles.footerRow}>
          <Link to="/" className={styles.backDashboardBtn}>
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      <GlassConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteError(null);
        }}
        onConfirm={async () => {
          setIsDeleting(true);
          setDeleteError(null);
          const success = await removeDeployment(id);
          setIsDeleting(false);
          if (success) {
            navigate('/');
          } else {
            const errMsg = contextError || 'Failed to move project to Recycle Bin. Please check if files are in use or try again.';
            setDeleteError(errMsg);
            throw new Error(errMsg);
          }
        }}
        title="Move to Recycle Bin?"
        message={deleteError ? (
          <div className={styles.modalErrorContainer}>
            <p className={styles.modalErrorText}>{deleteError}</p>
            <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Please try again. If the site is currently loading or active in another tab, closing it may release any file system locks.
            </p>
          </div>
        ) : (
          `This will cease edge serving and move "${deployment.name}" to your Recycle Bin (Trash). The folder will be held safely for 7 days, allowing you to restore it at any time from your Storage settings, before it undergoes permanent disk deletion.`
        )}
        confirmLabel="Move to Recycle Bin"
        cancelLabel="Cancel"
        type="danger"
        isDestructive={true}
      />
    </AppShell>
  );
}
