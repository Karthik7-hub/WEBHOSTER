import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeployments } from '../../context/DeploymentContext';
import { Search, Package, Globe, Copy, Check, ExternalLink, Trash2 } from 'lucide-react';
import styles from './DeploymentList.module.css';

export default function DeploymentList() {
  const { deployments, loading, removeDeployment } = useDeployments();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, files
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  // 1. Copy URL Helper
  const handleCopy = async (id, url, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
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

  // 3. Search and Sort Filter Algorithms
  const filteredDeployments = deployments
    .filter((d) => {
      const matchName = d.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchId = d.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchName || matchId;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === 'files') {
        return b.fileCount - a.fileCount;
      }
      return 0;
    });

  // 4. Safe Delete Trigger
  const handleDelete = async (id, name, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you absolutely sure you want to permanently delete the website "${name}"?`)) {
      await removeDeployment(id);
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
        <h2>Your Deployments</h2>
        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search deployments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="files">Most Files</option>
          </select>
        </div>
      </div>

      {filteredDeployments.length === 0 ? (
        <div className={styles.emptyCard}>
          <Package size={48} className={styles.emptyIcon} />
          <h3>No static hosting found</h3>
          <p>
            {searchTerm 
              ? 'No deployments match your search filter.' 
              : 'Upload a static site ZIP archive above to instantly see your hosted website list!'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredDeployments.map((deployment) => {
            // Strip http:// or https:// for clean visual presentation
            const displayUrl = deployment.publicUrl.replace(/^https?:\/\//, '');

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
                <div className={styles.cardBody}>
                  <div className={styles.cardHeader}>
                    <div className={styles.projectTitle}>
                      <h4>{deployment.name}</h4>
                      <span className={styles.projectId}>{deployment.id}</span>
                    </div>
                    
                    <span className={styles.statusBadge}>Active</span>
                  </div>

                  <div className={styles.cardMetrics}>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Resources:</span>
                      <span className={styles.metricVal}>{deployment.fileCount} files</span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Created:</span>
                      <span className={styles.metricVal}>{formatTime(deployment.createdAt)}</span>
                    </div>
                  </div>

                  <div className={styles.urlRow}>
                    <Globe size={14} className={styles.globeIcon} />
                    <span className={styles.urlText}>{displayUrl}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={(e) => handleCopy(deployment.id, deployment.publicUrl, e)}
                  >
                    {copiedId === deployment.id ? (
                      <>
                        <Check size={13} className={styles.copiedColor} />
                        <span className={styles.copiedColor}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  
                  <a
                    href={deployment.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.actionBtn} ${styles.primaryActionBtn}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={13} />
                    <span>Visit Site</span>
                  </a>

                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.deleteActionBtn}`}
                    onClick={(e) => handleDelete(deployment.id, deployment.name, e)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
