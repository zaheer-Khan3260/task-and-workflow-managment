const { ServerConfiguration } = require('../config.jest.js');
const TestJwtPayload = require('../testJwtPayload/testJwtPayload.js');

const mutation = `
  mutation UpdateTaskStatus($addDependencyId: ID!, $dependencyTaskId: ID!) {
    addDependency(id: $addDependencyId, dependencyTaskId: $dependencyTaskId) {
      id
      dependencies {
        id
        description
        status {
          currentStatus
        }
        title
      }
      status {
        currentStatus
      }
      title
      description
    }
  }
`;

const taskData = {
	addDependencyId: '678ded6e80cbfb55ce4d02f7',
	dependencyTaskId: '678ded163e2afccb335d481b',
};

describe('Add Dependency', () => {
	let server;
	let testJwtPayload;

	beforeAll(() => {
		server = ServerConfiguration();
		testJwtPayload = new TestJwtPayload();
	});

	it('should add a dependency to a task as admin with JWT token and RBAC', async () => {
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
		expect(response.body.data.addDependency.dependencies.length).toBe(1);
	});
	it('should add a dependency to a task if it is already added as admin with JWT token and RBAC', async () => {
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
			'This dependency is already added to the task'
		);
	});

	it('should add a dependency to a task if it is already added as admin with JWT token and RBAC', async () => {
		const token = testJwtPayload.adminPayload();
		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: {
					addDependencyId: '678ded6e80cbfb55ce4d02f7',
					dependencyTaskId: '678ded6e80cbfb55ce4d02f7',
				},
			})
			.set('Authorization', `Bearer ${token}`);

		console.log(response.body);
		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe(
			'Circular dependency detected: A task cannot depend on itself'
		);
	});

	it('should add a dependency to a task as Project Manager with JWT token and RBAC', async () => {
		const token = testJwtPayload.projectManagerPayload();
		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: {
					addDependencyId: '678ded6e80cbfb55ce4d02f7',
					dependencyTaskId: '678b531732c2c9ab26b37181',
				},
			})
			.set('Authorization', `Bearer ${token}`);

		console.log(response.body);
		expect(response.status).toBe(200);
		expect(response.body.data.addDependency.dependencies.length).toBe(2);
	});
	it('should add a dependency to a task as team lead with JWT token and RBAC', async () => {
		const token = testJwtPayload.teamLeadPayload();
		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: {
					addDependencyId: '678ded6e80cbfb55ce4d02f7',
					dependencyTaskId: '678deedb17858a8c16864687',
				},
			})
			.set('Authorization', `Bearer ${token}`);

		console.log(response.body);
		expect(response.status).toBe(200);
		expect(response.body.data.addDependency.dependencies.length).toBe(3);
	});
	it('should add a dependency to a task as team member with JWT token and RBAC', async () => {
		const token = testJwtPayload.teamMemberPayload();
		const response = await server
			.post('/graphql')
			.send({
				query: mutation,
				variables: {
					addDependencyId: '678ded6e80cbfb55ce4d02f7',
					dependencyTaskId: '678deedb17858a8c16864687',
				},
			})
			.set('Authorization', `Bearer ${token}`);

		console.log(response.body);
		expect(response.status).toBe(200);
		expect(response.body.errors[0].message).toBe(
			'Forbidden: You do not have permission to access addDependency route'
		);
	});
});
