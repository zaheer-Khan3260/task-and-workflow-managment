const { ServerConfiguration } = require('../config.jest.js');
const TestJwtPayload = require('../testJwtPayload/testJwtPayload');

const mutation = `
  mutation UpdateTaskStatus($deleteTaskId: ID!) {
    deleteTask(id: $deleteTaskId) {
      id
      success
    }
  }
`;

const taskData = {
	deleteTaskId: '67908da00f6160344ac678a4',
};

describe('Delete Task', () => {
	let server;
	let testJwtPayload;

	beforeAll(() => {
		server = ServerConfiguration();
		testJwtPayload = new TestJwtPayload();
	});

	it('should delete a task if exists as admin with JWT token and RBAC', async () => {
		const token = testJwtPayload.adminPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: taskData,
			})
			.set('Authorization', `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body.data.deleteTask.success).toBe(true);
	});

	it('should delete a task if not exists as admin with JWT token and RBAC', async () => {
		const token = testJwtPayload.adminPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: taskData,
			})
			.set('Authorization', `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe('Task not found');
	});
	it('should delete a task if exists as project manager with JWT token and RBAC', async () => {
		const token = testJwtPayload.projectManagerPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: taskData,
			})
			.set('Authorization', `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe(
			'Forbidden: You do not have permission to access deleteTask route'
		);
	});
	it('should delete a task if exists as team lead with JWT token and RBAC', async () => {
		const token = testJwtPayload.teamLeadPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: taskData,
			})
			.set('Authorization', `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe(
			'Forbidden: You do not have permission to access deleteTask route'
		);
	});
	it('should delete a task if exists as team member with JWT token and RBAC', async () => {
		const token = testJwtPayload.teamMemberPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: taskData,
			})
			.set('Authorization', `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe(
			'Forbidden: You do not have permission to access deleteTask route'
		);
	});
});
