const { ServerConfiguration } = require('../config.jest');
const jwt = require('jsonwebtoken');

// Task data
const taskData = {
	title: 'Test Task',
	description: 'This is a test task',
	assignedUsers: ['678b47d17ba85b8d3dc301f3'],
	dueDate: new Date(new Date().getTime() + 12 * 60 * 60 * 1000).toISOString(),
};

const mutation = `
  mutation CreateTask($title: String!, $description: String!, $dueDate: String!, $assignedUsers: [ID]!) {
    createTask(
      title: $title,
      description: $description,
      dueDate: $dueDate,
      assignedUsers: $assignedUsers,
    ) {
      id
      dueDate
      description
      status {
        currentStatus
      }
      title
      assignedUsers
      dependencies
      createdAt
      parentTaskId
      updatedAt
      versioning {
        currentVersion
      }
    }
  }
`;

describe('Create Task', () => {
	let server;

	beforeAll(() => {
		server = ServerConfiguration();
	});

	it('should create a task as admin with JWT token and RBAC', async () => {
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

		expect(response.status).toBe(200);
		expect(response.body.data.createTask.title).toBe(taskData.title);
		expect(response.body.data.createTask.description).toBe(
			taskData.description
		);
	});

	it('should create a task as Project Manager with JWT token and RBAC', async () => {
		let token = jwt.sign(
			{
				_id: '678b5b872d3db633dd08bd48',
				name: 'test',
				role: 'project_manager',
				email: 'test6@gmail.com',
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

		expect(response.status).toBe(200);
		expect(response.body.data.createTask.title).toBe(taskData.title);
		expect(response.body.data.createTask.description).toBe(
			taskData.description
		);
	});

	it('should not able to create a task as Team Lead with JWT token and RBAC', async () => {
		let token = jwt.sign(
			{
				_id: '678a6138034fe20b4406dbe8',
				name: 'test',
				role: 'team_leader',
				email: 'test2@gmail.com',
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

		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe(
			'Forbidden: You do not have permission to access createTask route'
		);
	});

	it('should not able to create a task as Team Member with JWT token and RBAC', async () => {
		let token = jwt.sign(
			{
				_id: '678b47874bc3ddd8cfcc1c4d',
				name: 'test',
				role: 'team_member',
				email: 'test4@gmail.com',
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

		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe(
			'Forbidden: You do not have permission to access createTask route'
		);
	});
});
