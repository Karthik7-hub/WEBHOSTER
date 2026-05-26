import React, { useState, useRef } from 'react';
import { useDeployments } from '../../context/DeploymentContext';
import { FolderArchive, AlertCircle, X } from 'lucide-react';
import styles from './UploadZone.module.css';

export default function UploadZone({ onUploadSuccess }) {
  const { uploadAndDeploy, isUploading, uploadProgress } = useDeployments();
  const [isDragActive, setIsDragActive] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // 1. File Type and Size Pre-validation
  const validateFile = (file) => {
    setLocalError(null);
    
    if (!file) return false;

    // Check extension
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'zip') {
      setLocalError('Invalid Format: Only compressed ZIP files (.zip) are allowed.');
      return false;
    }

    // Check file size (20MB Max)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setLocalError('Limit Exceeded: ZIP file must be smaller than 20MB.');
      return false;
    }

    return true;
  };

  // 2. Drag & Drop Event Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        handleUpload(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        handleUpload(file);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  // 3. Initiate Safe Upload
  const handleUpload = async (file) => {
    try {
      const result = await uploadAndDeploy(file);
      setSelectedFile(null);
      if (onUploadSuccess && result) {
        onUploadSuccess(result);
      }
    } catch (err) {
      console.error(err);
      setLocalError(err.message || 'Deployment failed. Please check your ZIP file.');
      setSelectedFile(null);
    }
  };

  return (
    <div className={styles.uploadCard}>
      <form 
        className={`${styles.dropZone} ${isDragActive ? styles.active : ''} ${isUploading ? styles.uploading : ''}`} 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={!isUploading ? onButtonClick : undefined}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className={styles.fileInput} 
          accept=".zip" 
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className={styles.progressContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.spinner}></div>
            <p className={styles.progressTitle}>Hosting static resources...</p>
            <p className={styles.progressSub}>Extracting and backing up folder</p>
            
            <div className={styles.progressBarBg}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${uploadProgress || 0}%` }}
              ></div>
            </div>
            <span className={styles.progressPercent}>{uploadProgress || 0}%</span>
          </div>
        ) : (
          <div className={styles.idleContainer}>
            <div className={styles.uploadIconContainer}>
              <FolderArchive size={32} className={styles.uploadIcon} />
            </div>
            <h3>Drag & drop ZIP file here</h3>
            <p className={styles.separator}>or</p>
            <button type="button" className={styles.selectBtn}>Browse Files</button>
            <p className={styles.limitInfo}>Accepts ZIP containing index.html (Max 20MB)</p>
          </div>
        )}
      </form>

      {localError && (
        <div className={styles.errorAlert}>
          <AlertCircle size={20} className={styles.errorIcon} />
          <div className={styles.errorText}>
            <p className={styles.errorTitle}>Upload Error</p>
            <p className={styles.errorDesc}>{localError}</p>
          </div>
          <button className={styles.errorClose} onClick={() => setLocalError(null)}>
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
