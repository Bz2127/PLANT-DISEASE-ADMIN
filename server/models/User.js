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
  phone_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  language_pref: {
    type: DataTypes.ENUM('English', 'Amharic'),
    defaultValue: 'English',
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profile_image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Blocked'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true
});

module.exports = User;