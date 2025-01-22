import { Task } from '../../models/task.model.js';
import { User } from '../../models/user.model.js';
import authorizationHandler from '../../utils/authorizationHandler.js';
import { taskService } from '../../Service/taskService.js';

export const taskResolvers = {
	Query: {
		tasks: authorizationHandler(async (_, __, context) => {
			const task = await taskService.tasks(context.user);
			return task;
		}, []),

		getUserBasedOnStatus: authorizationHandler(
			async (_, { status, day, month, year, action, role }, context) => {
				const task = await taskService.getUserBasedOnStatus({
					status,
					day,
					month,
					year,
					action,
					role,
				});
				return task.user;
			},
			[]
		),

		getDayOrMonthWithMostTasksCreated: authorizationHandler(
			async (_, { action }, context) => {
				const task =
					await taskService.getDayOrMonthWithMostTasksCreated(action);
				return task;
			},
			[]
		),
		getDayOrMonthWithMostTasksCompleted: authorizationHandler(
			async (_, { action, role }, context) => {
				const task =
					await taskService.getDayOrMonthWithMostTasksCompleted(
						action,
						role
					);
				return task;
			},
			[]
		),
	},

	Mutation: {
		// Create a new task
		createTask: authorizationHandler(
			async (
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
				const task = await taskService.createTask({
					title,
					description,
					dueDate,
					dependencies,
					parentTaskId,
					assignedUsers,
				});

				return task;
			},
			[],
			'createTask'
		),

		// Update a task
		updateTask: authorizationHandler(
			async (_, { id, input }, context) => {
				const task = await taskService.updateTask({ id, input });
				return task;
			},
			[],
			'updateTask'
		),

		updateTaskStatus: authorizationHandler(
			async (_, { id, status }, context) => {
				const task = await taskService.updateTaskStatus(
					{ id, status },
					context.user
				);
				return task;
			},
			[],
			'updateTaskStatus'
		),

		deleteTask: authorizationHandler(
			async (_, { id }, context) => {
				const task = await taskService.deleteTask(id);
				return task;
			},
			[],
			'deleteTask'
		),
		assignTask: authorizationHandler(
			async (_, { id, userIds }, context) => {
				const task = await taskService.assignTask({ id, userIds });
				return task;
			},
			[],
			'assignTask'
		),

		addDependency: authorizationHandler(
			async (_, { id, dependencyTaskId }, context) => {
				const task = await taskService.addDependency({
					id,
					dependencyTaskId,
				});
				return task;
			},
			[],
			'addDependency'
		),
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
	User: {
		assignedTasks: async (user) => {
			return await Task.find({ assignedUsers: user._id });
		},
	},
};
