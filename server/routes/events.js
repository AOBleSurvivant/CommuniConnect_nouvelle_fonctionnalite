const express = require('express');
const { body, validationResult, query } = require('express-validator');
const auth = require('../middleware/auth');
const { validateGuineanLocation } = require('../middleware/geographicValidation');
const Event = require('../models/Event');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/events
// @desc    Obtenir tous les événements avec filtres
// @access  Public
router.get('/', [
  query('type').optional().isIn(['reunion', 'formation', 'nettoyage', 'festival', 'sport', 'culture', 'sante', 'education', 'autre']),
  query('category').optional().isIn(['communautaire', 'professionnel', 'educatif', 'culturel', 'sportif', 'sante', 'environnement', 'social', 'autre']),
  query('status').optional().isIn(['draft', 'published', 'cancelled', 'completed', 'postponed']),
  query('region').optional().isString(),
  query('prefecture').optional().isString(),
  query('commune').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('latitude').optional().isFloat(),
  query('longitude').optional().isFloat(),
  query('radius').optional().isFloat({ min: 0.1, max: 50 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
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
      category,
      status = 'published',
      region,
      prefecture,
      commune,
      limit = 20,
      page = 1,
      latitude,
      longitude,
      radius = 10,
      startDate,
      endDate
    } = req.query;

    // Construire la requête
    let query = {
      'moderation.isHidden': false
    };

    // Filtres
    if (status) query.status = status;
    if (type) query.type = type;
    if (category) query.category = category;
    if (region) query['location.region'] = region;
    if (prefecture) query['location.prefecture'] = prefecture;
    if (commune) query['location.commune'] = commune;

    // Filtres de date
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Recherche géographique si coordonnées fournies
    if (latitude && longitude) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000 // Convertir en mètres
        }
      };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - utiliser des données fictives
      const mockEvents = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Réunion de quartier - Propreté et sécurité',
          description: 'Réunion mensuelle pour discuter de la propreté et de la sécurité du quartier',
          type: 'reunion',
          category: 'communautaire',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2h
          startTime: '18:00',
          endTime: '20:00',
          location: {
            coordinates: { latitude: 9.5370, longitude: -13.6785 },
            region: 'Conakry',
            prefecture: 'Conakry',
            commune: 'Kaloum',
            quartier: 'Centre',
            address: 'Salle communale du quartier',
            venue: 'Salle communale'
          },
          organizer: {
            _id: '507f1f77bcf86cd799439012',
            firstName: 'Mamadou',
            lastName: 'Diallo',
            profilePicture: null,
            isVerified: true
          },
          status: 'published',
          visibility: 'public',
          participants: [],
          media: { images: [], videos: [], documents: [] },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439013',
          title: 'Formation en informatique pour débutants',
          description: 'Formation gratuite pour apprendre les bases de l\'informatique',
          type: 'formation',
          category: 'educatif',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Dans 14 jours
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3h
          startTime: '14:00',
          endTime: '17:00',
          location: {
            coordinates: { latitude: 9.5370, longitude: -13.6785 },
            region: 'Conakry',
            prefecture: 'Conakry',
            commune: 'Kaloum',
            quartier: 'Centre',
            address: 'Centre de formation informatique',
            venue: 'Centre de formation'
          },
          organizer: {
            _id: '507f1f77bcf86cd799439014',
            firstName: 'Fatou',
            lastName: 'Camara',
            profilePicture: null,
            isVerified: true
          },
          status: 'published',
          visibility: 'public',
          participants: [],
          media: { images: [], videos: [], documents: [] },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Filtrer les événements selon les critères
      let filteredEvents = mockEvents.filter(event => {
        if (status && event.status !== status) return false;
        if (type && event.type !== type) return false;
        if (category && event.category !== category) return false;
        if (region && event.location.region !== region) return false;
        if (prefecture && event.location.prefecture !== prefecture) return false;
        if (commune && event.location.commune !== commune) return false;
        return true;
      });

      // Pagination
      const total = filteredEvents.length;
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const events = filteredEvents.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          events,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
      return;
    }

    // En mode production, utiliser MongoDB
    const events = await Event.find(query)
      .populate('organizer', 'firstName lastName profilePicture isVerified')
      .populate('coOrganizers.user', 'firstName lastName profilePicture')
      .populate('participants.user', 'firstName lastName profilePicture')
      .sort({ startDate: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Compter le total
    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements'
    });
  }
});

// @route   GET /api/events/upcoming
// @desc    Obtenir les événements à venir
// @access  Public
router.get('/upcoming', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - utiliser des données fictives
      const mockEvents = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Réunion de quartier - Propreté et sécurité',
          description: 'Réunion mensuelle pour discuter de la propreté et de la sécurité du quartier',
          type: 'reunion',
          category: 'communautaire',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2h
          startTime: '18:00',
          endTime: '20:00',
          location: {
            coordinates: { latitude: 9.5370, longitude: -13.6785 },
            region: 'Conakry',
            prefecture: 'Conakry',
            commune: 'Kaloum',
            quartier: 'Centre',
            address: 'Salle communale du quartier',
            venue: 'Salle communale'
          },
          organizer: {
            _id: '507f1f77bcf86cd799439012',
            firstName: 'Mamadou',
            lastName: 'Diallo',
            profilePicture: null,
            isVerified: true
          },
          status: 'published',
          visibility: 'public',
          participants: [],
          media: { images: [], videos: [], documents: [] },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439013',
          title: 'Formation en informatique pour débutants',
          description: 'Formation gratuite pour apprendre les bases de l\'informatique',
          type: 'formation',
          category: 'educatif',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Dans 14 jours
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3h
          startTime: '14:00',
          endTime: '17:00',
          location: {
            coordinates: { latitude: 9.5370, longitude: -13.6785 },
            region: 'Conakry',
            prefecture: 'Conakry',
            commune: 'Kaloum',
            quartier: 'Centre',
            address: 'Centre de formation informatique',
            venue: 'Centre de formation'
          },
          organizer: {
            _id: '507f1f77bcf86cd799439014',
            firstName: 'Fatou',
            lastName: 'Camara',
            profilePicture: null,
            isVerified: true
          },
          status: 'published',
          visibility: 'public',
          participants: [],
          media: { images: [], videos: [], documents: [] },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Filtrer les événements à venir (date de début > maintenant)
      const upcomingEvents = mockEvents
        .filter(event => event.startDate > new Date())
        .sort((a, b) => a.startDate - b.startDate)
        .slice(0, parseInt(limit));

      res.json({
        success: true,
        data: upcomingEvents
      });
      return;
    }

    const events = await Event.findUpcoming(parseInt(limit));

    res.json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des événements à venir:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements à venir'
    });
  }
});

// @route   GET /api/events/nearby
// @desc    Obtenir les événements à proximité
// @access  Public
router.get('/nearby', [
  query('latitude').isFloat().withMessage('Latitude invalide'),
  query('longitude').isFloat().withMessage('Longitude invalide'),
  query('radius').optional().isFloat({ min: 0.1, max: 50 }).withMessage('Rayon invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { latitude, longitude, radius = 10 } = req.query;

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - utiliser des données fictives
      const mockEvents = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Réunion de quartier - Propreté et sécurité',
          description: 'Réunion mensuelle pour discuter de la propreté et de la sécurité du quartier',
          type: 'reunion',
          category: 'communautaire',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2h
          startTime: '18:00',
          endTime: '20:00',
          location: {
            coordinates: { latitude: 9.5370, longitude: -13.6785 },
            region: 'Conakry',
            prefecture: 'Conakry',
            commune: 'Kaloum',
            quartier: 'Centre',
            address: 'Salle communale du quartier',
            venue: 'Salle communale'
          },
          organizer: {
            _id: '507f1f77bcf86cd799439012',
            firstName: 'Mamadou',
            lastName: 'Diallo',
            profilePicture: null,
            isVerified: true
          },
          status: 'published',
          visibility: 'public',
          participants: [],
          media: { images: [], videos: [], documents: [] },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439013',
          title: 'Formation en informatique pour débutants',
          description: 'Formation gratuite pour apprendre les bases de l\'informatique',
          type: 'formation',
          category: 'educatif',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Dans 14 jours
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3h
          startTime: '14:00',
          endTime: '17:00',
          location: {
            coordinates: { latitude: 9.5370, longitude: -13.6785 },
            region: 'Conakry',
            prefecture: 'Conakry',
            commune: 'Kaloum',
            quartier: 'Centre',
            address: 'Centre de formation informatique',
            venue: 'Centre de formation'
          },
          organizer: {
            _id: '507f1f77bcf86cd799439014',
            firstName: 'Fatou',
            lastName: 'Camara',
            profilePicture: null,
            isVerified: true
          },
          status: 'published',
          visibility: 'public',
          participants: [],
          media: { images: [], videos: [], documents: [] },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Calculer la distance et filtrer les événements à proximité
      const nearbyEvents = mockEvents.filter(event => {
        const eventLat = event.location.coordinates.latitude;
        const eventLng = event.location.coordinates.longitude;
        
        // Calcul simple de distance (formule de Haversine simplifiée)
        const latDiff = Math.abs(parseFloat(latitude) - eventLat);
        const lngDiff = Math.abs(parseFloat(longitude) - eventLng);
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Approximation en km
        
        return distance <= parseFloat(radius);
      });

      res.json({
        success: true,
        data: nearbyEvents
      });
      return;
    }

    const events = await Event.findByLocation(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius)
    );

    res.json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des événements à proximité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements à proximité'
    });
  }
});

// @route   GET /api/events/:id
// @desc    Obtenir un événement spécifique
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName profilePicture isVerified')
      .populate('coOrganizers.user', 'firstName lastName profilePicture')
      .populate('participants.user', 'firstName lastName profilePicture');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Vérifier si l'événement est caché
    if (event.moderation.isHidden) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    res.json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'événement'
    });
  }
});

// @route   POST /api/events
// @desc    Créer un nouvel événement
// @access  Private
router.post('/', [
  auth,
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Le titre doit contenir entre 5 et 100 caractères'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La description doit contenir entre 10 et 2000 caractères'),
  
  body('type')
    .isIn(['reunion', 'formation', 'nettoyage', 'festival', 'sport', 'culture', 'sante', 'education', 'autre'])
    .withMessage('Type d\'événement invalide'),
  
  body('category')
    .isIn(['communautaire', 'professionnel', 'educatif', 'culturel', 'sportif', 'sante', 'environnement', 'social', 'autre'])
    .withMessage('Catégorie d\'événement invalide'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Date de début invalide'),
  
  body('endDate')
    .isISO8601()
    .withMessage('Date de fin invalide'),
  
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Heure de début invalide (format HH:MM)'),
  
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Heure de fin invalide (format HH:MM)'),
  
  body('latitude')
    .isFloat({ min: 7.1935, max: 12.6769 })
    .withMessage('La latitude doit être dans les limites de la Guinée'),
  
  body('longitude')
    .isFloat({ min: -15.0820, max: -7.6411 })
    .withMessage('La longitude doit être dans les limites de la Guinée'),
  
  body('venue')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le lieu doit contenir entre 2 et 100 caractères'),
  
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('L\'adresse doit contenir entre 5 et 200 caractères'),
  
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('La capacité doit être entre 1 et 10000'),
  
  body('isFree')
    .optional()
    .isBoolean()
    .withMessage('isFree doit être un booléen'),
  
  body('price.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix ne peut pas être négatif')
], validateGuineanLocation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      type,
      category,
      startDate,
      endDate,
      startTime,
      endTime,
      venue,
      address,
      capacity,
      isFree = true,
      price = { amount: 0, currency: 'GNF' },
      tags = []
    } = req.body;

    const validatedLocation = req.validatedLocation;

    // Vérifier que la date de fin est postérieure à la date de début
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'La date de fin doit être postérieure à la date de début'
      });
    }

    // En mode développement, créer un événement fictif
    const event = {
      _id: require('crypto').randomBytes(16).toString('hex'),
      title,
      description,
      type,
      category,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime,
      endTime,
      location: {
        coordinates: validatedLocation.coordinates,
        region: validatedLocation.region,
        prefecture: validatedLocation.prefecture,
        commune: validatedLocation.commune,
        quartier: validatedLocation.quartier,
        address,
        venue
      },
      organizer: req.user._id,
      coOrganizers: [],
      capacity: capacity || null,
      isFree,
      price,
      participants: [],
      media: {
        images: [],
        videos: [],
        documents: []
      },
      status: 'published',
      visibility: 'public',
      tags: [type, category, ...tags],
      requirements: {
        ageMin: null,
        ageMax: null,
        gender: 'all',
        specialRequirements: []
      },
      contact: {
        phone: req.user.phone || '',
        email: req.user.email || '',
        whatsapp: '',
        website: ''
      },
      moderation: {
        isReported: false,
        reports: [],
        isHidden: false
      },
      statistics: {
        views: 0,
        shares: 0,
        notificationsSent: 0,
        participantsCount: 0
      },
      metadata: {
        language: 'fr',
        timezone: 'Africa/Conakry',
        recurring: {
          isRecurring: false
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Événement créé avec succès',
      data: event
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'événement'
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Mettre à jour un événement
// @access  Private (organisateur ou co-organisateur)
router.put('/:id', [
  auth,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Le titre doit contenir entre 5 et 100 caractères'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La description doit contenir entre 10 et 2000 caractères'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'cancelled', 'completed', 'postponed'])
    .withMessage('Statut invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'organisateur ou un co-organisateur
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    const isCoOrganizer = event.coOrganizers.some(co => co.user.toString() === req.user._id.toString());
    
    if (!isOrganizer && !isCoOrganizer && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier cet événement'
      });
    }

    // Mettre à jour les champs
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        event[key] = req.body[key];
      }
    });

    event.updatedAt = new Date();
    await event.save();

    res.json({
      success: true,
      message: 'Événement mis à jour avec succès',
      data: event
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'événement'
    });
  }
});

// @route   POST /api/events/:id/participate
// @desc    Participer à un événement
// @access  Private
router.post('/:id/participate', [
  auth,
  body('status')
    .optional()
    .isIn(['confirmed', 'pending', 'declined', 'maybe'])
    .withMessage('Statut invalide')
], async (req, res) => {
  try {
    const { status = 'confirmed' } = req.body;

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - simulation de participation
      const mockEvent = {
        _id: req.params.id,
        title: 'Réunion de quartier - Propreté et sécurité',
        description: 'Réunion mensuelle pour discuter de la propreté et de la sécurité du quartier',
        type: 'reunion',
        category: 'communautaire',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        startTime: '18:00',
        endTime: '20:00',
        location: {
          coordinates: { latitude: 9.5370, longitude: -13.6785 },
          region: 'Conakry',
          prefecture: 'Conakry',
          commune: 'Kaloum',
          quartier: 'Centre',
          address: 'Salle communale du quartier',
          venue: 'Salle communale'
        },
        organizer: {
          _id: '507f1f77bcf86cd799439012',
          firstName: 'Mamadou',
          lastName: 'Diallo',
          profilePicture: null,
          isVerified: true
        },
        status: 'published',
        visibility: 'public',
        participants: [
          {
            user: {
              _id: req.user._id,
              firstName: req.user.firstName,
              lastName: req.user.lastName,
              profilePicture: req.user.profilePicture
            },
            status: status,
            registeredAt: new Date(),
            attended: false
          }
        ],
        media: { images: [], videos: [], documents: [] },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      res.json({
        success: true,
        message: 'Participation enregistrée avec succès',
        data: mockEvent
      });
      return;
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Vérifier si l'événement est complet
    if (event.isFull && status === 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'L\'événement est complet'
      });
    }

    await event.addParticipant(req.user._id, status);

    res.json({
      success: true,
      message: 'Participation enregistrée avec succès',
      data: event
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription à l\'événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription à l\'événement'
    });
  }
});

// @route   DELETE /api/events/:id/participate
// @desc    Se désinscrire d'un événement
// @access  Private
router.delete('/:id/participate', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    await event.removeParticipant(req.user._id);

    res.json({
      success: true,
      message: 'Désinscription effectuée avec succès',
      data: event
    });

  } catch (error) {
    console.error('Erreur lors de la désinscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désinscription'
    });
  }
});

// @route   POST /api/events/:id/report
// @desc    Signaler un événement
// @access  Private
router.post('/:id/report', [
  auth,
  body('reason')
    .isIn(['inappropriate', 'spam', 'false_information', 'duplicate', 'other'])
    .withMessage('Raison de signalement invalide'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { reason, description } = req.body;

    // Vérifier si MongoDB est disponible
    if (process.env.NODE_ENV === 'development' && global.mongoConnected === false) {
      // Mode développement sans MongoDB - simulation de signalement
      const mockEvent = {
        _id: req.params.id,
        title: 'Réunion de quartier - Propreté et sécurité',
        description: 'Réunion mensuelle pour discuter de la propreté et de la sécurité du quartier',
        type: 'reunion',
        category: 'communautaire',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        startTime: '18:00',
        endTime: '20:00',
        location: {
          coordinates: { latitude: 9.5370, longitude: -13.6785 },
          region: 'Conakry',
          prefecture: 'Conakry',
          commune: 'Kaloum',
          quartier: 'Centre',
          address: 'Salle communale du quartier',
          venue: 'Salle communale'
        },
        organizer: {
          _id: '507f1f77bcf86cd799439012',
          firstName: 'Mamadou',
          lastName: 'Diallo',
          profilePicture: null,
          isVerified: true
        },
        status: 'published',
        visibility: 'public',
        moderation: {
          isReported: true,
          reports: [
            {
              user: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName
              },
              reason: reason,
              description: description,
              reportedAt: new Date()
            }
          ],
          isHidden: false
        },
        media: { images: [], videos: [], documents: [] },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      res.json({
        success: true,
        message: 'Événement signalé avec succès'
      });
      return;
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    await event.report(req.user._id, reason, description);

    res.json({
      success: true,
      message: 'Événement signalé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du signalement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du signalement'
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Supprimer un événement
// @access  Private (organisateur uniquement)
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'organisateur
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer cet événement'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Événement supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'événement'
    });
  }
});

module.exports = router; 