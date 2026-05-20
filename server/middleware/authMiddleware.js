// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); 

module.exports = async function (req, res, next) {
  // 1. Extract token from standard 'Authorization' or fallback 'x-auth-token' header
  let token = req.header('Authorization');

  if (token && token.startsWith('Bearer ')) {
    // Split "Bearer <token_string>" to get just the token payload string
    token = token.split(' ')[1];
  } else {
    // Fallback to checking the direct custom header if Bearer isn't present
    token = req.header('x-auth-token');
  }

  // 2. Terminate request if no token credentials are passed
  if (!token) {
    return res.status(401).json({ success: false, msg: 'No token, authorization denied' });
  }

  // 3. Cryptographic Token Verification Loop
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the admin from the database to ensure user still exists and is active
    const admin = await Admin.findByPk(decoded.admin.id);

    if (!admin) {
      return res.status(401).json({ success: false, msg: 'Token is valid but admin record not found' });
    }

    // Attach verified admin data object payload securely onto the request routing thread
    req.admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role
    }; 
    
    next();
  } catch (err) {
    res.status(401).json({ success: false, msg: 'Token signature is not valid or expired' });
  }
};