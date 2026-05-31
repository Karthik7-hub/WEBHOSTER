import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  ArrowLeft, Cloud, Check, Loader2, 
  Laptop, Globe, FolderOpen, History, Undo2, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FileExplorer from '../components/editor/FileExplorer';
import TabManager from '../components/editor/TabManager';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import * as api from '../api/api';
import GlassConfirmModal from '../components/ui/GlassConfirmModal';
import styles from './ProjectEditorPage.module.css';

const getFileLanguage = (filePath) => {
  const parts = filePath.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
  
  if (ext === 'html') return 'html';
  if (ext === 'css') return 'css';
  if (ext === 'js' || ext === 'jsx') return 'javascript';
  if (ext === 'json') return 'json';
  if (ext === 'md') return 'markdown';
  return 'plaintext';
};

export default function ProjectEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab & Editor States
  const [openTabs, setOpenTabs] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState({});
  const [saveStatus, setSaveStatus] = useState('Workspace saved'); 

  // Draft vs Live Status
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [rollbackConfirmOpen, setRollbackConfirmOpen] = useState(false);
  const [versionToRollback, setVersionToRollback] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Version History States
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Sidebar Panel State: 'explorer' or 'history'
  const [sidebarTab, setSidebarTab] = useState('explorer');

  // Command Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Layout View Controls
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768);

  // Custom Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, filePath: '' });

  // Toast States
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('info');

  const prevActiveFileRef = useRef(null);

  const showToast = (message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
  };

  const loadVersions = async () => {
    try {
      setVersionsLoading(true);
      const res = await api.getVersionHistory(id);
      if (res.success) {
        setVersions(res.data);
      }
    } catch (err) {
      console.error('Failed to load version history:', err);
    } finally {
      setVersionsLoading(false);
    }
  };

  // 1. Initial Load: Fetch Project, Files & Version Logs
  useEffect(() => {
    const initIDE = async () => {
      setLoading(true);
      try {
        const projRes = await api.getDeployment(id);
        if (projRes.success) {
          setProject(projRes.data);
        } else {
          setError(projRes.error || 'Failed to load project details');
          return;
        }

        const filesRes = await api.getFiles(id);
        if (filesRes.success) {
          setFiles(filesRes.data);
          
          const hasIndex = filesRes.data.some(f => f.name.toLowerCase() === 'index.html' && f.type === 'file');
          if (hasIndex) {
            handleFileOpen('index.html');
          } else if (filesRes.data.length > 0) {
            const firstFile = filesRes.data.find(f => f.type === 'file');
            if (firstFile) handleFileOpen(firstFile.path);
          }
        }

        await loadVersions();
      } catch (err) {
        console.error('Error initializing IDE:', err);
        setError(err.response?.data?.error || 'System failed to load project workspace.');
      } finally {
        setLoading(false);
      }
    };
    initIDE();
  }, [id]);

  // 2. Prevent Leaving with Unsaved Changes Guard
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnpublishedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnpublishedChanges]);

  const refreshFileTree = async () => {
    try {
      const res = await api.getFiles(id);
      if (res.success) {
        setFiles(res.data);
      }
    } catch (err) {
      console.error('Error refreshing files:', err);
    }
  };

  const handleFileOpen = async (filePath) => {
    if (activeFile === filePath) return;
    prevActiveFileRef.current = activeFile;
    
    try {
      const res = await api.getFileContent(id, filePath);
      if (res.success) {
        if (res.data.isBinary) {
          setEditorContent(`/* Binary asset: ${filePath} (${res.data.size} bytes) */\n/* To view media, verify in the live preview sandbox preview. */`);
        } else {
          setEditorContent(res.data.content);
        }
        
        setOpenTabs(prev => {
          if (prev.includes(filePath)) return prev;
          return [...prev, filePath];
        });
        setActiveFile(filePath);
      }
    } catch (err) {
      console.error('Error opening file content:', err);
      showToast('Failed to retrieve file contents', 'error');
    }
  };

  const handleTabClick = (filePath) => {
    handleFileOpen(filePath);
  };

  const handleTabClose = (filePath) => {
    const newTabs = openTabs.filter(t => t !== filePath);
    setOpenTabs(newTabs);

    if (activeFile === filePath) {
      if (newTabs.length > 0) {
        handleFileOpen(newTabs[newTabs.length - 1]);
      } else {
        setActiveFile(null);
        setEditorContent('');
      }
    }
  };

  const handleEditorChange = (value) => {
    if (activeFile) {
      setEditorContent(value);
      setUnsavedChanges(prev => ({ ...prev, [activeFile]: true }));
    }
  };

  // Debounced Auto-Save to Draft Workspace
  useEffect(() => {
    if (!activeFile || !unsavedChanges[activeFile]) return;
    setSaveStatus('Saving draft...');

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await api.saveFileContent(id, activeFile, editorContent);
        if (res.success) {
          setUnsavedChanges(prev => ({ ...prev, [activeFile]: false }));
          setSaveStatus('Draft workspace saved');
          setHasUnpublishedChanges(true); // Workspace is dirty relative to live deployment
        }
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('Failed to save draft');
        showToast('Auto-save draft compile failed', 'error');
      }
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [editorContent, activeFile]);

  const handleCreateResource = async (filePath, isFolder) => {
    try {
      const res = await api.createFileOrFolder(id, filePath, isFolder);
      if (res.success) {
        await refreshFileTree();
        setHasUnpublishedChanges(true);
        showToast(`${isFolder ? 'Folder' : 'File'} created inside drafts successfully!`, 'success');
        if (!isFolder) {
          await handleFileOpen(filePath);
        }
      }
    } catch (err) {
      console.error('Error creating resource:', err);
      showToast(err.response?.data?.error || 'Failed to create resource.', 'error');
    }
  };

  const handleDeleteResource = (filePath) => {
    setDeleteModal({ isOpen: true, filePath });
  };

  const confirmDeleteResource = async () => {
    const { filePath } = deleteModal;
    setDeleteModal({ isOpen: false, filePath: '' });

    try {
      const res = await api.deleteFileOrFolder(id, filePath);
      if (res.success) {
        await refreshFileTree();
        handleTabClose(filePath);
        setHasUnpublishedChanges(true);
        showToast('Resource deleted from draft workspace', 'success');
      }
    } catch (err) {
      console.error('Error deleting resource:', err);
      showToast(err.response?.data?.error || 'Failed to delete resource.', 'error');
    }
  };

  const handleRenameResource = async (oldPath, newPath) => {
    try {
      const res = await api.renameFileOrFolder(id, oldPath, newPath);
      if (res.success) {
        await refreshFileTree();
        setHasUnpublishedChanges(true);
        if (openTabs.includes(oldPath)) {
          setOpenTabs(prev => prev.map(t => t === oldPath ? newPath : t));
        }
        if (activeFile === oldPath) {
          setActiveFile(newPath);
        }
        showToast('Resource renamed in draft workspace', 'success');
      }
    } catch (err) {
      console.error('Error renaming resource:', err);
      showToast(err.response?.data?.error || 'Failed to rename resource.', 'error');
    }
  };

  // Search indexing debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      try {
        const res = await api.searchFiles(id, searchQuery);
        if (res.success) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.error('Search query failed:', err);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  // Publish Draft to Production
  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishSuccess(false);
    showToast('Compressing draft and initiating CDN release pipeline...', 'loading');
    try {
      const res = await api.publishDraft(id);
      if (res.success) {
        setProject(res.data);
        setHasUnpublishedChanges(false);
        setPublishSuccess(true);
        showToast('Live production build successfully updated!', 'success');
        await loadVersions(); // Refresh history
        setTimeout(() => setPublishSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Publish compilation failed:', err);
      showToast(err.response?.data?.error || 'CDN release compile failed!', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Rollback to historical version
  const handleRollback = (versionNumber) => {
    setVersionToRollback(versionNumber);
    setRollbackConfirmOpen(true);
  };

  const executeRollback = async () => {
    if (!versionToRollback) return;
    setIsRollingBack(true);
    showToast(`Downloading version ${versionToRollback} archive and rolling back environment...`, 'loading');
    try {
      const res = await api.rollbackToVersion(id, versionToRollback);
      if (res.success) {
        setHasUnpublishedChanges(false);
        showToast(`Workspace successfully rolled back to Version ${versionToRollback}!`, 'success');
        
        // Reload all data
        const projRes = await api.getDeployment(id);
        if (projRes.success) setProject(projRes.data);
        
        const filesRes = await api.getFiles(id);
        if (filesRes.success) {
          setFiles(filesRes.data);
          setOpenTabs([]);
          setActiveFile(null);
          setEditorContent('');
          
          const hasIndex = filesRes.data.some(f => f.name.toLowerCase() === 'index.html' && f.type === 'file');
          if (hasIndex) {
            handleFileOpen('index.html');
          } else if (filesRes.data.length > 0) {
            const firstFile = filesRes.data.find(f => f.type === 'file');
            if (firstFile) handleFileOpen(firstFile.path);
          }
        }
      }
    } catch (err) {
      console.error('Rollback failed:', err);
      showToast('Version rollback failed.', 'error');
    } finally {
      setIsRollingBack(false);
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader2 size={32} className={styles.spinner} />
        <p>Initializing Monaco Draft Sandboxes...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={styles.errorWrapper}>
        <AlertCircle size={44} style={{ color: '#ef4444' }} />
        <h2>Workspace Initialization Failed</h2>
        <p>{error || 'Project directory could not be located.'}</p>
        <Link to="/" className={styles.backBtn}><ArrowLeft size={16} /> Exit IDE</Link>
      </div>
    );
  }

  const livePreviewUrl = `${project.publicUrl}?preview=true`;

  return (
    <div className={styles.ideContainer}>
      
      {/* 1. Header Toolbar */}
      <header className={styles.ideHeader}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.backLink} title="Exit Workspace">
            <ArrowLeft size={16} />
          </Link>
          <div className={styles.projectNameSection}>
            <span className={styles.projectBadge}><Laptop size={11} /> Cloud IDE</span>
            <h1 className={styles.projectTitle}>{project.name}</h1>
            
            {hasUnpublishedChanges ? (
              <span className={styles.unpublishedIndicator} title="Changes are in draft. Click 'Publish' to go live.">
                <span className={styles.draftDot}></span>
                <span>Unsaved Draft</span>
              </span>
            ) : (
              <span className={styles.liveActiveIndicator}>
                <span className={styles.liveDot}></span>
                <span>Live Active</span>
              </span>
            )}
            
            <div className={styles.saveBadge}>
              <span>{saveStatus}</span>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button 
            type="button" 
            className={`${styles.toggleBtn} ${showSidebar ? styles.toggleBtnActive : ''}`}
            onClick={() => setShowSidebar(!showSidebar)}
            title="Toggle File Explorer & Rollbacks Sidebar"
          >
            Explorer
          </button>
          
          <button 
            type="button" 
            className={styles.urlLink}
            onClick={() => window.open(livePreviewUrl, '_blank')}
            title="Open sandboxed draft preview in a new tab"
          >
            <Globe size={13} style={{ color: '#f59e0b' }} />
            <span>Preview Draft</span>
          </button>

          <a 
            href={project.publicUrl} 
            target="_blank" 
            rel="noreferrer" 
            className={styles.urlLink}
            title="Open active production site in a new tab"
          >
            <Globe size={13} style={{ color: '#10b981' }} />
            <span>Live Site</span>
          </a>

          <Button 
            variant={publishSuccess ? 'secondary' : 'primary'}
            size="small"
            onClick={handlePublish}
            disabled={isPublishing}
            className={`${styles.publishBtn} ${publishSuccess ? styles.publishSuccess : ''}`}
            loading={isPublishing}
          >
            {publishSuccess ? (
              <>
                <Check size={14} />
                <span>Live Updated!</span>
              </>
            ) : (
              <>
                <Cloud size={14} />
                <span>Publish Changes</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* 2. Main IDE Workspace */}
      <div className={styles.workspaceBody}>
        
        {/* 2.1 Sidebar Panel */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside 
              className={styles.sidebar}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              {/* Sidebar Tab Header */}
              <div className={styles.sidebarHeaderTabs}>
                <button
                  type="button"
                  className={`${styles.sidebarTabBtn} ${sidebarTab === 'explorer' ? styles.sidebarTabActive : ''}`}
                  onClick={() => setSidebarTab('explorer')}
                >
                  <FolderOpen size={13} />
                  <span>Files</span>
                </button>
                <button
                  type="button"
                  className={`${styles.sidebarTabBtn} ${sidebarTab === 'history' ? styles.sidebarTabActive : ''}`}
                  onClick={() => setSidebarTab('history')}
                >
                  <History size={13} />
                  <span>Rollbacks</span>
                </button>
              </div>

              {/* Sidebar Body */}
              <div className={styles.sidebarBody}>
                {sidebarTab === 'explorer' ? (
                  <FileExplorer 
                    files={files}
                    activeFile={activeFile}
                    onFileClick={handleFileOpen}
                    onCreateResource={handleCreateResource}
                    onDeleteResource={handleDeleteResource}
                    onRenameResource={handleRenameResource}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchResults={searchResults}
                    onSearchResultClick={handleFileOpen}
                  />
                ) : (
                  <div className={styles.historyPanel}>
                    <div className={styles.historyHeader}>
                      <span>VERSION HISTORY</span>
                    </div>
                    {versionsLoading && versions.length === 0 ? (
                      <div className={styles.sidebarLoader}>
                        <Loader2 size={16} className={styles.spinner} />
                        <span>Querying history logs...</span>
                      </div>
                    ) : versions.length === 0 ? (
                      <p className={styles.emptyHistoryText}>No releases published yet. Click "Publish Changes" to deploy Version 1.</p>
                    ) : (
                      <div className={styles.versionsList}>
                        {versions.map((ver) => (
                          <div 
                            key={ver._id} 
                            className={`${styles.versionCard} ${
                              project.backupFileId === ver.backupFileId ? styles.versionActiveCard : ''
                            }`}
                          >
                            <div className={styles.versionMeta}>
                              <div className={styles.versionTitleRow}>
                                <span className={styles.versionNumber}>Version {ver.versionNumber}</span>
                                {project.backupFileId === ver.backupFileId && (
                                  <span className={styles.activeTag}>Active</span>
                                )}
                              </div>
                              <span className={styles.versionTime}>{formatDate(ver.createdAt)}</span>
                              <span className={styles.versionFiles}>{ver.fileCount} static resources</span>
                            </div>
                            
                            {project.backupFileId !== ver.backupFileId && (
                              <button
                                type="button"
                                className={styles.rollbackBtn}
                                onClick={() => handleRollback(ver.versionNumber)}
                                disabled={isRollingBack}
                              >
                                <Undo2 size={11} />
                                <span>Rollback</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* 2.2 Monaco Editor Area */}
        <main className={styles.editorArea}>
          <TabManager 
            openTabs={openTabs}
            activeFile={activeFile}
            onTabClick={handleTabClick}
            onTabClose={handleTabClose}
            unsavedChanges={unsavedChanges}
          />

          <div className={styles.monacoWrapper}>
            {activeFile ? (
              <Editor
                height="100%"
                language={getFileLanguage(activeFile)}
                theme="vs-dark"
                value={editorContent}
                onChange={handleEditorChange}
                options={{
                  fontSize: 13,
                  fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
                  minimap: { enabled: true },
                  automaticLayout: true,
                  wordWrap: 'on',
                  tabSize: 2,
                  padding: { top: 12 },
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  lineHeight: 20
                }}
              />
            ) : (
              <div className={styles.emptyEditor}>
                <Laptop size={36} className={styles.emptyIcon} />
                <h3>No Open Files</h3>
                <p>Select static resources in the sidebar tree explorer. Workspace files are debounced saved to drafts.</p>
              </div>
            )}
          </div>
        </main>


      </div>

      {/* Mobile Bottom Toolbar */}
      <div className={styles.mobileToolbar}>
        <button
          type="button"
          className={`${styles.toolbarBtn} ${showSidebar ? styles.toolbarBtnActive : ''}`}
          onClick={() => setShowSidebar(!showSidebar)}
          title="Toggle Sidebar explorer"
        >
          <FolderOpen size={18} />
          <span>Explorer</span>
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => window.open(livePreviewUrl, '_blank')}
          title="Preview Draft"
        >
          <Globe size={18} style={{ color: '#f59e0b' }} />
          <span>Preview</span>
        </button>
        <a
          href={project.publicUrl}
          target="_blank"
          rel="noreferrer"
          className={styles.toolbarBtn}
          title="Live Site"
        >
          <Globe size={18} style={{ color: '#10b981' }} />
          <span>Live Site</span>
        </a>
      </div>

      {/* 3. Global Toast System */}
      <AnimatePresence>
        {toastMessage && (
          <div className={styles.toastContainer}>
            <Toast 
              message={toastMessage} 
              type={toastType} 
              onClose={() => setToastMessage(null)} 
              duration={4000}
            />
          </div>
        )}
      </AnimatePresence>

      {/* 4. Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className={styles.modalOverlay} onClick={() => setDeleteModal({ isOpen: false, filePath: '' })}>
            <motion.div 
              className={styles.modalCard}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                <h3>Delete File?</h3>
              </div>
              <div className={styles.modalBody}>
                <p>Are you sure you want to delete <strong className={styles.highlightText}>{deleteModal.filePath.split('/').pop()}</strong> from draft workspace?</p>
                <p className={styles.modalSubText}>This action will immediately remove the resource and close its open editor tab.</p>
              </div>
              <div className={styles.modalFooter}>
                <Button 
                  variant="secondary" 
                  onClick={() => setDeleteModal({ isOpen: false, filePath: '' })}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={confirmDeleteResource}
                  className={styles.dangerBtn}
                >
                  Delete Resource
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GlassConfirmModal
        isOpen={rollbackConfirmOpen}
        onClose={() => {
          setRollbackConfirmOpen(false);
          setVersionToRollback(null);
        }}
        onConfirm={executeRollback}
        title="Rollback Version?"
        message={`Are you sure you want to rollback to Version ${versionToRollback}? This will overwrite all current draft and production files.`}
        confirmLabel="Rollback Version"
        cancelLabel="Cancel"
        type="warning"
        isDestructive={false}
      />
    </div>
  );
}
