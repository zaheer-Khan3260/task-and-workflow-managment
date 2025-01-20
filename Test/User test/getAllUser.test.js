const { ServerConfiguration } = require('../config.jest');
const jwt = require('jsonwebtoken');
require('dotenv').config();

describe('Get All Users with JWT Authentication', () => {
	let server;
	let token;

	beforeAll(() => {
		server = ServerConfiguration();
	});

	beforeEach(() => {
		token = jwt.sign(
			{
				_id: '678a60e0034fe20b4406dbe4',
				name: 'test',
				role: 'admin',
				email: 'test1@gmail.com',
			},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1d' }
		);
	});

	it('should get all users', async () => {
		const response = await server
			.get('/api/users')
			.set('Authorization', `Bearer ${token}`);
		expect(response.status).toBe(200);
	}, 20000);

	it('Through error for unauthorized user', async () => {
		const response = await server.get('/api/users');
		expect(response.status).toBe(401);
	});
});
