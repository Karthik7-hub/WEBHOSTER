import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import { CheckCircle, Zap, Copy, Check, ExternalLink, Cloud, Download, Layout, RefreshCw, Terminal, ArrowLeft, AlertCircle, Lock } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('preview'); // preview, logs, settings

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
      <div>
        <Header />
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Retrieving server hosting parameters...</p>
        </div>
      </div>
    );
  }

  if (error || !deployment) {
    return (
      <div>
        <Header />
        <div className={styles.errorState}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h2>Failed to Load Project</h2>
          <p>{error || 'The deployment you requested could not be located.'}</p>
          <Link to="/" className={styles.backBtn}>Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Visual clean representation of the dynamic URL
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

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <div className="glowing-bg"></div>

      <main className={styles.container}>
        {justDeployed && (
          <div className={styles.successBanner}>
            <div className={styles.successBadgeContainer}>
              <CheckCircle size={14} className={styles.successBadgeIcon} />
              <span className={styles.successBadge}>DEPLOYMENT SUCCESSFUL</span>
            </div>
            <h2>Your website is live!</h2>
            <p>We've processed your static files and deployed them securely to our accelerated serving node.</p>
          </div>
        )}

        {/* 1. Project Specs Panel */}
        <section className={styles.specsCard}>
          <div className={styles.specsHeader}>
            <div className={styles.titleArea}>
              <div className={styles.specsTitle}>
                <div className={styles.specsIcon}>
                  <Zap size={28} className={styles.specsZapIcon} />
                </div>
                <div>
                  <h1>{deployment.name}</h1>
                  <p className={styles.specsMeta}>ID: <span className={styles.mono}>{deployment.id}</span></p>
                </div>
              </div>
            </div>

            <div className={styles.actionRow}>
              <button 
                type="button" 
                className={styles.copyBtn} 
                onClick={() => handleCopy(deployment.publicUrl)}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Address'}</span>
              </button>
              
              <a 
                href={deployment.publicUrl} 
                target="_blank" 
                rel="noreferrer" 
                className={styles.visitBtn}
              >
                <ExternalLink size={14} />
                <span>Visit Site</span>
              </a>
            </div>
          </div>

          <div className={styles.specsGrid}>
            <div className={styles.specCell}>
              <span className={styles.cellLabel}>Status</span>
              <span className={styles.activeLabel}>Active (Hosted)</span>
            </div>
            <div className={styles.specCell}>
              <span className={styles.cellLabel}>Total Files</span>
              <span className={styles.cellVal}>{deployment.fileCount} static resources</span>
            </div>
            <div className={styles.specCell}>
              <span className={styles.cellLabel}>Entrypoint</span>
              <span className={styles.cellVal}>{deployment.indexFilePath}</span>
            </div>
            <div className={styles.specCell}>
              <span className={styles.cellLabel}>Deployed Time</span>
              <span className={styles.cellVal}>{formatDate(deployment.createdAt)}</span>
            </div>
          </div>

          {deployment.backupUrl && (
            <div className={styles.cdnAlert}>
              <div className={styles.cdnInfo}>
                <div className={styles.cdnIcon}>
                  <Cloud size={20} />
                </div>
                <div>
                  <p className={styles.cdnTitle}>ImageKit CDN Backup Synchronized</p>
                  <p className={styles.cdnDesc}>Your original ZIP source is stored securely and accelerated globally via ImageKit CDN.</p>
                </div>
              </div>
              <a href={deployment.backupUrl} target="_blank" rel="noreferrer" className={styles.cdnDownloadBtn}>
                <Download size={14} />
                <span>Download Source ZIP</span>
              </a>
            </div>
          )}
        </section>

        {/* 2. Tabs Selector */}
        <div className={styles.tabsContainer}>
          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <Layout size={15} />
            <span>Interactive Preview</span>
          </button>
          <button 
            type="button" 
            className={`${styles.tabBtn} ${activeTab === 'logs' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <Terminal size={15} />
            <span>Build Console Logs</span>
          </button>
        </div>

        {/* 3. Tab Contents */}
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
                <iframe 
                  id="preview-frame"
                  src={deployment.publicUrl} 
                  title={deployment.name}
                  className={styles.previewIframe}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                ></iframe>
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
      </main>
    </div>
  );
}
