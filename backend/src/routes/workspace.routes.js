import express from 'express';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  addUserToWorkspace,
} from '../controllers/workspace.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/').post(auth, createWorkspace).get(auth, getUserWorkspaces);
router.route('/:id').get(auth, getWorkspaceById);
router.route('/:id/members').post(auth, addUserToWorkspace);

export default router;
