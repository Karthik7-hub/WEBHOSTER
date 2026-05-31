import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Globe2, Activity, Server, Users, FolderKanban, FileCode2, Clock, Globe } from 'lucide-react';
import { useDeployments } from '../../context/DeploymentContext';
import * as api from '../../api/api';
import styles from './AnalyticsPanel.module.css';

export default function AnalyticsPanel() {
  const { deployments, loading: deploymentsLoading } = useDeployments();
  const [stats, setStats] = useState({ totalProjects: 0, totalFiles: 0, latestDeployAt: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.getPlatformStats();
        if (res.success && active) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch platform stats:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchStats();
    return () => {
      active = false;
    };
  }, [deployments]);

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Platform Performance Analytics</h2>
          <p className={styles.panelDesc}>Real-time edge serving statistics, bandwidth distribution, and node health records.</p>
        </div>
      </div>

      {/* Stats Counter Grids */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total Hosted Projects</span>
            <FolderKanban className={styles.metricIcon} size={16} />
          </div>
          <span className={styles.metricValue}>{loading ? '...' : stats.totalProjects}</span>
          <div className={styles.metricFooter}>
            <span className={styles.trendUp}>Active</span>
            <span className={styles.trendLabel}>projects online</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total Files Hosted</span>
            <FileCode2 className={styles.metricIcon} size={16} />
          </div>
          <span className={styles.metricValue}>{loading ? '...' : stats.totalFiles}</span>
          <div className={styles.metricFooter}>
            <span className={styles.trendUp}>Stored</span>
            <span className={styles.trendLabel}>on global CDN</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Last Deployment</span>
            <Clock className={styles.metricIcon} size={16} />
          </div>
          <span className={styles.metricValue}>{loading ? '...' : formatRelativeTime(stats.latestDeployAt)}</span>
          <div className={styles.metricFooter}>
            <span className={styles.trendDown}>Timestamp</span>
            <span className={styles.trendLabel}>{stats.latestDeployAt ? formatDate(stats.latestDeployAt) : 'No deployments'}</span>
          </div>
        </div>
      </div>

      {/* Deployments list table */}
      <div className={styles.chartsRow} style={{ gridTemplateColumns: '1fr' }}>
        <div className={styles.chartCard} style={{ height: 'auto', minHeight: '300px' }}>
          <h3 className={styles.chartTitle}>Project Deployments Breakdown</h3>
          
          {deploymentsLoading && deployments.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Loading project breakdown...
            </div>
          ) : deployments.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No deployed projects found. Upload a ZIP static site to see analytics.
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.analyticsTable}>
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>ID</th>
                    <th>Files</th>
                    <th>Deployment Link</th>
                    <th>Deployed At</th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.map((deployment) => (
                    <tr key={deployment.id}>
                      <td className={styles.projectName}>{deployment.name}</td>
                      <td>
                        <code className={styles.projectId}>{deployment.id}</code>
                      </td>
                      <td>
                        <span className={styles.fileCount}>{deployment.fileCount} files</span>
                      </td>
                      <td>
                        <a 
                          href={deployment.publicUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.projectLink}
                        >
                          <Globe size={12} />
                          <span>{deployment.publicUrl.replace(/^https?:\/\//, '')}</span>
                        </a>
                      </td>
                      <td className={styles.deployDate}>{formatDate(deployment.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
