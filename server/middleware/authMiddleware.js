const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); 

module.exports = async function (req, res, next) {
  let token = req.header('Authorization');

  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  } else {
    token = req.header('x-auth-token');
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_123');

    if (!decoded.admin || !decoded.admin.id) {
      return res.status(401).json({ success: false, message: 'Token token footprint invalid.' });
    }

    const admin = await Admin.findByPk(decoded.admin.id);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Token is valid but admin record not found' });
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role
    }; 
    
    next();
  } catch (err) {
    console.error("Middleware authorization error:", err.message);
    res.status(401).json({ success: false, message: 'Token signature is not valid or expired' });
  }
};