import { Task } from '../../models/task.model.js';
import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import sanitizeHtml from 'sanitize-html';

export const taskResolvers = {
	Query: {
		// Fetch all tasks
		tasks: async (_, __, context) => {
			try {
				if (!context.user) {
					throw new ApiError(401, 'Unauthorized: Please log in');
				}

				const currentUser = await User.findById(context.user._id);
				if (!currentUser) {
					throw new ApiError(401, 'User not found');
				}

				if (currentUser.role === 'team_member') {
					const tasks = await Task.find({
						assignedUsers: currentUser._id,
					});
					if (tasks.length === 0) {
						throw new ApiError(
							404,
							'No tasks assigned to the current user'
						);
					}
					return tasks.map((task) => ({
						...task.toObject(),
						id: task._id.toString(),
					}));
				} else {
					const tasks = await Task.find();
					return tasks.map((task) => ({
						...task.toObject(),
						id: task._id.toString(),
					}));
				}
			} catch (error) {
				console.error('Error fetching tasks:', error);
				throw new ApiError(500, 'Failed to fetch tasks');
			}
		},
	},

	Mutation: {
		// Create a new task
		createTask: async (
			_,
			{
				title,
				description,
				dueDate,
				dependencies,
				parentTaskId,
				assignedUsers,
			},
			context
		) => {
			try {
				if (!context.user) {
					throw new ApiError(401, 'Unauthorized: Please log in');
				}

				const currentUser = await User.findById(context.user._id);
				if (!currentUser) {
					throw new ApiError(401, 'User not found');
				}
				if (
					currentUser.role !== 'admin' &&
					currentUser.role !== 'project_manager'
				) {
					throw new ApiError(
						403,
						'Forbidden: You do not have permission to create tasks'
					);
				}

				// Sanitize and validate inputs
				const sanitizedTitle = sanitizeHtml(title.trim());
				const sanitizedDescription = sanitizeHtml(description.trim());
				const sanitizedDueDate = new Date(dueDate);

				if (
					!sanitizedTitle ||
					!sanitizedDescription ||
					isNaN(sanitizedDueDate)
				) {
					throw new ApiError(
						400,
						'Invalid input: Title, description, and due date are required'
					);
				}

				if (sanitizedDueDate <= new Date()) {
					throw new ApiError(
						400,
						'Invalid input: Due date must be in the future'
					);
				}

				const validDependencies = await Task.find({
					_id: { $in: dependencies || [] },
				});
				const validParentTasks = await Task.find({
					_id: parentTaskId,
				});

				if (
					dependencies &&
					dependencies.length !== validDependencies.length
				) {
					throw new ApiError(
						400,
						'Invalid dependencies: Some tasks do not exist'
					);
				}

				if (!validParentTasks) {
					throw new ApiError(
						400,
						'Invalid parentTaskId: Some parent tasks do not exist'
					);
				}

				const validAssignedUsers = await User.find({
					_id: { $in: assignedUsers || [] },
				});
				if (
					assignedUsers &&
					assignedUsers.length !== validAssignedUsers.length
				) {
					throw new ApiError(
						400,
						'Invalid assigned users: Some users do not exist'
					);
				}

				const newTask = new Task({
					title: sanitizedTitle,
					description: sanitizedDescription,
					parentTaskId: validParentTasks,
					dependencies: validDependencies.map((task) => task._id),
					assignedUsers: validAssignedUsers.map((user) => user._id),
					status: { currentStatus: 'To Do', history: [] },
					versioning: { currentVersion: 1, history: [] },
					dueDate: sanitizedDueDate,
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				await newTask.save();

				return {
					...newTask.toObject(),
					id: newTask._id.toString(),
				};
			} catch (error) {
				console.error('Error creating task:', error);
				throw error instanceof ApiError
					? error
					: new ApiError(500, 'Failed to create task');
			}
		},

		// Update a task
		updateTask: async (_, { id, input }, context) => {
			try {
				// Check authentication
				if (!context.user) {
					throw new ApiError(401, 'Unauthorized: Please log in');
				}

				const currentUser = await User.findById(context.user._id);
				if (!currentUser) {
					throw new ApiError(401, 'User not found');
				}
				if (
					currentUser.role !== 'admin' &&
					currentUser.role !== 'project_manager'
				) {
					throw new ApiError(
						403,
						'Forbidden: You do not have permission to update tasks'
					);
				}

				// Find the task
				const task = await Task.findById(id);
				if (!task) {
					throw new ApiError(404, 'Task not found');
				}

				// Sanitize and update fields
				if (input.title) task.title = sanitizeHtml(input.title.trim());
				if (input.description)
					task.description = sanitizeHtml(input.description.trim());
				if (input.dueDate) {
					const dueDate = new Date(input.dueDate);
					if (isNaN(dueDate) || dueDate <= new Date()) {
						throw new ApiError(400, 'Invalid due date');
					}
					task.dueDate = dueDate;
				}

				// Update the task
				task.updatedAt = new Date();
				await task.save();

				return {
					...task.toObject(),
					id: task._id.toString(),
				};
			} catch (error) {
				console.error('Error updating task:', error);
				throw error instanceof ApiError
					? error
					: new ApiError(500, 'Failed to update task');
			}
		},

		updateTaskStatus: async (_, { id, status }, context) => {
			try {
				if (!context.user) {
					throw new ApiError(401, 'Unauthorized: Please log in');
				}

				const currentUser = await User.findById(context.user._id);
				if (!currentUser) {
					throw new ApiError(401, 'User not found');
				}
				if (
					currentUser.role !== 'admin' &&
					currentUser.role !== 'project_manager' &&
					currentUser.role !== 'team_lead'
				) {
					throw new ApiError(
						403,
						'Forbidden: You do not have permission to update task status'
					);
				}

				const task = await Task.findById(id);
				if (!task) {
					throw new ApiError(404, 'Task not found');
				}

				if (task.status.currentStatus === status) {
					return task;
				}

				task.status.history.push({
					status: status,
					changedAt: new Date(),
					changedBy: currentUser._id,
				});
				task.status.currentStatus = status;
				await task.save();

				return task;
			} catch (error) {
				console.error('Error updating task status:', error);
				throw error instanceof ApiError
					? error
					: new ApiError(500, 'Failed to update task status');
			}
		},

		// Delete a task
		deleteTask: async (_, { id }, context) => {
			try {
				// Check authentication
				if (!context.user) {
					throw new ApiError(401, 'Unauthorized: Please log in');
				}

				// Delete the task
				const currentUser = await User.findById(context.user._id);
				if (!currentUser) {
					throw new ApiError(401, 'User not found');
				}
				if (
					currentUser.role !== 'admin' &&
					currentUser.role !== 'project_manager' &&
					currentUser.role !== 'team_lead'
				) {
					throw new ApiError(
						403,
						'Forbidden: You do not have permission to delete tasks'
					);
				}

				const task = await Task.findByIdAndDelete(id);
				if (!task) {
					throw new ApiError(404, 'Task not found');
				}

				return { success: true, id };
			} catch (error) {
				console.error('Error deleting task:', error);
				throw error instanceof ApiError
					? error
					: new ApiError(500, 'Failed to delete task');
			}
		},

		assignTask: async (_, { id, assignedUsers }, context) => {
			try {
				if (!context.user) {
					throw new ApiError(401, 'Unauthorized: Please log in');
				}

				const currentUser = await User.findById(context.user._id);
				if (!currentUser) {
					throw new ApiError(401, 'User not found');
				}
				if (
					currentUser.role !== 'admin' &&
					currentUser.role !== 'project_manager' &&
					currentUser.role !== 'team_lead'
				) {
					throw new ApiError(
						403,
						'Forbidden: You do not have permission to assign tasks'
					);
				}

				const task = await Task.findById(id);
				if (!task) {
					throw new ApiError(404, 'Task not found');
				}

				task.assignedUsers = assignedUsers;
				await task.save();

				return task;
			} catch (error) {
				console.error('Error assigning task:', error);
				throw error instanceof ApiError
					? error
					: new ApiError(500, 'Failed to assign task');
			}
		},

		addDependency: async (_, { id, dependencyTaskId }, context) => {
			try {
				if (!context.user) {
					throw new ApiError(401, 'Unauthorized: Please log in');
				}

				const currentUser = await User.findById(context.user._id);
				if (!currentUser) {
					throw new ApiError(401, 'User not found');
				}
				if (
					currentUser.role !== 'admin' &&
					currentUser.role !== 'project_manager' &&
					currentUser.role !== 'team_lead'
				) {
					throw new ApiError(
						403,
						'Forbidden: You do not have permission to add dependencies'
					);
				}

				const task = await Task.findById(id);
				if (!task) {
					throw new ApiError(404, 'Task not found');
				}

				const dependencyTask = await Task.findById(dependencyTaskId);
				if (!dependencyTask) {
					throw new ApiError(404, 'Dependency task not found');
				}

				task.dependencies.push(dependencyTaskId);
				await task.save();

				return task;
			} catch (error) {
				console.error('Error adding dependency:', error);
				throw error instanceof ApiError
					? error
					: new ApiError(500, 'Failed to add dependency');
			}
		},
	},
};
