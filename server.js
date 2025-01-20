import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { connectDB } from './src/database/db.js';
import authMiddleware from './src/middleware/auth.middleware.js';
import createApiLimiter from './src/middleware/apiLimiter.js';
import { taskResolvers } from './src/graphql/resolvers/taskResolver.js';
import { taskTypeDefs } from './src/graphql/schema/taskSchema.js';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config({ path: '.env' });

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
	origin: [process.env.CORS_ORIGIN, 'http://localhost:3000'],
	methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
	credentials: true,
	allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
	preflightContinue: false,
	optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

const server = new ApolloServer({
	typeDefs: taskTypeDefs,
	resolvers: taskResolvers,
});

connectDB();
(async () => {
	await server.start();
	app.use(
		'/graphql',
		createApiLimiter(),
		authMiddleware(),
		expressMiddleware(server, {
			context: async ({ req }) => {
				return { user: req.user };
			},
		})
	);

	app.listen(port, () => {
		console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
	});

	app.get('/', (_, res) => {
		res.send('Server is up and runnig');
	});
})();

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

import userRoutes from './src/userRoutes.js';
app.use('/api/users', userRoutes);
