require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: 'diegoadmin@uce.edu.ec' });
    if (existing) {
      console.log('⚠️ Admin already exists');
      return process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Diego123$', 10);     // password de admin

    const admin = new User({
      username: 'diegoadmin',
      email: 'diegoadmin@uce.edu.ec',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err);
    process.exit(1);
  }
};

createAdmin();
