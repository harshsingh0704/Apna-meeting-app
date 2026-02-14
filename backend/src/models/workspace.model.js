import mongoose, { Schema } from "mongoose";

const memberSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' }
}, { _id: false });

const workspaceSchema = new Schema({
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
}, { timestamps: true });

const Workspace = mongoose.model("Workspace", workspaceSchema);

export { Workspace };
