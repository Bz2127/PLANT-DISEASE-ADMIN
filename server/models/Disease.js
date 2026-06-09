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
  // The exact raw string returned by the ML model (e.g. 'Anthracnose', 'Bacterial-Spot ', 'Downey-Mildew')
  disease_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // Guarantees we match unique ML signatures perfectly
  },
  // Friendly display names for UI screens
  display_name_en: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  display_name_am: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  crop_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'crops',
      key: 'id',
    },
  },
  // Localized descriptions
  description_en: {
    type: DataTypes.TEXT,
  },
  description_am: {
    type: DataTypes.TEXT,
  },
  // Localized symptoms
  symptoms_en: {
    type: DataTypes.TEXT,
  },
  symptoms_am: {
    type: DataTypes.TEXT,
  },
  // Localized causes
  causes_en: {
    type: DataTypes.TEXT,
  },
  causes_am: {
    type: DataTypes.TEXT,
  },
  // Localized treatments (critical for Text-to-Speech playback strings)
  treatment_organic_en: {
    type: DataTypes.TEXT,
  },
  treatment_organic_am: {
    type: DataTypes.TEXT,
  },
  treatment_chemical_en: {
    type: DataTypes.TEXT,
  },
  treatment_chemical_am: {
    type: DataTypes.TEXT,
  },
  // Localized prevention rules
  prevention_tips_en: {
    type: DataTypes.TEXT,
  },
  prevention_tips_am: {
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
  tableName: 'diseases', 
  underscored: true,
});

// Establish relationships cleanly
Disease.belongsTo(Crop, { foreignKey: 'crop_id' });
Crop.hasMany(Disease, { foreignKey: 'crop_id' });

module.exports = Disease;