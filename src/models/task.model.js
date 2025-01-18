import mongoose, { Schema } from 'mongoose';

const taskSchema = new Schema(
	{
		title: {
			type: String,
			required: [true, 'Task title is required'],
			trim: true,
			minlength: [3, 'Task title must be at least 3 characters'],
			maxlength: [255, 'Task title must be at most 255 characters'],
		},
		description: {
			type: String,
			required: [true, 'Task description is required'],
			trim: true,
			minlength: [3, 'Task description must be at least 3 characters'],
			maxlength: [255, 'Task description must be at most 255 characters'],
		},
		parentTaskId: {
			type: Schema.Types.ObjectId,
			ref: 'Task',
		},

		status: {
			currentStatus: {
				type: String,
				enum: ['To Do', 'In Progress', 'Done'],
				default: 'To Do',
			},
			history: [
				{
					status: {
						type: String,
						enum: ['To Do', 'In Progress', 'Done'],
					},
					changedAt: {
						type: Date,
						default: Date.now,
					},
					changedBy: {
						type: Schema.Types.ObjectId,
						ref: 'User',
					},
				},
			],
		},
		assignedUsers: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		dependencies: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Task',
			},
		],
		versioning: {
			currentVersion: {
				type: Number,
				default: 1,
			},
			history: [
				{
					version: {
						type: Number,
					},
					changes: {
						type: String,
					},
					updatedAt: {
						type: Date,
						default: Date.now,
					},
					updatedBy: {
						type: Schema.Types.ObjectId,
						ref: 'User',
					},
				},
			],
		},
		dueDate: {
			type: Date,
			required: [true, 'Due date is required'],
		},
	},
	{ timestamps: true }
);

export const Task = mongoose.model('Task', taskSchema);
