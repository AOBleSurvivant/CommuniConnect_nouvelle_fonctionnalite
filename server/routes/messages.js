const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Créer une nouvelle conversation
router.post('/conversations', auth, [
  body('participants').isArray().withMessage('Les participants doivent être un tableau'),
  body('title').optional().trim()
], async (req, res) => {
  try {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

    const { participants, title } = req.body;
    const userId = req.user._id || req.user.id;

    // Vérifier que l'utilisateur fait partie des participants
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    // En mode développement, créer une conversation fictive
    const conversation = {
      _id: `conv-${Date.now()}`,
      participants: participants.map(p => ({ _id: p, firstName: 'User', lastName: 'Test' })),
      title: title || 'Nouvelle conversation',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Conversation créée avec succès',
      conversation
    });
  } catch (error) {
    console.error('Erreur lors de la création de conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Envoyer un message
router.post('/send', auth, [
  body('conversationId').notEmpty().withMessage('ID de conversation requis'),
  body('content').notEmpty().trim().withMessage('Contenu du message requis'),
  body('attachments').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { conversationId, content, attachments } = req.body;
    const userId = req.user._id || req.user.id;

    // En mode développement, créer un message fictif
    const message = {
      _id: `msg-${Date.now()}`,
      conversationId,
      sender: {
        _id: userId,
        firstName: req.user.firstName || 'Test',
        lastName: req.user.lastName || 'User'
      },
      content,
      attachments: attachments || [],
      timestamp: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      message
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Récupérer les conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // En mode développement, retourner des conversations fictives
    const conversations = [
      {
        _id: 'conv-1',
        participants: [
          { _id: userId, firstName: 'Test', lastName: 'User' },
          { _id: 'user-2', firstName: 'Autre', lastName: 'Utilisateur' }
        ],
        title: 'Conversation test',
        lastMessage: {
          content: 'Dernier message',
          timestamp: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Récupérer les messages d'une conversation
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // En mode développement, retourner des messages fictifs
    const messages = [
      {
        _id: 'msg-1',
      conversationId,
        sender: {
          _id: req.user._id || req.user.id,
          firstName: 'Test',
          lastName: 'User'
        },
        content: 'Message de test',
        timestamp: new Date()
      }
    ];

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router; 