// server/models/Crop.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/config');

const Crop = sequelize.define('Crop', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  crop_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'crops', // Matches your MySQL table name
  timestamps: true,
  underscored: true
});

module.exports = Crop;