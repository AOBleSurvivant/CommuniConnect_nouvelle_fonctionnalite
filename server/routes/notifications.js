const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Middleware pour valider les erreurs
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/notifications - Route de base pour vérifier l'état du service
router.get('/', auth, async (req, res) => {
  res.json({
    success: true,
    message: 'Service de notifications opérationnel',
    endpoints: {
      registerToken: '/api/notifications/register-token',
      settings: '/api/notifications/settings',
      test: '/api/notifications/test',
      stats: '/api/notifications/stats'
    }
  });
});

// POST /api/notifications/register-token - Enregistrer un token FCM
router.post('/register-token', auth, [
  body('fcmToken').notEmpty().withMessage('Token FCM requis'),
  body('deviceInfo').optional().isObject().withMessage('Informations de l\'appareil invalides')
], handleValidationErrors, async (req, res) => {
  try {
    const { fcmToken, deviceInfo } = req.body;
    const userId = req.user.id;

    const success = await global.pushNotificationService.registerToken(userId, fcmToken);
    
    if (success) {
      res.json({
        success: true,
        message: 'Token FCM enregistré avec succès'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement du token'
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du token FCM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// DELETE /api/notifications/unregister-token - Supprimer un token FCM
router.delete('/unregister-token', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await global.pushNotificationService.removeInvalidToken(userId);
    
    res.json({
      success: true,
      message: 'Token FCM supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du token FCM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/notifications/settings - Mettre à jour les paramètres de notification
router.put('/settings', auth, [
  body('settings').isObject().withMessage('Paramètres invalides'),
  body('settings.messages').optional().isBoolean().withMessage('Paramètre messages invalide'),
  body('settings.alerts').optional().isBoolean().withMessage('Paramètre alerts invalide'),
  body('settings.events').optional().isBoolean().withMessage('Paramètre events invalide'),
  body('settings.helpRequests').optional().isBoolean().withMessage('Paramètre helpRequests invalide')
], handleValidationErrors, async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user.id;

    const User = require('../models/User');
    await User.findByIdAndUpdate(userId, {
      notificationSettings: settings
    });

    res.json({
      success: true,
      message: 'Paramètres de notification mis à jour'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/notifications/settings - Récupérer les paramètres de notification
router.get('/settings', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // En mode développement, retourner des paramètres par défaut
    if (process.env.NODE_ENV === 'development') {
      res.json({
        success: true,
        settings: {
          messages: true,
          alerts: true,
          events: true,
          helpRequests: true,
          communityUpdates: true
        }
      });
      return;
    }
    
    const User = require('../models/User');
    const user = await User.findById(userId).select('notificationSettings');
    
    res.json({
      success: true,
      settings: user.notificationSettings || {
        messages: true,
        alerts: true,
        events: true,
        helpRequests: true
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/notifications/stats - Statistiques des notifications
router.get('/stats', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const stats = await global.pushNotificationService.getNotificationStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/notifications/test - Envoyer une notification de test
router.post('/test', auth, [
  body('type').isIn(['message', 'alert', 'event', 'help_request']).withMessage('Type de notification invalide'),
  body('title').notEmpty().withMessage('Titre requis'),
  body('body').notEmpty().withMessage('Contenu requis')
], handleValidationErrors, async (req, res) => {
  try {
    const { type, title, body, imageUrl } = req.body;
    const userId = req.user.id;

    const notification = {
      title,
      body,
      type,
      imageUrl
    };

    const success = await global.pushNotificationService.sendToUser(userId, notification);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification de test envoyée'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de la notification'
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de test:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/notifications/broadcast - Envoyer une notification à tous les utilisateurs
router.post('/broadcast', auth, [
  body('title').notEmpty().withMessage('Titre requis'),
  body('body').notEmpty().withMessage('Contenu requis'),
  body('type').isIn(['message', 'alert', 'event', 'help_request', 'announcement']).withMessage('Type invalide'),
  body('region').optional().isString().withMessage('Région invalide'),
  body('quartier').optional().isString().withMessage('Quartier invalide')
], handleValidationErrors, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const { title, body, type, imageUrl, region, quartier } = req.body;

    const notification = {
      title,
      body,
      type,
      imageUrl
    };

    let result;
    
    if (region || quartier) {
      // Envoyer à une zone spécifique
      result = await global.pushNotificationService.sendToLocation(region, quartier, notification);
    } else {
      // Envoyer à tous les utilisateurs
      const User = require('../models/User');
      const users = await User.find({
        fcmToken: { $exists: true, $ne: null }
      }).select('_id');
      
      const userIds = users.map(user => user._id.toString());
      result = await global.pushNotificationService.sendToUsers(userIds, notification);
    }

    res.json({
      success: true,
      message: 'Notification diffusée',
      result
    });
  } catch (error) {
    console.error('Erreur lors de la diffusion de notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router; 