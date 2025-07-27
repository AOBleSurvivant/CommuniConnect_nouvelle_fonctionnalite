const express = require('express');
const router = express.Router();

// GET /api/locations - Route de base pour vérifier l'état du service
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Service de localisation opérationnel',
    endpoints: {
      guinea: '/api/locations/guinea',
      regions: '/api/locations/regions',
      prefectures: '/api/locations/prefectures',
      communes: '/api/locations/communes'
    }
  });
});

// Données fictives pour le développement
const guineaGeography = {
  regions: [
    {
      name: 'Conakry',
      prefectures: [
        {
          name: 'Conakry',
          communes: [
            {
              name: 'Kaloum',
              quartiers: ['Centre', 'Almamya', 'Sandervalia', 'Coronthie'],
              coordinates: { latitude: 9.5144, longitude: -13.6783 }
            },
            {
              name: 'Dixinn',
              quartiers: ['Dixinn', 'Lansanaya', 'Ratoma', 'Kipé'],
              coordinates: { latitude: 9.5370, longitude: -13.6785 }
            },
            {
              name: 'Matam',
              quartiers: ['Matam', 'Matoto', 'Matoto Centre', 'Kobaya'],
              coordinates: { latitude: 9.5500, longitude: -13.6500 }
            },
            {
              name: 'Ratoma',
              quartiers: ['Ratoma', 'Cosa', 'Hamdallaye', 'Tomboyah'],
              coordinates: { latitude: 9.5200, longitude: -13.7000 }
            }
          ]
        }
      ]
    },
    {
      name: 'Kindia',
      prefectures: [
        {
          name: 'Kindia',
          communes: [
            {
              name: 'Kindia Centre',
              quartiers: ['Centre', 'Bambeto', 'Simbaya'],
              coordinates: { latitude: 10.0569, longitude: -12.8653 }
            }
          ]
        }
      ]
    }
  ]
};

// Données fictives pour les marqueurs
let mapMarkers = [
  {
    _id: '1',
    type: 'alert',
    title: 'Accident de circulation',
    description: 'Accident sur la route principale, circulation ralentie',
    severity: 'high',
    location: {
      coordinates: { latitude: 9.5144, longitude: -13.6783 },
      region: 'Conakry',
      prefecture: 'Conakry',
      commune: 'Kaloum',
      quartier: 'Centre'
    },
    author: {
      _id: 'user1',
      firstName: 'Mamadou',
      lastName: 'Diallo'
    },
    createdAt: new Date(Date.now() - 3600000), // 1 heure ago
    confirmed: 5,
    denied: 0
  },
  {
    _id: '2',
    type: 'event',
    title: 'Festival de musique',
    description: 'Grand festival de musique traditionnelle guinéenne',
    type: 'cultural',
    location: {
      coordinates: { latitude: 9.5370, longitude: -13.6785 },
      region: 'Conakry',
      prefecture: 'Conakry',
      commune: 'Dixinn',
      quartier: 'Dixinn'
    },
    organizer: {
      _id: 'user2',
      firstName: 'Fatou',
      lastName: 'Camara'
    },
    startDate: new Date(Date.now() + 86400000), // Demain
    endDate: new Date(Date.now() + 86400000 + 7200000), // +2h
    participants: 25,
    maxParticipants: 100
  },
  {
    _id: '3',
    type: 'help',
    title: 'Besoin d\'aide médicale',
    description: 'Personne âgée a besoin d\'aide pour se rendre à l\'hôpital',
    type: 'medical',
    location: {
      coordinates: { latitude: 9.5500, longitude: -13.6500 },
      region: 'Conakry',
      prefecture: 'Conakry',
      commune: 'Matam',
      quartier: 'Matam'
    },
    author: {
      _id: 'user3',
      firstName: 'Ibrahima',
      lastName: 'Sow'
    },
    createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
    urgency: 'high',
    helpers: 2,
    maxHelpers: 3
  },
  {
    _id: '4',
    type: 'post',
    content: 'Nouveau restaurant ouvert dans le quartier ! Venez découvrir la cuisine locale.',
    type: 'community',
    location: {
      coordinates: { latitude: 9.5200, longitude: -13.7000 },
      region: 'Conakry',
      prefecture: 'Conakry',
      commune: 'Ratoma',
      quartier: 'Ratoma'
    },
    author: {
      _id: 'user4',
      firstName: 'Aissatou',
      lastName: 'Bah'
    },
    createdAt: new Date(Date.now() - 7200000), // 2 heures ago
    reactions: { like: ['user1', 'user2'], love: ['user3'] },
    comments: [],
    shares: 1
  }
];

// GET /api/locations/geography - Récupérer les données géographiques de la Guinée
router.get('/geography', (req, res) => {
  try {
    res.json({
      success: true,
      data: guineaGeography
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données géographiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données géographiques'
    });
  }
});

// GET /api/locations/markers - Récupérer les marqueurs pour la carte
router.get('/markers', (req, res) => {
  try {
    const { bounds, type, severity, radius } = req.query;
    
    let filteredMarkers = [...mapMarkers];

    // Filtrer par type
    if (type && type !== 'all') {
      filteredMarkers = filteredMarkers.filter(marker => marker.type === type);
    }

    // Filtrer par sévérité (pour les alertes)
    if (severity && severity !== 'all') {
      filteredMarkers = filteredMarkers.filter(marker => 
        marker.type === 'alert' && marker.severity === severity
      );
    }

    // Filtrer par bounds (si fourni)
    if (bounds) {
      try {
        const boundsData = JSON.parse(bounds);
        const { _southWest, _northEast } = boundsData;
        
        filteredMarkers = filteredMarkers.filter(marker => {
          const { latitude, longitude } = marker.location.coordinates;
          return latitude >= _southWest.lat && 
                 latitude <= _northEast.lat && 
                 longitude >= _southWest.lng && 
                 longitude <= _northEast.lng;
        });
      } catch (error) {
        console.error('Erreur lors du parsing des bounds:', error);
      }
    }

    res.json({
      success: true,
      data: {
        markers: filteredMarkers,
        total: filteredMarkers.length
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des marqueurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des marqueurs'
    });
  }
});

// GET /api/locations/alerts - Récupérer les alertes géolocalisées
router.get('/alerts', (req, res) => {
  try {
    const alerts = mapMarkers.filter(marker => marker.type === 'alert');
    res.json({
      success: true,
      data: {
        alerts,
        total: alerts.length
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des alertes'
    });
  }
});

// GET /api/locations/events - Récupérer les événements géolocalisés
router.get('/events', (req, res) => {
  try {
    const events = mapMarkers.filter(marker => marker.type === 'event');
    res.json({
      success: true,
      data: {
        events,
        total: events.length
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

// GET /api/locations/help-requests - Récupérer les demandes d'aide géolocalisées
router.get('/help-requests', (req, res) => {
  try {
    const helpRequests = mapMarkers.filter(marker => marker.type === 'help');
    res.json({
      success: true,
      data: {
        helpRequests,
        total: helpRequests.length
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes d\'aide:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des demandes d\'aide'
    });
  }
});

// GET /api/locations/posts - Récupérer les posts géolocalisés
router.get('/posts', (req, res) => {
  try {
    const posts = mapMarkers.filter(marker => marker.type === 'post');
    res.json({
      success: true,
      data: {
        posts,
        total: posts.length
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des posts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des posts'
    });
  }
});

// GET /api/locations/geocode - Géocodage d'adresse
router.get('/geocode', (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Adresse requise'
      });
    }

    // Simulation de géocodage
    const geocodedAddresses = {
      'conakry': { latitude: 9.5370, longitude: -13.6785 },
      'kaloum': { latitude: 9.5144, longitude: -13.6783 },
      'dixinn': { latitude: 9.5370, longitude: -13.6785 },
      'matam': { latitude: 9.5500, longitude: -13.6500 },
      'ratoma': { latitude: 9.5200, longitude: -13.7000 },
      'kindia': { latitude: 10.0569, longitude: -12.8653 }
    };

    const normalizedAddress = address.toLowerCase().trim();
    const coordinates = geocodedAddresses[normalizedAddress];

    if (coordinates) {
      res.json({
        success: true,
        data: {
          address,
          coordinates,
          formatted_address: `${address}, Guinée`
        }
      });
    } else {
      // Coordonnées par défaut (Conakry)
      res.json({
        success: true,
        data: {
          address,
          coordinates: { latitude: 9.5370, longitude: -13.6785 },
          formatted_address: `${address}, Conakry, Guinée`
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors du géocodage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du géocodage'
    });
  }
});

// GET /api/locations/reverse-geocode - Géocodage inverse
router.get('/reverse-geocode', (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises'
      });
    }

    // Simulation de géocodage inverse
    const address = `Coordonnées: ${lat}, ${lng}`;
    
    res.json({
      success: true,
      data: {
        coordinates: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
        address,
        formatted_address: `${address}, Guinée`
      }
    });
  } catch (error) {
    console.error('Erreur lors du géocodage inverse:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du géocodage inverse'
    });
  }
});

// POST /api/locations/markers - Créer un nouveau marqueur
router.post('/markers', (req, res) => {
  try {
    const { type, title, description, location, author } = req.body;
    
    const newMarker = {
      _id: Date.now().toString(),
      type,
      title,
      description,
      location,
      author,
      createdAt: new Date()
    };

    mapMarkers.push(newMarker);

    res.status(201).json({
      success: true,
      message: 'Marqueur créé avec succès',
      data: newMarker
    });
  } catch (error) {
    console.error('Erreur lors de la création du marqueur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du marqueur'
    });
  }
});

module.exports = router; 