const { ServerConfiguration } = require('../config.jest');

describe('Login User', () => {
	let server;

	beforeAll(() => {
		server = ServerConfiguration();
	});

	it('should login a user', async () => {
		const response = await server
			.post('/api/users/login')
			.send({ email: 'testuser1@gmail.com', password: '123456789' });
		expect(response.status).toBe(200);
		expect(response.body.message).toBe('User logged in Successfully');
	});
});

describe('Login User: If User Not Found', () => {
	let server;

	beforeAll(() => {
		server = ServerConfiguration();
	});

	it('should throw an error if the user is not found', async () => {
		const response = await server.post('/api/users/login').send({
			email: 'testuser10@gmail.com',
			password: '123456789',
		});
		expect(response.status).toBe(404);
		expect(response.body.data).toBe('User Not found');
	});
});

describe('Login User: If Password is Incorrect', () => {
	let server;

	beforeAll(() => {
		server = ServerConfiguration();
	});

	it('should throw an error if the password is incorrect', async () => {
		const response = await server.post('/api/users/login').send({
			email: 'testuser1@gmail.com',
			password: '12345',
		});
		expect(response.status).toBe(400);
		expect(response.body.data).toBe('Password is incorrect');
	});
});
