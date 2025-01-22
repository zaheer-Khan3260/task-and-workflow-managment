import { Task } from '../models/task.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from '../utils/auditLogger.js';
import sanitizeHtml from 'sanitize-html';

class taskServices {
	async tasks(user) {
		if (user.role === 'team_member') {
			const tasks = await Task.find({
				assignedUsers: user._id,
			});
			if (tasks.length === 0) {
				throw new ApiError(
					404,
					'No tasks assigned to the current user'
				);
			}
			logAudit(
				`Tag: Fetched Tasks || Fetched by: ${user.name} user_id: ${user._id} || task_count: ${tasks.length}`
			);
			return tasks.map((task) => ({
				...task.toObject(),
				id: task._id.toString(),
			}));
		}
		const tasks = await Task.find();
		logAudit(
			`Tag: Fetched Tasks || Fetched by: ${user.name} user_id: ${user._id} || task_count: ${tasks.length}`
		);
		return tasks.map((task) => ({
			...task.toObject(),
			id: task._id.toString(),
		}));
	}
	async createTask(taskData) {
		const {
			title,
			description,
			dueDate,
			dependencies,
			parentTaskId,
			assignedUsers,
		} = taskData;
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
		if (dependencies && dependencies.length !== validDependencies.length) {
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
					? validDependencies.map((task) => task._id.toString())
					: [],
			assignedUsers:
				validAssignedUsers.length > 0
					? validAssignedUsers.map((user) => user._id.toString())
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
	}

	async updateTask(taskData) {
		const { id, input } = taskData;
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

		task.updatedAt = new Date();
		await task.save();
		logAudit(
			`Tag: Task updated || task_id: ${task._id} || task_title: ${task.title} || task_description: ${task.description} || task_assignedUsers: ${task.assignedUsers} || task_status: ${task.status}`
		);
		return {
			...task.toObject(),
			id: task._id.toString(),
		};
	}

	async updateTaskStatus(taskData, user) {
		const { id, status } = taskData;

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
			changedBy: user,
		});
		task.status.currentStatus = status;
		await task.save();
		logAudit(
			`Tag: Updated Task Status || task_id: ${task._id} || task_title: ${task.title} || task_description: ${task.description} || task_assignedUsers: ${task.assignedUsers} || task_status: ${task.status.currentStatus}`
		);
		return task;
	}

	async deleteTask(id) {
		const task = await Task.findByIdAndDelete(id);
		if (!task) {
			throw new ApiError(404, 'Task not found');
		}
		logAudit(
			`Tag: Deleted Task || task_id: ${task._id} || task_title: ${task.title} ||task_description: ${task.description} || task_assignedUsers: ${task.assignedUsers} || task_status: ${task.status}`
		);
		return { success: true, id };
	}

	async assignTask(taskData) {
		const { id, userIds } = taskData;
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
				throw new ApiError(400, 'User already assigned to the task');
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
	}

	async addDependency(taskData) {
		const { id, dependencyTaskId } = taskData;
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
			dependencies: task.dependencies.map((dep) => dep.toString()),
		};
	}

	async getUserBasedOnStatus(data) {
		const { role, status, year, month, day, action } = data;
		let aggregationData = [];

		aggregationData.push({ $match: { 'status.currentStatus': status } });

		if (year || month || day) {
			const dateMatch = {};
			if (year) {
				dateMatch.$expr = { $eq: [{ $year: '$createdAt' }, year] };
			}
			if (month) {
				dateMatch.$expr = {
					...(dateMatch.$expr || {}),
					$eq: [{ $month: '$createdAt' }, month],
				};
			}
			if (day) {
				dateMatch.$expr = {
					...(dateMatch.$expr || {}),
					$eq: [{ $dayOfMonth: '$createdAt' }, day],
				};
			}
			aggregationData.push({ $match: dateMatch });
		}

		aggregationData.push({
			$group: {
				_id: '$assignedUsers',
				count: { $sum: 1 },
			},
		});

		aggregationData.push({
			$sort: { count: action === 'most' ? -1 : 1 },
		});

		aggregationData.push({
			$lookup: {
				from: 'users',
				localField: '_id',
				foreignField: '_id',
				as: 'user',
			},
		});

		aggregationData.push({ $unwind: '$user' });

		if (role) {
			aggregationData.push({ $match: { 'user.role': role } });
		}

		const result = await Task.aggregate(aggregationData);

		if (result.length === 0) {
			throw new ApiError(404, 'No user found for the given criteria.');
		}

		return result[0];
	}

	async getDayOrMonthWithMostTasksCreated(action) {
		if (action !== 'day' && action !== 'month') {
			throw new ApiError(400, 'Invalid action');
		}

		const groupField =
			action === 'day'
				? { $dayOfMonth: '$createdAt' }
				: { $month: '$createdAt' };

		const aggregationPipeline = [
			{
				$group: {
					_id: groupField,
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: -1 } },
			{ $limit: 1 },
		];

		const result = await Task.aggregate(aggregationPipeline);

		if (result.length === 0) {
			return { message: 'No tasks found.' };
		}

		const mostCreated = result[0];

		return action === 'month'
			? new Date(0, mostCreated._id - 1).toLocaleString('default', {
					month: 'long',
			  })
			: `Day ${mostCreated._id}`;
	}

	async getDayOrMonthWithMostTasksCompleted(action, role) {
		if (action !== 'day' && action !== 'month') {
			throw new ApiError(400, 'Invalid action');
		}

		const tasks = await Task.find({ 'status.currentStatus': 'Done' })
			.populate('assignedUsers')
			.exec();

		const getDatePart = (date) =>
			action === 'day'
				? new Date(date).getDate()
				: new Date(date).getMonth();

		const hashmap = {};

		tasks
			.filter(
				(task) =>
					!role ||
					task.assignedUsers.some((user) => user.role === role)
			)
			.forEach((task) => {
				const datePart = getDatePart(task.status.history[0].changedAt);
				hashmap[datePart] = (hashmap[datePart] || 0) + 1;
			});

		let mostFrequent = Object.entries(hashmap).reduce(
			(acc, [key, count]) => (count > acc.count ? { key, count } : acc),
			{ key: null, count: 0 }
		);
		console.log('mostFrequent: ', mostFrequent);
		return action === 'month'
			? new Date(0, mostFrequent.key).toLocaleString('default', {
					month: 'long',
			  })
			: `Day ${mostFrequent.key}`;
	}
}

export const taskService = new taskServices();
