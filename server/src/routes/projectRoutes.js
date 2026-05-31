const express = require('express');
const router = express.Router();
const controller = require('../controllers/projectController');
const requireAdminAuth = require('../middleware/authMiddleware');

// Protect all IDE routes
router.use(requireAdminAuth);

// Project Management & Publishing
router.post('/create', controller.createProject);
router.post('/:id/deploy', controller.deployProject); // Legacy redeploy direct option
router.post('/:id/publish', controller.publishDraftChanges); // Draft publishing
router.get('/:id/versions', controller.getVersionHistory);   // Versions retrieval
router.post('/:id/rollback', controller.rollbackToVersion);   // Rollback to historical version
router.get('/:id/search', controller.searchFiles);

// File Virtual Operations
router.get('/:id/files', controller.getFiles);
router.get('/:id/files/content', controller.getFileContent);
router.put('/:id/files/content', controller.saveFile);
router.post('/:id/files/create', controller.createFileOrFolder);
router.delete('/:id/files/delete', controller.deleteFileOrFolder);
router.post('/:id/files/rename', controller.renameFileOrFolder);

module.exports = router;

