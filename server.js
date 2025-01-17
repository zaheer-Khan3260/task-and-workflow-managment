import express from 'express';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { schema } from './src/graphql/executableSchema.js';
import { connectDB } from './src/database/db.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const server = new ApolloServer({ schema });

connectDB();
startStandaloneServer(server, { listen: { port } })
	.then(({ url }) => {
		console.log(`Server is running at ${url}`);
	})
	.catch((error) => {
		console.error('Server startup failed', error);
	});
