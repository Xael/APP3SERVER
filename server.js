require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const contractConfigRoutes = require('./routes/contractConfig.js');
const authRoutes = require('./routes/auth');
const recordRoutes = require('./routes/records');
const locationRoutes = require('./routes/locations');
const userRoutes = require('./routes/users');
const serviceRoutes = require('./routes/services');
const unitRoutes = require('./routes/units');
const goalRoutes = require('./routes/goals');
const auditLogRoutes = require('./routes/auditLog');
const reportRoutes = require('./routes/reports.js');
const settingsRoutes = require('./routes/settings.js'); // Novo
const mapRoutes = require('./routes/map.js'); // Novo

const app = express();
const PORT = process.env.PORT || 8000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Prestação de Serviços API is rodando!' });
});

app.use('/api/contract-groups', contractConfigRoutes);
app.use('/api/contract-configs', contractConfigRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/auditlog', auditLogRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes); // Novo
app.use('/api/map', mapRoutes); // Novo

// Start Server
app.listen(PORT, () => {
  console.log(`Server esta rodando no http://localhost:${PORT}`);
});
