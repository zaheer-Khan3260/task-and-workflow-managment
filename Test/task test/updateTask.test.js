const { ServerConfiguration } = require('../config.jest.js');
const TestJwtPayload = require('../testJwtPayload/testJwtPayload.js');

// Task data for the mutation
const taskData = {
	updateTaskId: '678e46a0a9b0951fa4ee0d60',
	input: {
		description: 'This is an updated test task',
		dueDate: new Date(
			new Date().getTime() + 12 * 60 * 60 * 1000 // 12 hours from now
		).toISOString(),
		title: 'Updated Test Task',
	},
};

// GraphQL mutation
const mutation = `
  mutation UpdateTask($updateTaskId: ID!, $input: UpdateTaskInput!) {
    updateTask(
      id: $updateTaskId, input: $input
    ) {
      id
      dueDate
      status {
        currentStatus
      }
      updatedAt
      title
      description
    }
  }
`;

describe('Update Task', () => {
	let server;
	let testJwtPayload;

	// Initialize the server before running tests
	beforeAll(() => {
		server = ServerConfiguration();
		testJwtPayload = new TestJwtPayload();
	});

	it('should update a task as admin with JWT token and RBAC', async () => {
		// Generate JWT token
		const token = testJwtPayload.adminPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: taskData,
			})
			.set('Authorization', `Bearer ${token}`);

		console.log('Response:', response.body);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('data.updateTask');
		expect(response.body.data.updateTask).toMatchObject({
			id: taskData.updateTaskId,
			title: taskData.input.title,
			description: taskData.input.description,
		});
	});

	it('should update a task as Project_Manager with JWT token and RBAC', async () => {
		const token = testJwtPayload.projectManagerPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: taskData,
			})
			.set('Authorization', `Bearer ${token}`);

		console.log('Response:', response.body);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('data.updateTask');
		expect(response.body.data.updateTask).toMatchObject({
			id: taskData.updateTaskId,
			title: taskData.input.title,
			description: taskData.input.description,
		});
	});

	it('should update a task as team_lead with JWT token and RBAC', async () => {
		const token = testJwtPayload.teamLeadPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: taskData,
			})
			.set('Authorization', `Bearer ${token}`);

		console.log('Response:', response.body);

		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe(
			'Forbidden: You do not have permission to access updateTask route'
		);
	});

	it('should update a task as Project_Manager with JWT token and RBAC', async () => {
		const token = testJwtPayload.teamMemberPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: taskData,
			})
			.set('Authorization', `Bearer ${token}`);

		console.log('Response:', response.body);

		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe(
			'Forbidden: You do not have permission to access updateTask route'
		);
	});
});
