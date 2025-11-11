const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const prisma = new PrismaClient();

// Configuração do Multer para upload de logo
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, `logo${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// ==========================================================
// ⚙️ GET / - Rota para buscar as configurações da aplicação
// ==========================================================
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      // Se não houver configurações, cria a entrada padrão.
      settings = await prisma.appSettings.create({ data: { id: 1 } });
    }
    res.json(settings);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    res.status(500).json({ message: 'Erro ao buscar configurações.' });
  }
});

// ==========================================================
// 💾 POST / - Rota para atualizar as configurações
// ==========================================================
router.post('/', protect, adminOnly, upload.single('logo'), async (req, res) => {
  try {
    const { companyName, mapsEnabled } = req.body;
    
    const dataToUpdate = {};
    if (companyName) {
      dataToUpdate.companyName = companyName;
    }
    if (mapsEnabled !== undefined) {
      dataToUpdate.mapsEnabled = mapsEnabled === 'true';
    }
    if (req.file) {
      dataToUpdate.companyLogoUrl = `/uploads/${req.file.filename}`;
    }

    const updatedSettings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: dataToUpdate,
      create: { id: 1, ...dataToUpdate },
    });

    res.json(updatedSettings);
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    res.status(500).json({ message: 'Erro ao atualizar configurações.' });
  }
});

module.exports = router;
