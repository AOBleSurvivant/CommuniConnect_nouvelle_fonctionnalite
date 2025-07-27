const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
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

// GET /api/messages - Route de base pour vérifier l'état du service
router.get('/', auth, async (req, res) => {
  res.json({
    success: true,
    message: 'Service de messagerie opérationnel',
    endpoints: {
      conversations: '/api/messages/conversations',
      conversation: '/api/messages/conversation/:id',
      send: '/api/messages/send',
      search: '/api/messages/search'
    }
  });
});

// GET /api/messages/conversations - Récupérer toutes les conversations de l'utilisateur
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer toutes les conversations où l'utilisateur est participant
    const conversations = await Conversation.find({
      'participants.user': userId,
      isDeleted: false
    })
    .populate('participants.user', 'firstName lastName avatar quartier ville')
    .populate('lastMessage.sender', 'firstName lastName')
    .sort({ updatedAt: -1 });

    // Formater les conversations pour le frontend
    const formattedConversations = conversations.map(conv => {
      const otherParticipants = conv.participants.filter(p => p.user._id.toString() !== userId);
      const currentParticipant = conv.participants.find(p => p.user._id.toString() === userId);
      
      return {
        id: conv.conversationId,
        name: conv.name || (conv.type === 'private' && otherParticipants.length === 1 
          ? `${otherParticipants[0].user.firstName} ${otherParticipants[0].user.lastName}`
          : 'Conversation de groupe'),
        type: conv.type,
        avatar: conv.avatar || (conv.type === 'private' && otherParticipants.length === 1 
          ? otherParticipants[0].user.avatar 
          : null),
        lastMessage: conv.lastMessage,
        unreadCount: 0, // Sera calculé plus tard
        participants: conv.participants,
        memberCount: conv.stats.memberCount,
        messageCount: conv.stats.messageCount,
        lastSeen: currentParticipant?.lastSeen,
        quartier: conv.quartier,
        ville: conv.ville
      };
    });

    res.json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/messages/conversation/:conversationId - Récupérer les messages d'une conversation
router.get('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Vérifier que l'utilisateur participe à cette conversation
    const conversation = await Conversation.findOne({
      conversationId,
      'participants.user': userId,
      isDeleted: false
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }

    // Récupérer les messages
    const messages = await Message.find({
      conversationId,
      isDeleted: false,
      $or: [
        { sender: userId },
        { recipients: userId }
      ]
    })
    .populate('sender', 'firstName lastName avatar')
    .populate('recipients', 'firstName lastName avatar')
    .populate('replyTo', 'content sender')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    // Marquer les messages comme lus
    const unreadMessages = messages.filter(msg => 
      msg.sender._id.toString() !== userId && 
      !msg.readBy.find(read => read.user.toString() === userId)
    );

    for (const message of unreadMessages) {
      await message.markAsRead(userId);
    }

    // Mettre à jour le lastSeen de la conversation
    await conversation.markAsSeen(userId);

    res.json({
      success: true,
      messages: messages.reverse(), // Inverser pour avoir l'ordre chronologique
      conversation: {
        id: conversation.conversationId,
        name: conversation.name,
        type: conversation.type,
        participants: conversation.participants,
        quartier: conversation.quartier,
        ville: conversation.ville
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/messages/send - Envoyer un message
router.post('/send', auth, [
  body('conversationId').notEmpty().withMessage('ID de conversation requis'),
  body('content').notEmpty().withMessage('Contenu du message requis')
    .isLength({ max: 2000 }).withMessage('Le message ne peut pas dépasser 2000 caractères'),
  body('recipients').optional().isArray().withMessage('Destinataires doit être un tableau'),
  body('replyTo').optional().isMongoId().withMessage('ID de réponse invalide')
], handleValidationErrors, async (req, res) => {
  try {
    const { conversationId, content, recipients, replyTo, attachments = [] } = req.body;
    const senderId = req.user.id;

    let conversation = await Conversation.findOne({ conversationId });

    // Si la conversation n'existe pas, la créer
    if (!conversation) {
      if (!recipients || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Destinataires requis pour créer une nouvelle conversation'
        });
      }

      // Créer une conversation privée ou de groupe
      if (recipients.length === 1) {
        conversation = await Conversation.createPrivateConversation(senderId, recipients[0]);
      } else {
        conversation = await Conversation.createGroupConversation(
          `Groupe ${Date.now()}`,
          senderId,
          recipients
        );
      }
    }

    // Vérifier que l'expéditeur participe à la conversation
    const isParticipant = conversation.participants.find(
      p => p.user.toString() === senderId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne participez pas à cette conversation'
      });
    }

    // Créer le message
    const message = new Message({
      sender: senderId,
      recipients: conversation.participants
        .filter(p => p.user.toString() !== senderId)
        .map(p => p.user),
      content,
      conversationId: conversation.conversationId,
      messageType: conversation.type,
      replyTo,
      attachments,
      quartier: conversation.quartier,
      ville: conversation.ville
    });

    await message.save();

    // Mettre à jour la conversation
    await conversation.updateLastMessage(message);

    // Populate les données pour la réponse
    await message.populate('sender', 'firstName lastName avatar');
    await message.populate('recipients', 'firstName lastName avatar');

    // Envoyer la notification via Socket.IO
    if (global.messageSocketService) {
      await global.messageSocketService.sendNewMessage(message);
    }

    res.json({
      success: true,
      message: 'Message envoyé avec succès',
      data: message
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/messages/conversation/create - Créer une nouvelle conversation
router.post('/conversation/create', auth, [
  body('name').optional().isLength({ max: 100 }).withMessage('Nom trop long'),
  body('type').isIn(['private', 'group', 'quartier']).withMessage('Type invalide'),
  body('participants').isArray({ min: 1 }).withMessage('Au moins un participant requis'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description trop longue')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, type, participants, description, quartier, ville } = req.body;
    const creatorId = req.user.id;

    // Vérifier que tous les participants existent
    const existingUsers = await User.find({
      _id: { $in: participants }
    });

    if (existingUsers.length !== participants.length) {
      return res.status(400).json({
        success: false,
        message: 'Certains utilisateurs n\'existent pas'
      });
    }

    let conversation;

    if (type === 'private' && participants.length === 1) {
      // Conversation privée
      conversation = await Conversation.createPrivateConversation(creatorId, participants[0]);
    } else {
      // Conversation de groupe
      conversation = await Conversation.createGroupConversation(name, creatorId, participants);
      
      if (description) conversation.description = description;
      if (quartier) conversation.quartier = quartier;
      if (ville) conversation.ville = ville;
      
      await conversation.save();
    }

    await conversation.populate('participants.user', 'firstName lastName avatar quartier ville');

    res.json({
      success: true,
      message: 'Conversation créée avec succès',
      conversation
    });
  } catch (error) {
    console.error('Erreur lors de la création de la conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/messages/conversation/:conversationId - Mettre à jour une conversation
router.put('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { name, description, avatar } = req.body;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      conversationId,
      'participants.user': userId,
      isDeleted: false
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }

    // Vérifier les permissions (seuls les admins peuvent modifier)
    const participant = conversation.participants.find(
      p => p.user.toString() === userId
    );

    if (participant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    if (name) conversation.name = name;
    if (description) conversation.description = description;
    if (avatar) conversation.avatar = avatar;

    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation mise à jour',
      conversation
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// DELETE /api/messages/:messageId - Supprimer un message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Vérifier que l'utilisateur peut supprimer ce message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez supprimer que vos propres messages'
      });
    }

    await message.softDelete(userId);

    res.json({
      success: true,
      message: 'Message supprimé'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/messages/search - Rechercher des messages
router.get('/search', auth, async (req, res) => {
  try {
    const { query, conversationId } = req.query;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis'
      });
    }

    const searchQuery = {
      content: { $regex: query, $options: 'i' },
      isDeleted: false,
      $or: [
        { sender: userId },
        { recipients: userId }
      ]
    };

    if (conversationId) {
      searchQuery.conversationId = conversationId;
    }

    const messages = await Message.find(searchQuery)
      .populate('sender', 'firstName lastName avatar')
      .populate('recipients', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router; 