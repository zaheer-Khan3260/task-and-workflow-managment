import mongoose from 'mongoose';
import jwt from 'jsonwebtoken'; // generate refresh and access token
import bcrypt from 'bcrypt'; // to encrypt the password

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			validate: [
				(val) =>
					/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(val),
				'Invalid email',
			],
			unique: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 8,
		},
		role: {
			type: String,
			required: true,
			enum: ['admin', 'project_manager', 'team_lead', 'team_member'],
			default: 'team_member',
		},

		assignedTasks: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Task',
			},
		],
		refreshToken: {
			type: String,
		},

		status: {
			type: String,
			enum: ['active', 'inactive', 'suspended'],
			default: 'active',
		},
		lastLogin: {
			type: Date,
		},
	},
	{
		timestamps: true,
	}
);

userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next(); // this line means when password doesn't modified then just simply go next no need to encrypt the password

	this.password = await bcrypt.hash(this.password, 10);
	next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
	return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
	return jwt.sign(
		{
			_id: this._id,
			email: this.email,
			name: this.name,
			role: this.role,
		},
		process.env.ACCESS_TOKEN_SECRET,
		{
			expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
		}
	);
};

userSchema.methods.generateRefreshToken = function () {
	return jwt.sign(
		{
			_id: this._id,
		},
		process.env.REFRESH_TOKEN_SECRET,
		{
			expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
		}
	);
};

export const User = mongoose.model('User', userSchema);
