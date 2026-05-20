// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('./config/config'); // Import connectDB from config
const diseaseRoutes = require('./routes/diseaseRoutes');
// Load environment variables
dotenv.config();

// Connect to MySQL & Sync Models
connectDB();

const app = express();

// Middleware
app.use(express.json()); // Body parser for JSON
app.use(cors()); // Enable CORS
//

app.use('/api/admin/diseases', diseaseRoutes);

// Routes (will add later)
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Import and use auth routes (will recreate this file next)
const adminAuthRoutes = require('./routes/adminAuthRoutes');
app.use('/api/admin', adminAuthRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});