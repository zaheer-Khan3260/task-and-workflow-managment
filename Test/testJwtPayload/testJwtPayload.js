const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

class TestJwtPayload {
	adminPayload() {
		const token = jwt.sign(
			{
				_id: '678a60e0034fe20b4406dbe4', // Example user ID
				name: 'test',
				role: 'admin',
				email: 'test1@gmail.com',
			},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1d' }
		);
		return token;
	}

	projectManagerPayload() {
		const token = jwt.sign(
			{
				_id: '678b5b872d3db633dd08bd48', // Example user ID
				name: 'test',
				role: 'project_manager',
				email: 'test6@gmail.com',
			},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1d' }
		);
		return token;
	}

	teamLeadPayload() {
		const token = jwt.sign(
			{
				_id: '678a6138034fe20b4406dbe8', // Example user ID
				name: 'test',
				role: 'team_lead',
				email: 'test2@gmail.com',
			},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1d' }
		);
		return token;
	}

	teamMemberPayload() {
		const token = jwt.sign(
			{
				_id: '678b46d1213f9efb4fa4ed40', // Example user ID
				name: 'test',
				role: 'team_member',
				email: 'test4@gmail.com',
			},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1d' }
		);
		return token;
	}
	teamMemberPayload2() {
		const token = jwt.sign(
			{
				_id: '678a6138034fe20b4406dbe8', // Example user ID
				name: 'test',
				role: 'team_member',
				email: 'test3@gmail.com',
			},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1d' }
		);
		return token;
	}
}

module.exports = TestJwtPayload;
