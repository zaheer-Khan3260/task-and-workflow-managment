import { ApiError } from '../utils/ApiError.js';

let permission = {
	project_manager: [
		'createTask',
		'updateTask',
		'updateTaskStatus',
		'addDependency',
		'assignTask',
	],
	team_lead: ['updateTaskStatus', 'addDependency', 'assignTask'],
	team_member: ['updateTaskStatus'],
};
const hasPermission = (userRole, route) => {
	if (userRole === 'admin') {
		return true;
	}
	if (permission[userRole]?.includes(route)) {
		return true;
	}
	throw new ApiError(
		403,
		`Forbidden: You do not have permission to access ${route} route`
	);
};

export { hasPermission };
