// server/models/Scan.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/config');

const User = require('./User');
const Crop = require('./Crop');
const Disease = require('./Disease');

const Scan = sequelize.define('Scan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  crop_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'crops', key: 'id' }
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ai_predicted_disease_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'diseases', key: 'id' }
  },
  confidence_level: {
    type: DataTypes.DECIMAL(5, 2),
  },
  raw_ai_result: {
    type: DataTypes.STRING,
  },
  scan_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'scans', // Target lowercase table exactly
  underscored: true
});

// Explicitly register clean relations downstream 
Scan.belongsTo(User, { foreignKey: 'user_id' });
Scan.belongsTo(Crop, { foreignKey: 'crop_id' });
Scan.belongsTo(Disease, { foreignKey: 'ai_predicted_disease_id' });

module.exports = Scan;