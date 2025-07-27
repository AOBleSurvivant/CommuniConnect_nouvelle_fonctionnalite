const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authMiddleware: auth, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/moderation - Route de base pour vérifier l'état du service
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Service de modération opérationnel',
    endpoints: {
      stats: '/api/moderation/stats',
      reports: '/api/moderation/reports',
      actions: '/api/moderation/actions'
    }
  });
});

// Données fictives pour le développement
let reports = [
  {
    _id: '1',
    type: 'post',
    content: {
      _id: 'post1',
      title: 'Publication inappropriée',
      author: { _id: 'user1', name: 'Utilisateur A', avatar: null },
      content: 'Contenu signalé...',
      createdAt: new Date(Date.now() - 86400000),
    },
    reporter: { _id: 'user2', name: 'Utilisateur B', avatar: null },
    reason: 'inappropriate',
    description: 'Contenu inapproprié pour la communauté',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000),
    priority: 'high',
  },
  {
    _id: '2',
    type: 'alert',
    content: {
      _id: 'alert1',
      title: 'Fausse alerte',
      author: { _id: 'user3', name: 'Utilisateur C', avatar: null },
      description: 'Alerte signalée comme fausse',
      createdAt: new Date(Date.now() - 172800000),
    },
    reporter: { _id: 'user4', name: 'Utilisateur D', avatar: null },
    reason: 'false_information',
    description: 'Cette alerte contient des informations erronées',
    status: 'resolved',
    createdAt: new Date(Date.now() - 7200000),
    priority: 'medium',
    resolution: 'alert_hidden',
    resolvedBy: { _id: 'mod1', name: 'Modérateur' },
    resolvedAt: new Date(Date.now() - 3600000),
  }
];

let moderatedContent = [
  {
    _id: '1',
    type: 'post',
    content: 'Publication supprimée',
    author: 'Utilisateur G',
    action: 'deleted',
    moderator: 'Modérateur',
    reason: 'Contenu inapproprié',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    _id: '2',
    type: 'alert',
    content: 'Alerte masquée',
    author: 'Utilisateur H',
    action: 'hidden',
    moderator: 'Modérateur',
    reason: 'Fausse information',
    createdAt: new Date(Date.now() - 172800000),
  }
];

let users = [
  {
    _id: '1',
    name: 'Utilisateur I',
    email: 'user1@example.com',
    role: 'user',
    status: 'active',
    reports: 0,
    posts: 15,
    joinedAt: new Date(Date.now() - 259200000),
  },
  {
    _id: '2',
    name: 'Utilisateur J',
    email: 'user2@example.com',
    role: 'user',
    status: 'suspended',
    reports: 3,
    posts: 5,
    joinedAt: new Date(Date.now() - 518400000),
  }
];

// @route   GET /api/moderation/stats
// @desc    Obtenir les statistiques de modération
// @access  Private (Modérateur/Admin)
router.get('/stats', auth, authorize(['moderator', 'admin']), async (req, res) => {
  try {
    const stats = {
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      resolvedReports: reports.filter(r => r.status === 'resolved').length,
      activeUsers: users.filter(u => u.status === 'active').length,
      moderatedContent: moderatedContent.length,
      bannedUsers: users.filter(u => u.status === 'banned').length,
      suspendedUsers: users.filter(u => u.status === 'suspended').length,
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// @route   GET /api/moderation/reports
// @desc    Obtenir tous les signalements avec filtres
// @access  Private (Modérateur/Admin)
router.get('/reports', [
  auth,
  authorize(['moderator', 'admin']),
  query('status').optional().isIn(['pending', 'resolved', 'rejected']),
  query('type').optional().isIn(['post', 'alert', 'event', 'livestream', 'user']),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      status,
      type,
      priority,
      limit = 20,
      page = 1
    } = req.query;

    let filteredReports = [...reports];

    // Appliquer les filtres
    if (status) {
      filteredReports = filteredReports.filter(r => r.status === status);
    }
    if (type) {
      filteredReports = filteredReports.filter(r => r.type === type);
    }
    if (priority) {
      filteredReports = filteredReports.filter(r => r.priority === priority);
    }

    // Tri par date (plus récent en premier)
    filteredReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedReports = filteredReports.slice(skip, skip + parseInt(limit));

    const totalReports = filteredReports.length;
    const totalPages = Math.ceil(totalReports / parseInt(limit));

    res.json({
      success: true,
      data: {
        reports: paginatedReports,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReports,
          hasNextPage: skip + parseInt(limit) < totalReports,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des signalements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des signalements'
    });
  }
});

// @route   GET /api/moderation/reports/:id
// @desc    Obtenir un signalement spécifique
// @access  Private (Modérateur/Admin)
router.get('/reports/:id', auth, authorize(['moderator', 'admin']), async (req, res) => {
  try {
    const report = reports.find(r => r._id === req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Signalement non trouvé'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du signalement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du signalement'
    });
  }
});

// @route   POST /api/moderation/reports/:id/action
// @desc    Effectuer une action sur un signalement
// @access  Private (Modérateur/Admin)
router.post('/reports/:id/action', [
  auth,
  authorize(['moderator', 'admin']),
  body('action').isIn(['approve', 'reject', 'delete_content', 'hide_content', 'warn_user', 'suspend_user', 'ban_user']),
  body('reason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { action, reason } = req.body;
    const report = reports.find(r => r._id === req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Signalement non trouvé'
      });
    }

    if (report.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Ce signalement a déjà été traité'
      });
    }

    // Mettre à jour le signalement
    report.status = 'resolved';
    report.resolution = action;
    report.resolvedBy = {
      _id: req.user._id,
      name: `${req.user.firstName} ${req.user.lastName}`
    };
    report.resolvedAt = new Date();
    report.resolutionReason = reason;

    // Ajouter à l'historique de modération
    const moderationEntry = {
      _id: Date.now().toString(),
      type: report.type,
      content: report.content.title || report.content.description || 'Contenu modéré',
      author: report.content.author?.name || report.content.name,
      action: action,
      moderator: `${req.user.firstName} ${req.user.lastName}`,
      reason: reason || 'Action de modération',
      reportId: report._id,
      createdAt: new Date()
    };

    moderatedContent.push(moderationEntry);

    res.json({
      success: true,
      message: 'Action de modération effectuée avec succès',
      data: {
        report,
        moderationEntry
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'action de modération:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'action de modération'
    });
  }
});

// @route   GET /api/moderation/content
// @desc    Obtenir l'historique du contenu modéré
// @access  Private (Modérateur/Admin)
router.get('/content', [
  auth,
  authorize(['moderator', 'admin']),
  query('type').optional().isIn(['post', 'alert', 'event', 'livestream', 'user']),
  query('action').optional().isIn(['deleted', 'hidden', 'warned', 'suspended', 'banned']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      type,
      action,
      limit = 20,
      page = 1
    } = req.query;

    let filteredContent = [...moderatedContent];

    // Appliquer les filtres
    if (type) {
      filteredContent = filteredContent.filter(c => c.type === type);
    }
    if (action) {
      filteredContent = filteredContent.filter(c => c.action === action);
    }

    // Tri par date (plus récent en premier)
    filteredContent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedContent = filteredContent.slice(skip, skip + parseInt(limit));

    const totalContent = filteredContent.length;
    const totalPages = Math.ceil(totalContent / parseInt(limit));

    res.json({
      success: true,
      data: {
        content: paginatedContent,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalContent,
          hasNextPage: skip + parseInt(limit) < totalContent,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu modéré:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du contenu modéré'
    });
  }
});

// @route   GET /api/moderation/users
// @desc    Obtenir la liste des utilisateurs pour la modération
// @access  Private (Modérateur/Admin)
router.get('/users', [
  auth,
  authorize(['moderator', 'admin']),
  query('status').optional().isIn(['active', 'suspended', 'banned']),
  query('role').optional().isIn(['user', 'moderator', 'admin']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      status,
      role,
      limit = 20,
      page = 1
    } = req.query;

    let filteredUsers = [...users];

    // Appliquer les filtres
    if (status) {
      filteredUsers = filteredUsers.filter(u => u.status === status);
    }
    if (role) {
      filteredUsers = filteredUsers.filter(u => u.role === role);
    }

    // Tri par date d'inscription (plus récent en premier)
    filteredUsers.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedUsers = filteredUsers.slice(skip, skip + parseInt(limit));

    const totalUsers = filteredUsers.length;
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNextPage: skip + parseInt(limit) < totalUsers,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// @route   POST /api/moderation/users/:id/action
// @desc    Effectuer une action sur un utilisateur
// @access  Private (Admin uniquement pour bannir)
router.post('/users/:id/action', [
  auth,
  authorize(['moderator', 'admin']),
  body('action').isIn(['warn', 'suspend', 'ban', 'activate']),
  body('reason').optional().trim().isLength({ max: 500 }),
  body('duration').optional().isInt({ min: 1, max: 365 }) // jours pour suspension
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { action, reason, duration } = req.body;
    
    // Vérifier les permissions
    if (action === 'ban' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent bannir des utilisateurs'
      });
    }

    const user = users.find(u => u._id === req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Effectuer l'action
    switch (action) {
      case 'warn':
        // Ajouter un avertissement
        if (!user.warnings) user.warnings = [];
        user.warnings.push({
          reason,
          moderator: `${req.user.firstName} ${req.user.lastName}`,
          createdAt: new Date()
        });
        break;
      
      case 'suspend':
        user.status = 'suspended';
        user.suspendedAt = new Date();
        user.suspendedBy = `${req.user.firstName} ${req.user.lastName}`;
        user.suspensionReason = reason;
        user.suspensionDuration = duration;
        if (duration) {
          user.suspensionEndsAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
        }
        break;
      
      case 'ban':
        user.status = 'banned';
        user.bannedAt = new Date();
        user.bannedBy = `${req.user.firstName} ${req.user.lastName}`;
        user.banReason = reason;
        break;
      
      case 'activate':
        user.status = 'active';
        user.activatedAt = new Date();
        user.activatedBy = `${req.user.firstName} ${req.user.lastName}`;
        delete user.suspendedAt;
        delete user.suspendedBy;
        delete user.suspensionReason;
        delete user.suspensionDuration;
        delete user.suspensionEndsAt;
        delete user.bannedAt;
        delete user.bannedBy;
        delete user.banReason;
        break;
    }

    // Ajouter à l'historique de modération
    const moderationEntry = {
      _id: Date.now().toString(),
      type: 'user',
      content: `Action sur utilisateur: ${user.name}`,
      author: user.name,
      action: action,
      moderator: `${req.user.firstName} ${req.user.lastName}`,
      reason: reason || `Action: ${action}`,
      createdAt: new Date()
    };

    moderatedContent.push(moderationEntry);

    res.json({
      success: true,
      message: `Action ${action} effectuée avec succès`,
      data: {
        user,
        moderationEntry
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'action sur l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'action sur l\'utilisateur'
    });
  }
});

// @route   GET /api/moderation/analytics
// @desc    Obtenir les analytics de modération
// @access  Private (Modérateur/Admin)
router.get('/analytics', auth, authorize(['moderator', 'admin']), async (req, res) => {
  try {
    const { period = '30' } = req.query; // jours
    const daysAgo = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Filtrer les données par période
    const recentReports = reports.filter(r => new Date(r.createdAt) >= daysAgo);
    const recentModerations = moderatedContent.filter(m => new Date(m.createdAt) >= daysAgo);

    const analytics = {
      period: `${period} jours`,
      reports: {
        total: recentReports.length,
        pending: recentReports.filter(r => r.status === 'pending').length,
        resolved: recentReports.filter(r => r.status === 'resolved').length,
        byType: {
          post: recentReports.filter(r => r.type === 'post').length,
          alert: recentReports.filter(r => r.type === 'alert').length,
          event: recentReports.filter(r => r.type === 'event').length,
          user: recentReports.filter(r => r.type === 'user').length,
        },
        byPriority: {
          high: recentReports.filter(r => r.priority === 'high').length,
          medium: recentReports.filter(r => r.priority === 'medium').length,
          low: recentReports.filter(r => r.priority === 'low').length,
        }
      },
      moderations: {
        total: recentModerations.length,
        byAction: {
          deleted: recentModerations.filter(m => m.action === 'deleted').length,
          hidden: recentModerations.filter(m => m.action === 'hidden').length,
          suspended: recentModerations.filter(m => m.action === 'suspended').length,
          banned: recentModerations.filter(m => m.action === 'banned').length,
        },
        byType: {
          post: recentModerations.filter(m => m.type === 'post').length,
          alert: recentModerations.filter(m => m.type === 'alert').length,
          user: recentModerations.filter(m => m.type === 'user').length,
        }
      },
      users: {
        active: users.filter(u => u.status === 'active').length,
        suspended: users.filter(u => u.status === 'suspended').length,
        banned: users.filter(u => u.status === 'banned').length,
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des analytics'
    });
  }
});

module.exports = router; 