import React, { useState } from 'react';
import { 
  File, Folder, FolderOpen, FileCode, FileImage, Palette, FileText, 
  Search, Trash2, Edit2, Plus, FolderPlus, FilePlus2, ChevronRight, ChevronDown, X 
} from 'lucide-react';
import styles from './FileExplorer.module.css';

const getFileIcon = (fileName) => {
  const parts = fileName.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
  
  if (fileName.toLowerCase() === 'index.html') {
    return <FileCode size={16} style={{ color: '#e44d26' }} />;
  }
  if (ext === 'html') {
    return <FileCode size={16} style={{ color: '#f06529' }} />;
  }
  if (ext === 'css') {
    return <Palette size={16} style={{ color: '#30a9dc' }} />;
  }
  if (ext === 'js' || ext === 'jsx') {
    return <FileCode size={16} style={{ color: '#f7df1e' }} />;
  }
  if (ext === 'json') {
    return <FileCode size={16} style={{ color: 'var(--accent-secondary)' }} />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg'].includes(ext)) {
    return <FileImage size={16} style={{ color: '#10b981' }} />;
  }
  if (ext === 'md') {
    return <FileText size={16} style={{ color: '#38bdf8' }} />;
  }
  return <File size={16} style={{ color: '#94a3b8' }} />;
};

export default function FileExplorer({
  files = [],
  activeFile = null,
  onFileClick,
  onCreateResource,
  onDeleteResource,
  onRenameResource,
  searchQuery,
  onSearchChange,
  searchResults = [],
  onSearchResultClick
}) {
  const [expandedDirs, setExpandedDirs] = useState({ '': true }); // Track expanded directories by path
  const [newInput, setNewInput] = useState(null); // { parentPath, type: 'file'|'folder' }
  const [inputVal, setInputVal] = useState('');
  const [editingPath, setEditingPath] = useState(null); // Path of file/folder being renamed
  const [renameVal, setRenameVal] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Toggle directory expansion
  const toggleDir = (dirPath) => {
    setExpandedDirs(prev => ({
      ...prev,
      [dirPath]: !prev[dirPath]
    }));
  };

  // Show inline input to create file or folder
  const showCreateInput = (parentPath, type) => {
    setNewInput({ parentPath, type });
    setInputVal('');
    // Expand the parent directory so the input is visible
    if (parentPath) {
      setExpandedDirs(prev => ({ ...prev, [parentPath]: true }));
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) {
      setNewInput(null);
      return;
    }
    const cleanPath = newInput.parentPath 
      ? `${newInput.parentPath}/${inputVal.trim()}`
      : inputVal.trim();
      
    onCreateResource(cleanPath, newInput.type === 'folder');
    setNewInput(null);
    setInputVal('');
  };

  // Inline rename submit
  const handleRenameSubmit = (e, path) => {
    e.preventDefault();
    if (!renameVal.trim() || renameVal.trim() === path.split('/').pop()) {
      setEditingPath(null);
      return;
    }
    const parts = path.split('/');
    parts[parts.length - 1] = renameVal.trim();
    const newPath = parts.join('/');
    
    onRenameResource(path, newPath);
    setEditingPath(null);
    setRenameVal('');
  };

  // Render a single tree node (recursive)
  const renderNode = (node) => {
    const isDir = node.type === 'directory';
    const isExpanded = !!expandedDirs[node.path];
    const isActive = activeFile === node.path;
    const isRenameActive = editingPath === node.path;

    return (
      <div key={node.path} className={styles.treeNode}>
        <div 
          className={`${styles.nodeRow} ${isActive ? styles.nodeRowActive : ''}`}
          style={{ paddingLeft: `${node.path.split('/').length * 12}px` }}
        >
          {isDir ? (
            <button 
              type="button" 
              className={styles.chevronBtn}
              onClick={() => toggleDir(node.path)}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className={styles.indentSpacer}></span>
          )}

          <div 
            className={styles.nodeLabel}
            onClick={() => !isDir && onFileClick(node.path)}
          >
            {isDir ? (
              isExpanded ? <FolderOpen size={16} className={styles.folderIconOpen} /> : <Folder size={16} className={styles.folderIcon} />
            ) : (
              getFileIcon(node.name)
            )}

            {isRenameActive ? (
              <form 
                onSubmit={(e) => handleRenameSubmit(e, node.path)}
                className={styles.inlineForm}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  autoFocus
                  type="text"
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  onBlur={() => setEditingPath(null)}
                  className={styles.inlineInput}
                />
              </form>
            ) : (
              <span className={styles.nodeName}>{node.name}</span>
            )}
          </div>

          {!isRenameActive && (
            <div className={styles.nodeActions}>
              {isDir && (
                <>
                  <button 
                    type="button" 
                    title="New File"
                    onClick={() => showCreateInput(node.path, 'file')}
                  >
                    <FilePlus2 size={13} />
                  </button>
                  <button 
                    type="button" 
                    title="New Folder"
                    onClick={() => showCreateInput(node.path, 'folder')}
                  >
                    <FolderPlus size={13} />
                  </button>
                </>
              )}
              <button 
                type="button" 
                title="Rename"
                onClick={() => {
                  setEditingPath(node.path);
                  setRenameVal(node.name);
                }}
              >
                <Edit2 size={13} />
              </button>
              <button 
                type="button" 
                title="Delete"
                className={styles.deleteBtn}
                onClick={() => onDeleteResource(node.path)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Inline input for creating resources directly inside this folder */}
        {newInput && newInput.parentPath === node.path && (
          <div 
            className={styles.createInputRow}
            style={{ paddingLeft: `${(node.path.split('/').length + 1) * 12 + 14}px` }}
          >
            {newInput.type === 'folder' ? <Folder size={14} className={styles.folderIcon} /> : <File size={14} style={{ color: '#94a3b8' }} />}
            <form onSubmit={handleCreateSubmit} className={styles.inlineForm}>
              <input
                autoFocus
                type="text"
                placeholder={newInput.type === 'folder' ? 'Folder name...' : 'File name...'}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onBlur={() => setNewInput(null)}
                className={styles.inlineInput}
              />
            </form>
          </div>
        )}

        {isDir && isExpanded && node.children && (
          <div className={styles.subTree}>
            {node.children.map(renderNode)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.explorer}>
      <div className={styles.explorerHeader}>
        <span className={styles.explorerTitle}>WORKSPACE FILES</span>
        
        <div className={styles.headerButtons}>
          <button 
            type="button" 
            title="Create File in Root"
            onClick={() => showCreateInput('', 'file')}
          >
            <Plus size={14} />
            <span>File</span>
          </button>
          <button 
            type="button" 
            title="Create Folder in Root"
            onClick={() => showCreateInput('', 'folder')}
          >
            <FolderPlus size={14} />
            <span>Folder</span>
          </button>
        </div>
      </div>

      {/* Lexical search input */}
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search files / text..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsSearching(!!e.target.value);
            }}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button 
              type="button" 
              className={styles.clearSearchBtn}
              onClick={() => {
                onSearchChange('');
                setIsSearching(false);
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Main Files Display */}
      <div className={styles.filesSection}>
        {isSearching ? (
          <div className={styles.searchResults}>
            <div className={styles.resultsLabel}>SEARCH RESULTS</div>
            {searchResults.length === 0 ? (
              <p className={styles.noResults}>No search matches found.</p>
            ) : (
              searchResults.map(result => (
                <div 
                  key={result.path}
                  onClick={() => onSearchResultClick(result.path)}
                  className={styles.searchResultRow}
                >
                  <div className={styles.searchResultHeader}>
                    {getFileIcon(result.name)}
                    <span className={styles.resultPath}>{result.path}</span>
                  </div>
                  {result.snippets && result.snippets.map((snippet, sIdx) => (
                    <div key={sIdx} className={styles.searchSnippet}>
                      <span className={styles.snippetLine}>L{snippet.lineNumber}:</span>
                      <span className={styles.snippetText}>{snippet.text}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className={styles.fileTree}>
            {/* Inline creation input for root level */}
            {newInput && newInput.parentPath === '' && (
              <div className={styles.createInputRow} style={{ paddingLeft: '14px' }}>
                {newInput.type === 'folder' ? <Folder size={14} className={styles.folderIcon} /> : <File size={14} style={{ color: '#94a3b8' }} />}
                <form onSubmit={handleCreateSubmit} className={styles.inlineForm}>
                  <input
                    autoFocus
                    type="text"
                    placeholder={newInput.type === 'folder' ? 'Folder name...' : 'File name...'}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onBlur={() => setNewInput(null)}
                    className={styles.inlineInput}
                  />
                </form>
              </div>
            )}
            
            {files.length === 0 && !newInput ? (
              <div className={styles.emptyExplorer}>
                <p>This workspace is empty.</p>
                <p>Click "+" to create a file.</p>
              </div>
            ) : (
              files.map(renderNode)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
