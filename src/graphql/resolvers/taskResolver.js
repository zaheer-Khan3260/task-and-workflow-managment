import { Task } from '../../models/task.model.js';
import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { logAudit } from '../../utils/auditLogger.js';
import { hasPermission } from '../../dependencies/hasPermission.js';
import sanitizeHtml from 'sanitize-html';

export const taskResolvers = {
	Query: {
		// Fetch all tasks
		tasks: async (_, __, context) => {
			try {
				if (!context.user) {
					throw new ApiError(401, 'Unauthorized: Please log in');
				}

				if (context.user.role === 'team_member') {
					const tasks = await Task.find({
						assignedUsers: context.user._id,
					});
					if (tasks.length === 0) {
						throw new ApiError(
							404,
							'No tasks assigned to the current user'
						);
					}
					logAudit(
						`Tag: Fetched Tasks || Fetched by: ${context.user.name} user_id: ${context.user._id} || task_count: ${tasks.length}`
					);
					return tasks.map((task) => ({
						...task.toObject(),
						id: task._id.toString(),
					}));
				}
				const tasks = await Task.find();
				logAudit(
					`Tag: Fetched Tasks || Fetched by: ${context.user.name} user_id: ${context.user._id} || task_count: ${tasks.length}`
				);
				return tasks.map((task) => ({
					...task.toObject(),
					id: task._id.toString(),
				}));
			} catch (error) {
				console.error('Error fetching tasks:', error);
				throw new ApiError(500, error.message);
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
				hasPermission(context.user.role, 'createTask');
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
				if (
					dependencies &&
					dependencies.length !== validDependencies.length
				) {
					throw new ApiError(
						400,
						'Invalid dependencies: Some tasks do not exist'
					);
				}

				const validParentTasks = await Task.find({
					_id: parentTaskId,
				});
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
					parentTaskId:
						validParentTasks.length > 0
							? validParentTasks[0]._id.toString()
							: null,
					dependencies:
						validDependencies.length > 0
							? validDependencies.map((task) =>
									task._id.toString()
							  )
							: [],
					assignedUsers:
						validAssignedUsers.length > 0
							? validAssignedUsers.map((user) =>
									user._id.toString()
							  )
							: [],
					status: { currentStatus: 'To Do', history: [] },
					versioning: { currentVersion: 1, history: [] },
					dueDate: sanitizedDueDate,
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				await newTask.save();
				logAudit(
					`Tag: Task created || task_id: ${newTask._id} || task_title: ${newTask.title} || task_description: ${newTask.description} || task_assignedUsers: ${newTask.assignedUsers}|| task_status: ${newTask.status}`
				);
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

				hasPermission(context.user.role, 'updateTask');

				// Find the task
				const task = await Task.findById(id);
				if (!task) {
					throw new ApiError(404, 'Task not found');
				}

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
				logAudit(
					`Tag: Task updated || task_id: ${task._id} || task_title: ${task.title} || task_description: ${task.description} || task_assignedUsers: ${task.assignedUsers} || task_status: ${task.status}`
				);
				return {
					...task.toObject(),
					id: task._id.toString(),
				};
			} catch (error) {
				console.error('Error updating task:', error);
				throw error instanceof ApiError
					? error
					: new ApiError(500, error.message);
			}
		},

		updateTaskStatus: async (_, { id, status }, context) => {
			try {
				if (!context.user) {
					throw new ApiError(401, 'Unauthorized: Please log in');
				}

				const task = await Task.findById(id).populate(
					'status.history.changedBy'
				);
				if (!task) {
					throw new ApiError(404, 'Task not found');
				}

				if (status === 'Done' || status === 'In Progress') {
					if (task.dependencies.length > 0) {
						const dependencyTasks = await Task.find({
							_id: { $in: task.dependencies },
							'status.currentStatus': { $ne: 'Done' },
						}).select('_id status.currentStatus');

						if (dependencyTasks.length > 0) {
							throw new ApiError(
								400,
								'Cannot update the status because some dependencies are not done'
							);
						}
					}
				}

				if (task.status.currentStatus === status) {
					return task;
				}

				task.status.history.unshift({
					status: task.status.currentStatus,
					changedAt: new Date(),
					changedBy: context.user,
				});
				task.status.currentStatus = status;
				await task.save();
				logAudit(
					`Tag: Updated Task Status || task_id: ${task._id} || task_title: ${task.title} || task_description: ${task.description} || task_assignedUsers: ${task.assignedUsers} || task_status: ${task.status.currentStatus}`
				);
				return task;
			} catch (error) {
				console.error('Error updating task status:', error);
				throw error instanceof ApiError
					? error
					: new ApiError(500, error.message);
			}
		},

		deleteTask: async (_, { id }, context) => {
			try {
				// Check authentication
				if (!context.user) {
					throw new ApiError(401, 'Unauthorized: Please log in');
				}

				hasPermission(context.user.role, 'deleteTask');

				const task = await Task.findByIdAndDelete(id);
				if (!task) {
					throw new ApiError(404, 'Task not found');
				}
				logAudit(
					`Tag: Deleted Task || task_id: ${task._id} || task_title: ${task.title} ||task_description: ${task.description} || task_assignedUsers: ${task.assignedUsers} || task_status: ${task.status}`
				);
				return { success: true, id };
			} catch (error) {
				console.error('Error deleting task:', error);
				throw error instanceof ApiError
					? error
					: new ApiError(500, error.message);
			}
		},

		assignTask: async (_, { id, userIds }, context) => {
			try {
				if (!context.user) {
					throw new ApiError(401, 'Unauthorized: Please log in');
				}

				hasPermission(context.user.role, 'assignTask');

				const task = await Task.findById(id).populate('assignedUsers');
				if (!task) {
					throw new ApiError(404, 'Task not found');
				}

				const assignedUserIds = task.assignedUsers.map((user) =>
					user._id.toString()
				);

				userIds.forEach((userId) => {
					if (assignedUserIds.includes(userId)) {
						console.log('userId: ', userId);
						throw new ApiError(
							400,
							'User already assigned to the task'
						);
					}
				});
				await Promise.all(
					userIds?.map(async (user) => {
						const newUser = await User.findById(user);
						if (newUser) {
							newUser.assignedTasks.push(task._id.toString());
							await newUser.save();
						}
						task.assignedUsers.push(newUser);
					})
				);
				await task.save();
				logAudit(
					`Tag: Assigned Task || task_id: ${task._id} || task_title: ${task.title} || task_description: ${task.description} || task_assignedUsers: ${task.assignedUsers} || task_status: ${task.status}`
				);
				return task;
			} catch (error) {
				console.error('Error assigning task:', error);
				throw error instanceof ApiError
					? error
					: new ApiError(500, error.message);
			}
		},

		addDependency: async (_, { id, dependencyTaskId }, context) => {
			try {
				if (!context.user) {
					throw new ApiError(401, 'Unauthorized: Please log in');
				}

				hasPermission(context.user.role, 'addDependency');
				const task = await Task.findById(id);
				if (!task) {
					throw new ApiError(404, 'Task not found');
				}

				if (task.dependencies.includes(dependencyTaskId)) {
					throw new ApiError(
						400,
						'This dependency is already added to the task'
					);
				}
				if (task._id.toString() === dependencyTaskId) {
					throw new ApiError(
						400,
						'Circular dependency detected: A task cannot depend on itself'
					);
				}
				const dependencyTask = await Task.findById(dependencyTaskId);
				if (!dependencyTask) {
					throw new ApiError(404, 'Dependency task not found');
				}

				task.dependencies.push(dependencyTaskId);
				await task.save();
				logAudit(
					`Tag: Added Dependency || task_id: ${task._id} || task_title: ${task.title} || task_description: ${task.description} || task_assignedUsers: ${task.assignedUsers} || task_status: ${task.status} `
				);
				return {
					...task.toObject(),
					id: task._id.toString(),
					dependencies: task.dependencies.map((dep) =>
						dep.toString()
					),
				};
			} catch (error) {
				console.error('Error adding dependency:', error);
				throw error instanceof ApiError
					? error
					: new ApiError(500, error.message);
			}
		},
	},

	Task: {
		assignedUsers: async (task) => {
			let assignedUsers = await User.find({
				_id: { $in: task.assignedUsers },
			});
			return assignedUsers.map((user) => ({
				id: user._id.toString(),
				name: user.name,
				email: user.email,
				role: user.role,
				status: user.status,
			}));
		},

		parentTaskId: async (task) => {
			return await Task.findById(task.parentTaskId);
		},

		dependencies: async (task) => {
			return await Task.find({ _id: { $in: task.dependencies } });
		},
	},
};
