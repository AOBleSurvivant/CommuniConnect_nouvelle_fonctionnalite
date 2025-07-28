const express = require('express');
const { body, validationResult, query } = require('express-validator');
const auth = require('../middleware/auth');
const { validateGuineanLocation } = require('../middleware/geographicValidation');
const LiveStream = require('../models/LiveStream');

const router = express.Router();

// @route   GET /api/livestreams
// @desc    Obtenir les lives de la communauté locale
// @access  Public
router.get('/', [
  query('type').optional().isIn(['alert', 'event', 'meeting', 'sensitization', 'community']),
  query('urgency').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('quartier').optional().isString(),
  query('commune').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { type, urgency, quartier, commune } = req.query;

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - données fictives communautaires
      const mockLiveStreams = [
        {
          _id: '507f1f77bcf86cd799439041',
          type: 'alert',
          title: 'Incendie dans le quartier Centre',
          description: 'Incendie signalé rue principale, pompiers en route',
          status: 'live',
          urgency: 'critical',
          startedAt: new Date(Date.now() - 10 * 60 * 1000), // Il y a 10 minutes
          location: {
            region: 'Conakry',
            prefecture: 'Conakry',
            commune: 'Kaloum',
            quartier: 'Centre'
          },
          visibility: 'quartier',
          author: {
            _id: '507f1f77bcf86cd799439042',
            firstName: 'Mamadou',
            lastName: 'Diallo',
            profilePicture: null,
            isVerified: true
          },
          stats: {
            currentViewers: 23,
            totalViewers: 45,
            totalMessages: 12
          },
          viewers: [],
          messages: [
            {
              _id: '507f1f77bcf86cd799439043',
              user: {
                _id: '507f1f77bcf86cd799439044',
                firstName: 'Fatou',
                lastName: 'Camara',
                profilePicture: null
              },
              message: 'Les pompiers arrivent dans 5 minutes',
              timestamp: new Date(Date.now() - 2 * 60 * 1000)
            }
          ],
          reactions: [],
          createdAt: new Date(Date.now() - 10 * 60 * 1000),
          updatedAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439045',
          type: 'meeting',
          title: 'Réunion de quartier - Propreté',
          description: 'Réunion mensuelle pour discuter de la propreté du quartier',
          status: 'live',
          urgency: 'low',
          startedAt: new Date(Date.now() - 30 * 60 * 1000), // Il y a 30 minutes
          location: {
            region: 'Conakry',
            prefecture: 'Conakry',
            commune: 'Kaloum',
            quartier: 'Centre'
          },
          visibility: 'quartier',
          author: {
            _id: '507f1f77bcf86cd799439046',
            firstName: 'Ibrahima',
            lastName: 'Sow',
            profilePicture: null,
            isVerified: true
          },
          stats: {
            currentViewers: 15,
            totalViewers: 28,
            totalMessages: 8
          },
          viewers: [],
          messages: [],
          reactions: [],
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          updatedAt: new Date()
        }
      ];

      // Filtrer selon les critères
      let filteredStreams = mockLiveStreams.filter(stream => {
        if (type && stream.type !== type) return false;
        if (urgency && stream.urgency !== urgency) return false;
        if (quartier && stream.location.quartier !== quartier) return false;
        if (commune && stream.location.commune !== commune) return false;
        return true;
      });

      res.json({
        success: true,
        data: filteredStreams
      });
      return;
    }

    // Construire la requête
    let query = {
      status: 'live',
      'moderation.isReported': false
    };

    // Filtres
    if (type) query.type = type;
    if (urgency) query.urgency = urgency;
    if (quartier) query['location.quartier'] = quartier;
    if (commune) query['location.commune'] = commune;

    const streams = await LiveStream.find(query)
      .populate('author', 'firstName lastName profilePicture isVerified')
      .populate('viewers.user', 'firstName lastName profilePicture')
      .populate('messages.user', 'firstName lastName profilePicture')
      .sort({ urgency: -1, startedAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: streams
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des lives:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des lives'
    });
  }
});

// @route   GET /api/livestreams/alerts
// @desc    Obtenir les alertes en direct
// @access  Public
router.get('/alerts', async (req, res) => {
  try {
    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - alertes fictives
      const mockAlerts = [
        {
          _id: '507f1f77bcf86cd799439041',
          type: 'alert',
          title: 'Incendie dans le quartier Centre',
          description: 'Incendie signalé rue principale, pompiers en route',
          status: 'live',
          urgency: 'critical',
          startedAt: new Date(Date.now() - 10 * 60 * 1000),
          location: {
            region: 'Conakry',
            prefecture: 'Conakry',
            commune: 'Kaloum',
            quartier: 'Centre'
          },
          visibility: 'quartier',
          author: {
            _id: '507f1f77bcf86cd799439042',
            firstName: 'Mamadou',
            lastName: 'Diallo',
            profilePicture: null,
            isVerified: true
          },
          stats: {
            currentViewers: 23,
            totalViewers: 45,
            totalMessages: 12
          },
          createdAt: new Date(Date.now() - 10 * 60 * 1000),
          updatedAt: new Date()
        }
      ];

      res.json({
        success: true,
        data: mockAlerts
      });
      return;
    }

    const alerts = await LiveStream.getAlerts();

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des alertes'
    });
  }
});

// @route   GET /api/livestreams/community
// @desc    Obtenir les lives de la communauté locale
// @access  Public
router.get('/community', [
  query('quartier').isString().withMessage('Quartier requis'),
  query('commune').isString().withMessage('Commune requise')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { quartier, commune } = req.query;

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - lives communautaires fictifs
      const mockCommunityStreams = [
        {
          _id: '507f1f77bcf86cd799439041',
          type: 'alert',
          title: 'Incendie dans le quartier Centre',
          description: 'Incendie signalé rue principale, pompiers en route',
          status: 'live',
          urgency: 'critical',
          startedAt: new Date(Date.now() - 10 * 60 * 1000),
          location: {
            region: 'Conakry',
            prefecture: 'Conakry',
            commune: 'Kaloum',
            quartier: 'Centre'
          },
          visibility: 'quartier',
          author: {
            _id: '507f1f77bcf86cd799439042',
            firstName: 'Mamadou',
            lastName: 'Diallo',
            profilePicture: null,
            isVerified: true
          },
          stats: {
            currentViewers: 23,
            totalViewers: 45,
            totalMessages: 12
          },
          createdAt: new Date(Date.now() - 10 * 60 * 1000),
          updatedAt: new Date()
        }
      ];

      res.json({
        success: true,
        data: mockCommunityStreams
      });
      return;
    }

    const streams = await LiveStream.getCommunityStreams(quartier, commune);

    res.json({
      success: true,
      data: streams
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des lives communautaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des lives communautaires'
    });
  }
});

// @route   GET /api/livestreams/:id
// @desc    Obtenir un live spécifique
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - live fictif
      const mockStream = {
        _id: id,
        type: 'alert',
        title: 'Incendie dans le quartier Centre',
        description: 'Incendie signalé rue principale, pompiers en route',
        status: 'live',
        urgency: 'critical',
        startedAt: new Date(Date.now() - 10 * 60 * 1000),
        location: {
          region: 'Conakry',
          prefecture: 'Conakry',
          commune: 'Kaloum',
          quartier: 'Centre'
        },
        visibility: 'quartier',
        author: {
          _id: '507f1f77bcf86cd799439042',
          firstName: 'Mamadou',
          lastName: 'Diallo',
          profilePicture: null,
          isVerified: true
        },
        stats: {
          currentViewers: 23,
          totalViewers: 45,
          totalMessages: 12
        },
        messages: [
          {
            _id: '507f1f77bcf86cd799439043',
            user: {
              _id: '507f1f77bcf86cd799439044',
              firstName: 'Fatou',
              lastName: 'Camara',
              profilePicture: null
            },
            message: 'Les pompiers arrivent dans 5 minutes',
            timestamp: new Date(Date.now() - 2 * 60 * 1000)
          },
          {
            _id: '507f1f77bcf86cd799439045',
            user: {
              _id: '507f1f77bcf86cd799439046',
              firstName: 'Ibrahima',
              lastName: 'Sow',
              profilePicture: null
            },
            message: 'Évitez la rue principale',
            timestamp: new Date(Date.now() - 1 * 60 * 1000)
          }
        ],
        reactions: [
          {
            _id: '507f1f77bcf86cd799439047',
            user: {
              _id: '507f1f77bcf86cd799439044',
              firstName: 'Fatou',
              lastName: 'Camara'
            },
            type: 'alert',
            timestamp: new Date(Date.now() - 5 * 60 * 1000)
          }
        ],
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        updatedAt: new Date()
      };

      res.json({
        success: true,
        data: mockStream
      });
      return;
    }

    const stream = await LiveStream.findById(id)
      .populate('author', 'firstName lastName profilePicture isVerified')
      .populate('viewers.user', 'firstName lastName profilePicture')
      .populate('messages.user', 'firstName lastName profilePicture')
      .populate('reactions.user', 'firstName lastName profilePicture');

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live non trouvé'
      });
    }

    res.json({
      success: true,
      data: stream
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du live:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du live'
    });
  }
});

// POST /api/livestreams - Créer un nouveau livestream (version simplifiée)
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      type = 'community',
      urgency = 'low',
      isPublic = true,
      location
    } = req.body;

    // En mode développement, utiliser des données par défaut
    const defaultLocation = {
      region: 'Conakry',
      prefecture: 'Conakry',
      commune: 'Kaloum',
      quartier: 'Centre',
      coordinates: {
        latitude: 9.537,
        longitude: -13.6785
      }
    };

    const newLivestream = {
      _id: Date.now().toString(),
      title,
      description,
      type,
      urgency,
      status: 'pending',
      isPublic,
      location: location || defaultLocation,
      author: {
        _id: req.user._id || req.user.id,
        firstName: req.user.firstName || 'Utilisateur',
        lastName: req.user.lastName || 'OAuth',
        profilePicture: null,
        isVerified: true
      },
      stats: {
        currentViewers: 0,
        totalViewers: 0,
        totalMessages: 0
      },
      viewers: [],
      messages: [],
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // En mode développement, simuler l'ajout à une base de données
    if (process.env.NODE_ENV === 'development') {
      // Simuler un succès
      return res.status(201).json({
        success: true,
        message: 'Livestream créé avec succès',
        livestream: newLivestream
      });
    }

    // En production, sauvegarder dans MongoDB
    const livestream = new LiveStream(newLivestream);
    await livestream.save();

    res.status(201).json({
      success: true,
      message: 'Livestream créé avec succès',
      livestream
    });

  } catch (error) {
    console.error('Erreur lors de la création du livestream:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du livestream'
    });
  }
});

// @route   POST /api/livestreams/:id/start
// @desc    Démarrer un live
// @access  Private (auteur uniquement)
router.post('/:id/start', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - simulation de démarrage
      const mockStream = {
        _id: id,
        type: 'alert',
        title: 'Incendie dans le quartier Centre',
        description: 'Incendie signalé rue principale, pompiers en route',
        status: 'live',
        urgency: 'critical',
        startedAt: new Date(),
        location: {
          region: 'Conakry',
          prefecture: 'Conakry',
          commune: 'Kaloum',
          quartier: 'Centre'
        },
        visibility: 'quartier',
        author: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          profilePicture: req.user.profilePicture,
          isVerified: req.user.isVerified
        },
        stats: {
          currentViewers: 0,
          totalViewers: 0,
          totalMessages: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      res.json({
        success: true,
        message: 'Live démarré avec succès',
        data: mockStream
      });
      return;
    }

    const stream = await LiveStream.findById(id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (stream.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à démarrer ce live'
      });
    }

    // Vérifier que le live n'est pas déjà en cours
    if (stream.status === 'live') {
      return res.status(400).json({
        success: false,
        message: 'Le live est déjà en cours'
      });
    }

    await stream.startStream();

    res.json({
      success: true,
      message: 'Live démarré avec succès',
      data: stream
    });

  } catch (error) {
    console.error('Erreur lors du démarrage du live:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du démarrage du live'
    });
  }
});

// @route   POST /api/livestreams/:id/end
// @desc    Arrêter un live
// @access  Private (auteur uniquement)
router.post('/:id/end', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - simulation d'arrêt
      const mockStream = {
        _id: id,
        type: 'alert',
        title: 'Incendie dans le quartier Centre',
        description: 'Incendie signalé rue principale, pompiers en route',
        status: 'ended',
        urgency: 'critical',
        startedAt: new Date(Date.now() - 30 * 60 * 1000),
        endedAt: new Date(),
        location: {
          region: 'Conakry',
          prefecture: 'Conakry',
          commune: 'Kaloum',
          quartier: 'Centre'
        },
        visibility: 'quartier',
        author: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          profilePicture: req.user.profilePicture,
          isVerified: req.user.isVerified
        },
        stats: {
          currentViewers: 0,
          totalViewers: 45,
          totalMessages: 12
        },
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        updatedAt: new Date()
      };

      res.json({
        success: true,
        message: 'Live arrêté avec succès',
        data: mockStream
      });
      return;
    }

    const stream = await LiveStream.findById(id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (stream.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à arrêter ce live'
      });
    }

    // Vérifier que le live est en cours
    if (stream.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Le live n\'est pas en cours'
      });
    }

    await stream.endStream();

    res.json({
      success: true,
      message: 'Live arrêté avec succès',
      data: stream
    });

  } catch (error) {
    console.error('Erreur lors de l\'arrêt du live:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'arrêt du live'
    });
  }
});

// @route   POST /api/livestreams/:id/join
// @desc    Rejoindre un live comme spectateur
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - simulation de rejoindre
      res.json({
        success: true,
        message: 'Spectateur ajouté avec succès'
      });
      return;
    }

    const stream = await LiveStream.findById(id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live non trouvé'
      });
    }

    // Vérifier que le live est en cours
    if (stream.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Le live n\'est pas en cours'
      });
    }

    await stream.addViewer(req.user._id);

    res.json({
      success: true,
      message: 'Spectateur ajouté avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout du spectateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du spectateur'
    });
  }
});

// @route   POST /api/livestreams/:id/leave
// @desc    Quitter un live
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - simulation de quitter
      res.json({
        success: true,
        message: 'Spectateur retiré avec succès'
      });
      return;
    }

    const stream = await LiveStream.findById(id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live non trouvé'
      });
    }

    await stream.removeViewer(req.user._id);

    res.json({
      success: true,
      message: 'Spectateur retiré avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du retrait du spectateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait du spectateur'
    });
  }
});

// @route   POST /api/livestreams/:id/message
// @desc    Envoyer un message dans le chat
// @access  Private
router.post('/:id/message', [
  auth,
  body('message')
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Le message doit contenir entre 1 et 150 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { message } = req.body;

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - simulation de message
      const mockMessage = {
        _id: '507f1f77bcf86cd799439051',
        user: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          profilePicture: req.user.profilePicture
        },
        message,
        timestamp: new Date()
      };

      res.json({
        success: true,
        message: 'Message envoyé avec succès',
        data: mockMessage
      });
      return;
    }

    const stream = await LiveStream.findById(id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live non trouvé'
      });
    }

    // Vérifier que le live est en cours
    if (stream.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Le live n\'est pas en cours'
      });
    }

    // Vérifier que les commentaires sont autorisés
    if (!stream.settings.allowComments) {
      return res.status(400).json({
        success: false,
        message: 'Les commentaires sont désactivés pour ce live'
      });
    }

    await stream.addMessage(req.user._id, message);

    res.json({
      success: true,
      message: 'Message envoyé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message'
    });
  }
});

// @route   POST /api/livestreams/:id/reaction
// @desc    Ajouter une réaction
// @access  Private
router.post('/:id/reaction', [
  auth,
  body('type')
    .isIn(['like', 'love', 'alert'])
    .withMessage('Type de réaction invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { type } = req.body;

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - simulation de réaction
      const mockReaction = {
        _id: '507f1f77bcf86cd799439052',
        user: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          profilePicture: req.user.profilePicture
        },
        type,
        timestamp: new Date()
      };

      res.json({
        success: true,
        message: 'Réaction ajoutée avec succès',
        data: mockReaction
      });
      return;
    }

    const stream = await LiveStream.findById(id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live non trouvé'
      });
    }

    // Vérifier que le live est en cours
    if (stream.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Le live n\'est pas en cours'
      });
    }

    // Vérifier que les réactions sont autorisées
    if (!stream.settings.allowReactions) {
      return res.status(400).json({
        success: false,
        message: 'Les réactions sont désactivées pour ce live'
      });
    }

    await stream.addReaction(req.user._id, type);

    res.json({
      success: true,
      message: 'Réaction ajoutée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout de la réaction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la réaction'
    });
  }
});

module.exports = router; 