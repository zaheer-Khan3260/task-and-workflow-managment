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
			username: this.username,
			fullname: this.fullname,
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

userSchema.methods.hasPermission = function (action) {
	const roleHierarchy = {
		admin: [
			'create_task',
			'manage_task',
			'update_task_status',
			'update_task',
			'delete_task',
			'assign_task',
			'view_all_task',
		],
		project_manager: [
			'create_task',
			'manage_task',
			'update_task_status',
			'update_task',
			'delete_task',
			'assign_task',
			'view_all_task',
		],
		team_lead: [
			'manage_task',
			'assign_task',
			'update_task_status',
			'view_all_task',
		],
		team_member: ['view_their_task', 'update_task_status'],
	};

	if (roleHierarchy[this.role].includes(action)) {
		return true;
	} else {
		return false;
	}
};

export const User = mongoose.model('User', userSchema);
