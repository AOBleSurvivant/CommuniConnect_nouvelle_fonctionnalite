const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Envoyer une demande d'ami
router.post('/request', auth, [
  body('recipientId').notEmpty().withMessage('ID du destinataire requis')
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

    const { recipientId } = req.body;
    const requesterId = req.user._id || req.user.id;

    // En mode développement, créer une demande fictive
    const friendRequest = {
      _id: `req-${Date.now()}`,
      requester: {
        _id: requesterId,
        firstName: req.user.firstName || 'Test',
        lastName: req.user.lastName || 'User'
      },
      recipient: {
        _id: recipientId,
        firstName: 'Autre',
        lastName: 'Utilisateur'
      },
      status: 'pending',
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Demande d\'ami envoyée avec succès',
      friendRequest
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la demande d\'ami:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Récupérer la liste d'amis
router.get('/list', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // En mode développement, retourner des amis fictifs
    const friends = [
      {
        _id: 'friend-1',
        firstName: 'Ami',
        lastName: 'Test',
        email: 'ami@test.com',
        status: 'accepted',
        friendshipId: 'friendship-1'
      }
    ];

    res.json({
      success: true,
      friends
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la liste d\'amis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Récupérer les demandes d'amis reçues
router.get('/requests', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // En mode développement, retourner des demandes fictives
    const requests = [
      {
        _id: 'req-1',
        requester: {
          _id: 'user-2',
          firstName: 'Demandeur',
          lastName: 'Test'
        },
        status: 'pending',
        createdAt: new Date()
      }
    ];

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes d\'amis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Accepter une demande d'ami
router.post('/accept/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    res.json({
      success: true,
      message: 'Demande d\'ami acceptée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'acceptation de la demande d\'ami:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Rejeter une demande d'ami
router.post('/reject/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    res.json({
      success: true,
      message: 'Demande d\'ami rejetée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du rejet de la demande d\'ami:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Supprimer un ami
router.delete('/remove/:friendshipId', auth, async (req, res) => {
  try {
    const { friendshipId } = req.params;

    res.json({
      success: true,
      message: 'Ami supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression d\'ami:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router; 