const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const ModerationLog = require('../models/ModerationLog');
const automatedModerationService = require('../services/automatedModerationService');
const User = require('../models/User');
const Post = require('../models/Post');

// Route de base pour vérifier le service
router.get('/', (req, res) => {
  res.json({ 
    message: 'Service de Modération Avancée opérationnel',
    version: '1.0.0',
    features: ['reports', 'automated_moderation', 'moderation_logs', 'content_analysis']
  });
});

// === GESTION DES SIGNALEMENTS ===

// Créer un nouveau signalement
router.post('/reports', auth, [
  body('reportedContent.type').isIn(['post', 'comment', 'event', 'livestream', 'user']),
  body('reportedContent.contentId').isMongoId(),
  body('reason').isIn([
    'spam', 'inappropriate_content', 'harassment', 'fake_news', 
    'violence', 'hate_speech', 'copyright_violation', 'other'
  ]),
  body('description').optional().isLength({ max: 1000 }),
  body('evidence').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reportedContent, reason, description, evidence } = req.body;

    // Vérifier que le contenu signalé existe
    let contentType;
    switch (reportedContent.type) {
      case 'post':
        contentType = Post;
        break;
      case 'user':
        contentType = User;
        break;
      // Ajouter d'autres types selon les besoins
      default:
        return res.status(400).json({ message: 'Type de contenu non supporté' });
    }

    const contentExists = await contentType.findById(reportedContent.contentId);
    if (!contentExists) {
      return res.status(404).json({ message: 'Contenu signalé non trouvé' });
    }

    // Vérifier que l'utilisateur ne signale pas son propre contenu
    if (reportedContent.type === 'user' && reportedContent.contentId === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous signaler vous-même' });
    }

    // Créer le signalement
    const report = new Report({
      reporter: req.user.id,
      reportedContent: {
        type: reportedContent.type,
        contentId: reportedContent.contentId,
        contentType: contentType.modelName
      },
      reason,
      description,
      evidence: evidence || []
    });

    await report.save();

    // Notification aux modérateurs (à implémenter)
    // await notificationService.notifyModerators(report);

    res.status(201).json({
      message: 'Signalement créé avec succès',
      report: {
        id: report._id,
        status: report.status,
        priority: report.priority
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création du signalement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Obtenir tous les signalements (pour les modérateurs)
router.get('/reports', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est modérateur
    if (!req.user.isModerator && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { 
      status, 
      priority, 
      contentType, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (contentType) filter['reportedContent.type'] = contentType;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const reports = await Report.find(filter)
      .populate('reporter', 'username email')
      .populate('assignedModerator', 'username email')
      .populate('resolvedBy', 'username email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des signalements:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Obtenir un signalement spécifique
router.get('/reports/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'username email')
      .populate('assignedModerator', 'username email')
      .populate('resolvedBy', 'username email')
      .populate('moderationActions.moderator', 'username email');

    if (!report) {
      return res.status(404).json({ message: 'Signalement non trouvé' });
    }

    // Vérifier les permissions
    if (!req.user.isModerator && !req.user.isAdmin && report.reporter.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json({ report });

  } catch (error) {
    console.error('Erreur lors de la récupération du signalement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Assigner un modérateur à un signalement
router.patch('/reports/:id/assign', auth, async (req, res) => {
  try {
    if (!req.user.isModerator && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Signalement non trouvé' });
    }

    await report.assignModerator(req.user.id);

    res.json({
      message: 'Modérateur assigné avec succès',
      report: {
        id: report._id,
        status: report.status,
        assignedModerator: report.assignedModerator
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'assignation du modérateur:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Résoudre un signalement
router.patch('/reports/:id/resolve', auth, [
  body('resolution').isIn([
    'content_removed', 'user_warned', 'user_suspended', 
    'user_banned', 'no_action', 'false_report'
  ]),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user.isModerator && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { resolution, notes } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Signalement non trouvé' });
    }

    await report.resolve(resolution, req.user.id, notes);

    res.json({
      message: 'Signalement résolu avec succès',
      report: {
        id: report._id,
        status: report.status,
        resolution: report.resolution
      }
    });

  } catch (error) {
    console.error('Erreur lors de la résolution du signalement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// === MODÉRATION AUTOMATIQUE ===

// Analyser du contenu automatiquement
router.post('/analyze', auth, [
  body('content').isString().notEmpty(),
  body('contentType').optional().isIn(['post', 'comment', 'event', 'livestream']),
  body('userId').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, contentType = 'post', userId } = req.body;

    const analysis = await automatedModerationService.analyzeTextContent(
      content, 
      contentType, 
      userId
    );

    res.json({
      analysis,
      recommendations: analysis.actions
    });

  } catch (error) {
    console.error('Erreur lors de l\'analyse automatique:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Analyser un post existant
router.post('/analyze/post/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post non trouvé' });
    }

    const analysis = await automatedModerationService.analyzePost(post);

    res.json({
      postId: post._id,
      analysis,
      recommendations: analysis.actions
    });

  } catch (error) {
    console.error('Erreur lors de l\'analyse du post:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Appliquer des actions automatiques
router.post('/apply-automated-actions', auth, [
  body('contentId').isMongoId(),
  body('contentType').isIn(['post', 'comment', 'event', 'livestream']),
  body('analysis').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user.isModerator && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { contentId, contentType, analysis } = req.body;

    const result = await automatedModerationService.applyAutomatedActions(
      contentId,
      contentType,
      analysis,
      req.user.id
    );

    if (result.success) {
      res.json({
        message: 'Actions automatiques appliquées avec succès',
        actions: result.actions,
        logId: result.logId
      });
    } else {
      res.status(400).json({
        message: 'Erreur lors de l\'application des actions',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Erreur lors de l\'application des actions automatiques:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// === LOGS DE MODÉRATION ===

// Obtenir les logs de modération
router.get('/logs', auth, async (req, res) => {
  try {
    if (!req.user.isModerator && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { 
      moderator, 
      action, 
      targetType, 
      automated,
      page = 1, 
      limit = 20,
      startDate,
      endDate
    } = req.query;

    const filter = {};
    if (moderator) filter.moderator = moderator;
    if (action) filter.action = action;
    if (targetType) filter['target.type'] = targetType;
    if (automated !== undefined) filter['details.automated'] = automated === 'true';
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const logs = await ModerationLog.find(filter)
      .populate('moderator', 'username email')
      .populate('impact.affectedUsers', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ModerationLog.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Statistiques de modération automatique
router.get('/stats/automation', auth, async (req, res) => {
  try {
    if (!req.user.isModerator && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { startDate, endDate } = req.query;

    const stats = await automatedModerationService.getAutomationStats(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({ stats });

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// === GESTION DES MOTS INTERDITS ===

// Obtenir la liste des mots interdits
router.get('/banned-words', auth, async (req, res) => {
  try {
    if (!req.user.isModerator && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json({
      bannedWords: automatedModerationService.bannedWords,
      count: automatedModerationService.bannedWords.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des mots interdits:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Ajouter des mots interdits
router.post('/banned-words', auth, [
  body('words').isArray().notEmpty(),
  body('words.*').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { words } = req.body;

    automatedModerationService.updateBannedWords(words);

    res.json({
      message: 'Mots interdits ajoutés avec succès',
      addedWords: words,
      totalCount: automatedModerationService.bannedWords.length
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout des mots interdits:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router; 