import mongoose from 'mongoose';

export const connectDB = async () => {
	try {
		console.log('Database connecting.......');
		await mongoose.connect(process.env.MONGO_URI);
		console.log('Database connected successfully');
	} catch (error) {
		console.log('Database connection failed', error);
	}
};
