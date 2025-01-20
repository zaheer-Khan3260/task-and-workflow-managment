const { ServerConfiguration } = require('../config.jest.js');
const jwt = require('jsonwebtoken');

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

	// Initialize the server before running tests
	beforeAll(() => {
		server = ServerConfiguration();
	});

	it('should update a task as admin with JWT token and RBAC', async () => {
		// Generate JWT token
		const token = jwt.sign(
			{
				_id: '678a60e0034fe20b4406dbe4', // Example user ID
				name: 'test',
				role: 'admin',
				email: 'test1@gmail.com',
			},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1d' }
		);

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
});
