const supertest = require('supertest');
require('dotenv').config();

const ServerConfiguration = () => {
	if (!process.env.SERVER_URL) {
		throw new Error('SERVER_URL is not defined in environment variables');
	}

	// Return the supertest instance directly
	return supertest(process.env.SERVER_URL);
};

module.exports = { ServerConfiguration };
