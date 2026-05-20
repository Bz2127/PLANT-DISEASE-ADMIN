const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/config');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  language_pref: {
    type: DataTypes.ENUM('English', 'Amharic'),
    defaultValue: 'English',
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true, // Farmers can update this later
  },
  status: {
    type: DataTypes.ENUM('Active', 'Blocked'),
    defaultValue: 'Active',
  },
});

module.exports = User;