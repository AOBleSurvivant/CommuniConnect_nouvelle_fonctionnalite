const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/users - Route de base pour vérifier l'état du service
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Service utilisateurs opérationnel',
    endpoints: {
      profile: '/api/users/profile',
      update: '/api/users/update',
      search: '/api/users/search'
    }
  });
});

// GET /api/users/profile - Récupérer le profil de l'utilisateur connecté
router.get('/profile', auth, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      user: {
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        location: user.location,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router; 