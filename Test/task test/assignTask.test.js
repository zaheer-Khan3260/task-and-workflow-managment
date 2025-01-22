const { ServerConfiguration } = require('../config.jest.js');
const TestJwtPayload = require('../testJwtPayload/testJwtPayload');

const mutation = `
  mutation UpdateTaskStatus($assignTaskId: ID!, $userIds: [ID!]!) {
    assignTask(id: $assignTaskId, userIds: $userIds) {
      id
      dueDate
      description
      title
      assignedUsers {
        role
        name
        id
        email
      }
      createdAt
      updatedAt
      versioning {
        currentVersion
      }
      status {
        currentStatus
      }
    }
  }
`;

const taskData = {
	assignTaskId: '678e46a0a9b0951fa4ee0d60',
	userIds: ['678a60e0034fe20b4406dbe4'],
};
describe('Assign Task', () => {
	let server;
	let testJwtPayload;

	beforeAll(() => {
		server = ServerConfiguration();
		testJwtPayload = new TestJwtPayload();
	});

	it('should assign a task to a user if exists as admin with JWT token and RBAC', async () => {
		const token = testJwtPayload.adminPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: taskData,
			})
			.set('Authorization', `Bearer ${token}`);

		console.log(response.body);
		expect(response.status).toBe(200);
		expect(response.body.data.assignTask.assignedUsers.length).toBe(1);
	});

	it('should assign a task to a user if user already assigned to the task as admin with JWT token and RBAC', async () => {
		const token = testJwtPayload.adminPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: taskData,
			})
			.set('Authorization', `Bearer ${token}`);

		console.log(response.body);
		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe(
			'User already assigned to the task'
		);
	});

	it('should assign a task to a user as project manager with JWT token and RBAC', async () => {
		const token = testJwtPayload.projectManagerPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: {
					assignTaskId: '678dfb9213f574d435d61a31',
					userIds: ['678b47d17ba85b8d3dc301f3'],
				},
			})
			.set('Authorization', `Bearer ${token}`);

		console.log(response.body);
		expect(response.status).toBe(200);
		expect(response.body.data.assignTask.assignedUsers.length).toBe(1);
	});

	it('should assign a task to a user as team lead with JWT token and RBAC', async () => {
		const token = testJwtPayload.teamLeadPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: {
					assignTaskId: '678dfb9213f574d435d61a31',
					userIds: ['678e1c7f04076800f7357997'],
				},
			})
			.set('Authorization', `Bearer ${token}`);

		console.log(response.body);
		expect(response.status).toBe(200);
		expect(response.body.data.assignTask.assignedUsers.length).toBe(2);
	});

	it('should assign a task to a user as team member with JWT token and RBAC', async () => {
		const token = testJwtPayload.teamMemberPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: taskData,
			})
			.set('Authorization', `Bearer ${token}`);

		console.log(response.body);
		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe(
			'Forbidden: You do not have permission to access assignTask route'
		);
	});
});
