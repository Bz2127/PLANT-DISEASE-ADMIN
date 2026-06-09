const sequelize = require('../config/config');
const User = require('./User');
const Crop = require('./Crop');
const Disease = require('./Disease');
const Scan = require('./Scan');

// Define Associations
// A Scan belongs to a Disease (the result of the AI prediction)
Scan.belongsTo(Disease, { foreignKey: 'ai_predicted_disease_id', as: 'disease' });
Disease.hasMany(Scan, { foreignKey: 'ai_predicted_disease_id' });

// A Disease belongs to a Crop
Disease.belongsTo(Crop, { foreignKey: 'crop_id' });
Crop.hasMany(Disease, { foreignKey: 'crop_id' });

module.exports = {
  sequelize,
  User,
  Crop,
  Disease,
  Scan
};