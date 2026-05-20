const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/config');

const Notification = sequelize.define('Notification', {
  type: {
    type: DataTypes.ENUM('Weather', 'Outbreak', 'System'),
    allowNull: false,
  },
  title_en: { type: DataTypes.STRING, allowNull: false },
  title_am: { type: DataTypes.STRING, allowNull: false }, // Amharic Title
  message_en: { type: DataTypes.TEXT, allowNull: false },
  message_am: { type: DataTypes.TEXT, allowNull: false }, // Amharic Message
  sent_by: {
    type: DataTypes.INTEGER,
    references: { model: 'admins', key: 'id' }
  }
});

module.exports = Notification;