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
		expect(response.body.message).toBe('User logged in successfully');
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
		console.log(response);
		expect(response.status).toBe(404);
		expect(response.body.message).toBe('User not found');
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
		// console.log(response);
		expect(response.status).toBe(400);
		expect(response.body.message).toBe('Password is incorrect');
	});
});
