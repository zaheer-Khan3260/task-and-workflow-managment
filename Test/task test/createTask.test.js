const { ServerConfiguration } = require('../config.jest');
const TestJwtPayload = require('../testJwtPayload/testJwtPayload.js');
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
	let testJwtPayload;
	beforeAll(() => {
		server = ServerConfiguration();
		testJwtPayload = new TestJwtPayload();
	});

	it('should create a task as admin with JWT token and RBAC', async () => {
		const token = testJwtPayload.adminPayload();

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
		const token = testJwtPayload.projectManagerPayload();

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
			'Forbidden: You do not have permission to access createTask route'
		);
	});

	it('should not able to create a task as Team Member with JWT token and RBAC', async () => {
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
			'Forbidden: You do not have permission to access createTask route'
		);
	});
});
