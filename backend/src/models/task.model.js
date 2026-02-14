import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema({
  description: { type: String, required: true },
  workspace: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  status: { type: String, enum: ['todo', 'done'], default: 'todo' },
  assignee: { type: Schema.Types.ObjectId, ref: 'User' },
  dueDate: { type: Date },
  meeting: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
}, { timestamps: true });

const Task = mongoose.model("Task", taskSchema);

export { Task };
