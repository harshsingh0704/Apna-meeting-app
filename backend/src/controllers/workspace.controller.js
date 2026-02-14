import { Workspace } from '../models/workspace.model.js';
import { User } from '../models/user.model.js';
import asyncHandler from 'express-async-handler';

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
const createWorkspace = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const owner = req.user._id; // Assuming user is authenticated and req.user is populated

  if (!name) {
    res.status(400);
    throw new Error('Please provide a workspace name');
  }

  const workspace = await Workspace.create({
    name,
    owner,
    members: [{ user: owner, role: 'admin' }],
  });

  if (workspace) {
    res.status(201).json(workspace);
  } else {
    res.status(400);
    throw new Error('Invalid workspace data');
  }
});

// @desc    Get user's workspaces
// @route   GET /api/workspaces
// @access  Private
const getUserWorkspaces = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const workspaces = await Workspace.find({ 'members.user': userId }).populate('owner', 'name username').populate('members.user', 'name username');

  res.json(workspaces);
});

// @desc    Get workspace by ID
// @route   GET /api/workspaces/:id
// @access  Private
const getWorkspaceById = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.params.id).populate('owner', 'name username').populate('members.user', 'name username');

  if (workspace) {
    // Check if the user is a member of the workspace
    const isMember = workspace.members.some(member => member.user._id.equals(req.user._id));
    if (!isMember) {
      res.status(403);
      throw new Error('User is not a member of this workspace');
    }
    res.json(workspace);
  } else {
    res.status(404);
    throw new Error('Workspace not found');
  }
});

// @desc    Add user to workspace
// @route   POST /api/workspaces/:id/members
// @access  Private (Admin only)
const addUserToWorkspace = asyncHandler(async (req, res) => {
    const { userId, role } = req.body;
    const workspaceId = req.params.id;
    const requesterId = req.user._id;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
        res.status(404);
        throw new Error('Workspace not found');
    }

    // Check if the requester is an admin
    const adminMember = workspace.members.find(member => member.user.equals(requesterId) && member.role === 'admin');
    if (!adminMember) {
        res.status(403);
        throw new Error('Only admins can add users to the workspace');
    }

    const user = await User.findById(userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Check if user is already a member
    const isMember = workspace.members.some(member => member.user.equals(userId));
    if (isMember) {
        res.status(400);
        throw new Error('User is already a member of this workspace');
    }

    workspace.members.push({ user: userId, role: role || 'member' });
    await workspace.save();
    
    const updatedWorkspace = await Workspace.findById(workspaceId).populate('owner', 'name username').populate('members.user', 'name username');

    res.json(updatedWorkspace);
});


export {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  addUserToWorkspace,
};
