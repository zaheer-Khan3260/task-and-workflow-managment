const { ServerConfiguration } = require('../config.jest.js');
const TestJwtPayload = require('../testJwtPayload/testJwtPayload.js');

const query = `
query Query {
  tasks {
    assignedUsers {
      email
      id
      name
      role
    }
    createdAt
    dependencies {
      id
      status {
        currentStatus
      }
      title
      description
    }
    description
    dueDate
    id
    parentTaskId {
      id
      title
      status {
        currentStatus
      }
      dueDate
      description
    }
    status {
      currentStatus
    }
    title
    updatedAt
    versioning {
      currentVersion
    }
  }
}
`;

describe('Fetch Task', () => {
	let server;
	let testJwtPayload;
	beforeAll(() => {
		server = ServerConfiguration();
		testJwtPayload = new TestJwtPayload();
	});

	it('should fetch all tasks as admin with JWT token and RBAC', async () => {
		// Generate JWT token
		let token = testJwtPayload.adminPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: query,
			})
			.set('Authorization', `Bearer ${token}`);

		console.log('Response:', response.body);
		expect(response.status).toBe(200);
		expect(response.body.data.tasks).toBeDefined();
	});

	it('should fetch all tasks as Project_Manager with JWT token and RBAC', async () => {
		// Generate JWT token
		const token = testJwtPayload.projectManagerPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: query,
			})
			.set('Authorization', `Bearer ${token}`);

		console.log('Response:', response.body);
		expect(response.status).toBe(200);
		expect(response.body.data.tasks).toBeDefined();
	});

	it('should fetch all tasks as Team_lead with JWT token and RBAC', async () => {
		// Generate JWT token
		const token = testJwtPayload.teamLeadPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: query,
			})
			.set('Authorization', `Bearer ${token}`);

		console.log('Response:', response.body);

		expect(response.status).toBe(200);
		expect(response.body.data.tasks).toBeDefined();
	});

	it('should fetch assigned tasks as team_member with JWT token and RBAC', async () => {
		// Generate JWT token
		const token = testJwtPayload.teamMemberPayload();

		const response = await server
			.post('/graphql')
			.send({
				query: query,
			})
			.set('Authorization', `Bearer ${token}`);

		console.log('Response:', response.body);
		expect(response.status).toBe(200);
		expect(response.body.data.tasks).toBeDefined();
	});
	it('should fetch tasks as team_member if no assigned tasks with JWT token and RBAC', async () => {
		// Generate JWT token
		const token = testJwtPayload.teamMemberPayload2();

		const response = await server
			.post('/graphql')
			.send({
				query: query,
			})
			.set('Authorization', `Bearer ${token}`);

		console.log('Response:', response.body);
		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe(
			'No tasks assigned to the current user'
		);
	});
});
