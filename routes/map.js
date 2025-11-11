const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect, adminOnly } = require('../middleware/auth');
const prisma = new PrismaClient();

// ==========================================================
// 📍 POST /update-location - Rota para o operador enviar sua localização
// ==========================================================
router.post('/update-location', protect, async (req, res) => {
  if (req.user.role !== 'OPERATOR') {
    return res.status(403).json({ message: 'Apenas operadores podem atualizar a localização.' });
  }

  const { latitude, longitude } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ message: 'Latitude e longitude são obrigatórias.' });
  }

  try {
    await prisma.operatorLocation.upsert({
      where: { userId: req.user.id },
      update: { latitude, longitude },
      create: { userId: req.user.id, latitude, longitude },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao atualizar a localização do operador:', error);
    res.status(500).json({ message: 'Erro ao atualizar a localização.' });
  }
});

// ==========================================================
// 🗺️ GET /operator-data - Rota para o operador buscar dados para o mapa
// ==========================================================
router.get('/operator-data', protect, async (req, res) => {
  const { contractGroup } = req.query;
  if (!contractGroup) {
    return res.status(400).json({ message: 'O grupo de contrato é obrigatório.' });
  }

  try {
    const config = await prisma.contractConfig.findUnique({ where: { contractGroup } });
    const cycleStartDay = config ? config.cycleStartDay : 1;
    const today = new Date();
    let cycleStartDate = new Date(today.getFullYear(), today.getMonth(), cycleStartDay);
    if (today.getDate() < cycleStartDay) {
        cycleStartDate.setMonth(cycleStartDate.getMonth() - 1);
    }
    cycleStartDate.setHours(0, 0, 0, 0);

    const locations = await prisma.location.findMany({
      where: {
        city: contractGroup,
        lat: { not: null },
        lng: { not: null },
      },
      include: {
        services: { include: { service: true } },
        children: { include: { services: { include: { service: true } } } },
      },
    });

    const recentRecords = await prisma.record.findMany({
      where: {
        contractGroup,
        startTime: { gte: cycleStartDate },
      },
      select: {
        locationId: true,
        serviceType: true,
        startTime: true,
      }
    });
    
    const recordMap = new Map();
    recentRecords.forEach(r => {
        const key = `${r.locationId}-${r.serviceType}`;
        if (!recordMap.has(key) || r.startTime > recordMap.get(key).startTime) {
            recordMap.set(key, r);
        }
    });

    const mapData = locations.map(loc => {
        const isParent = loc.isGroup;
        const servicesToEvaluate = isParent ? loc.services : (loc.parentId ? [] : loc.services);
        
        const servicesWithStatus = servicesToEvaluate.map(ls => {
            const isDone = recordMap.has(`${loc.id}-${ls.service.name}`);
            const recordDate = isDone ? recordMap.get(`${loc.id}-${ls.service.name}`).startTime : null;
            return {
                name: ls.service.name,
                status: isDone ? 'Concluído' : 'Pendente',
                lastExecution: recordDate
            };
        });

        const overallStatus = servicesWithStatus.length > 0 && servicesWithStatus.every(s => s.status === 'Concluído')
            ? 'completed'
            : 'pending';
            
        return {
            id: loc.id,
            name: loc.name,
            lat: loc.lat,
            lng: loc.lng,
            isGroup: loc.isGroup,
            status: servicesWithStatus.length === 0 ? 'pending' : overallStatus,
            services: servicesWithStatus,
        };
    });

    res.json(mapData);
  } catch (error) {
    console.error('Erro ao buscar dados para o mapa do operador:', error);
    res.status(500).json({ message: 'Erro ao buscar dados do mapa.' });
  }
});

// ==========================================================
// 📡 GET /monitoring-data - Rota para o admin buscar localizações
// ==========================================================
router.get('/monitoring-data', protect, adminOnly, async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const locations = await prisma.operatorLocation.findMany({
      where: {
        lastUpdatedAt: { gte: fiveMinutesAgo }
      },
      include: {
        user: { select: { name: true } },
      },
    });

    const formattedLocations = locations.map(loc => ({
      userId: loc.userId,
      name: loc.user.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      lastUpdatedAt: loc.lastUpdatedAt,
    }));

    res.json(formattedLocations);
  } catch (error) {
    console.error('Erro ao buscar dados de monitoramento:', error);
    res.status(500).json({ message: 'Erro ao buscar dados de monitoramento.' });
  }
});


module.exports = router;
