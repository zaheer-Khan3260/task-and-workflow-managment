import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';

export const login = async (req, res) => {
	const { email, password } = req.body;
	const user = await User.findOne({ email });

	if (!user || !(await bcrypt.compare(password, user.password))) {
		return res.status(401).json({ message: 'Invalid credentials' });
	}

	const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
		expiresIn: '1h',
	});
	res.json({ token });
};
