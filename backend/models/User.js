// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  nickname: { type: String, default: '' }
});

module.exports = mongoose.model('User', UserSchema);