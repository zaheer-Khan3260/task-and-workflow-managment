const { ServerConfiguration } = require('../config.jest');

// Mock user data
let userData = {
	name: 'testuser6',
	password: '123456789',
	email: 'testuser6@gmail.com',
	role: 'team_lead',
	status: 'active',
};

describe('User API: Create User', () => {
	let server = ServerConfiguration();

	it('should create a new user', async () => {
		const response = await server.post('/api/users/create').send(userData);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('User created successfully');
	});
});

describe('Create User: If User Already Exists', () => {
	let server;

	beforeAll(() => {
		server = ServerConfiguration();
	});

	it('should throw an error if the user already exists', async () => {
		let response = await server.post('/api/users/create').send(userData);

		expect(response.status).toBe(409);
	});
});
