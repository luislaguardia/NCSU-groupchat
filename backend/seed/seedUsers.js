// seed/seedUsers.js
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createUsers = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const users = [];

  for (let i = 1; i <= 10; i++) {
    users.push({
      username: `admin${i}`,
      password: `password${i}`,
    });
  }

  await User.deleteMany(); // optional: clean slate
  await User.insertMany(users);
  console.log('10 admin users created!');
  process.exit();
};

createUsers();