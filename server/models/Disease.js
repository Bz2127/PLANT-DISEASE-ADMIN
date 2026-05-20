// server/models/Disease.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/config');
const Crop = require('./Crop'); 

const Disease = sequelize.define('Disease', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  disease_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  crop_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'crops',
      key: 'id',
    },
  },
  description: {
    type: DataTypes.TEXT,
  },
  symptoms: {
    type: DataTypes.TEXT,
  },
  causes: {
    type: DataTypes.TEXT,
  },
  treatment_organic: {
    type: DataTypes.TEXT,
  },
  treatment_chemical: {
    type: DataTypes.TEXT,
  },
  prevention_tips: {
    type: DataTypes.TEXT,
  },
  image_url: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'diseases', // FIX: Forces Sequelize to use your exact lowercase table
  underscored: true,
});

// Establish relationship safely
Disease.belongsTo(Crop, { foreignKey: 'crop_id' });
Crop.hasMany(Disease, { foreignKey: 'crop_id' });

module.exports = Disease;