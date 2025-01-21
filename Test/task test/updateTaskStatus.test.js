const { ServerConfiguration } = require('../config.jest.js');
const TestJwtPayload = require('../testJwtPayload/testJwtPayload.js');

const taskData = {
	updateTaskStatusId: '678b531732c2c9ab26b37181',
	status: 'In Progress',
};

const mutation = `
    mutation UpdateTaskStatus($updateTaskStatusId: ID!, $status: String!) {
  updateTaskStatus(id: $updateTaskStatusId, status: $status) {
    id
    description
    dependencies {
      id
      dueDate
      status {
        currentStatus
      }
      title
      description
      assignedUsers {
        name
        email
        id
        role
      }
      updatedAt
    }
    title
    status {
      currentStatus
    }
    updatedAt
    dueDate
    assignedUsers {
      id
      email
      name
      role
    }
  }
}
`;

describe('updateTaskStatus', () => {
	let server;
	let testJwtPayload;

	beforeAll(() => {
		server = ServerConfiguration();
		testJwtPayload = new TestJwtPayload();
	});

	it('should update the status of a task with no dependencies as admin with JWT token and RBAC', async () => {
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
		expect(response.body.data.updateTaskStatus.status.currentStatus).toBe(
			taskData.status
		);
	});

	it('should update the status of a task with dependencies as admin with JWT token and RBAC', async () => {
		const token = testJwtPayload.adminPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: {
					updateTaskStatusId: '678b56a3ff4f1ad14bcd2cc6',
					status: 'Done',
				},
			})
			.set('Authorization', `Bearer ${token}`);

		console.log(response.body);
		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe(
			'Cannot update the status because some dependencies are not done'
		);
	});

	it('should update the status of a task with no dependencies as project manager with JWT token and RBAC', async () => {
		const token = testJwtPayload.projectManagerPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: {
					updateTaskStatusId: '678b531732c2c9ab26b37181',
					status: 'Done',
				},
			})
			.set('Authorization', `Bearer ${token}`);

		console.log(response.body);
		expect(response.status).toBe(200);
		expect(response.body.data.updateTaskStatus.status.currentStatus).toBe(
			'Done'
		);
	});

	it('should update the status of a task if dependencies are done as project manager with JWT token and RBAC', async () => {
		const token = testJwtPayload.projectManagerPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: {
					updateTaskStatusId: '678b56a3ff4f1ad14bcd2cc6',
					status: 'Done',
				},
			})
			.set('Authorization', `Bearer ${token}`);

		console.log(response.body);
		expect(response.status).toBe(200);
		expect(response.body.data.updateTaskStatus.status.currentStatus).toBe(
			'Done'
		);
	});

	it('should update the status of a task with no dependencies as team lead with JWT token and RBAC', async () => {
		const token = testJwtPayload.teamLeadPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: taskData,
			})
			.set('Authorization', `Bearer ${token}`);

		console.log(response.body);
		expect(response.status).toBe(200);
		expect(response.body.data.updateTaskStatus.status.currentStatus).toBe(
			taskData.status
		);
	});
	it('should update the status of a task with no dependencies as team member with JWT token and RBAC', async () => {
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
		expect(response.body.data.updateTaskStatus.status.currentStatus).toBe(
			taskData.status
		);
	});
});
