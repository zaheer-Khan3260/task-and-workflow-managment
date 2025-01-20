const { ServerConfiguration } = require('../config.jest.js');
const jwt = require('jsonwebtoken');

const taskData = {
	updateTaskId: '678e46a0a9b0951fa4ee0d60',
	input: {
		description: 'This is a updated test task',
		dueDate: new Date(
			new Date().getTime() + 12 * 60 * 60 * 60 * 1000
		).toISOString(),
		title: 'Updated Test Task',
	},
};

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
`;

describe('Update Task', () => {
	let server;

	beforeAll(() => {
		server = ServerConfiguration();
	});

	it('should update a task as admin with JWT token and RBAC', async () => {
		let token = jwt.sign(
			{
				_id: '678a60e0034fe20b4406dbe4',
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
		console.log(response);
		expect(response.status).toBe(200);
	});
});
