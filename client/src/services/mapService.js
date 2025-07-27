import api from './api';

const MAP_URL = '/api/locations';

export const mapService = {
  // Récupérer les données géographiques de la Guinée
  getGuineaGeography: async () => {
    try {
      const response = await api.get(`${MAP_URL}/geography`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données géographiques:', error);
      // Retourner des données par défaut en cas d'erreur
      return {
        regions: [
          {
            name: 'Conakry',
            prefectures: [
              {
                name: 'Conakry',
                communes: [
                  {
                    name: 'Kaloum',
                    quartiers: ['Centre', 'Almamya', 'Sandervalia', 'Coronthie']
                  },
                  {
                    name: 'Dixinn',
                    quartiers: ['Dixinn', 'Lansanaya', 'Ratoma', 'Kipé']
                  },
                  {
                    name: 'Matam',
                    quartiers: ['Matam', 'Matoto', 'Matoto Centre', 'Kobaya']
                  },
                  {
                    name: 'Ratoma',
                    quartiers: ['Ratoma', 'Cosa', 'Hamdallaye', 'Tomboyah']
                  }
                ]
              }
            ]
          }
        ]
      };
    }
  },

  // Récupérer les marqueurs pour la carte (posts, alertes, événements, etc.)
  getMapMarkers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await api.get(`${MAP_URL}/markers?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des marqueurs:', error);
      return { markers: [] };
    }
  },

  // Récupérer les alertes géolocalisées
  getAlerts: async (bounds = null) => {
    try {
      const params = bounds ? { bounds: JSON.stringify(bounds) } : {};
      const response = await api.get(`${MAP_URL}/alerts`, { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      return { alerts: [] };
    }
  },

  // Récupérer les événements géolocalisés
  getEvents: async (bounds = null) => {
    try {
      const params = bounds ? { bounds: JSON.stringify(bounds) } : {};
      const response = await api.get(`${MAP_URL}/events`, { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      return { events: [] };
    }
  },

  // Récupérer les demandes d'aide géolocalisées
  getHelpRequests: async (bounds = null) => {
    try {
      const params = bounds ? { bounds: JSON.stringify(bounds) } : {};
      const response = await api.get(`${MAP_URL}/help-requests`, { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes d\'aide:', error);
      return { helpRequests: [] };
    }
  },

  // Récupérer les posts géolocalisés
  getPosts: async (bounds = null) => {
    try {
      const params = bounds ? { bounds: JSON.stringify(bounds) } : {};
      const response = await api.get(`${MAP_URL}/posts`, { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des posts:', error);
      return { posts: [] };
    }
  },

  // Obtenir les coordonnées d'une adresse (géocodage)
  geocodeAddress: async (address) => {
    try {
      const response = await api.get(`${MAP_URL}/geocode`, {
        params: { address }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du géocodage:', error);
      return null;
    }
  },

  // Obtenir l'adresse à partir de coordonnées (géocodage inverse)
  reverseGeocode: async (lat, lng) => {
    try {
      const response = await api.get(`${MAP_URL}/reverse-geocode`, {
        params: { lat, lng }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du géocodage inverse:', error);
      return null;
    }
  },

  // Calculer la distance entre deux points
  calculateDistance: (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // Formater la distance pour l'affichage
  formatDistance: (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)} km`;
    } else {
      return `${Math.round(distance)} km`;
    }
  },

  // Obtenir l'icône pour un type de marqueur
  getMarkerIcon: (type) => {
    const icons = {
      alert: {
        iconUrl: '/markers/alert.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      },
      event: {
        iconUrl: '/markers/event.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      },
      help: {
        iconUrl: '/markers/help.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      },
      post: {
        iconUrl: '/markers/post.png',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
      },
      user: {
        iconUrl: '/markers/user.png',
        iconSize: [20, 20],
        iconAnchor: [10, 20],
        popupAnchor: [0, -20]
      }
    };
    return icons[type] || icons.post;
  },

  // Obtenir la couleur pour un type de marqueur
  getMarkerColor: (type, severity = 'normal') => {
    const colors = {
      alert: {
        low: '#ffeb3b',
        normal: '#ff9800',
        high: '#f44336',
        critical: '#d32f2f'
      },
      event: '#4caf50',
      help: '#ff9800',
      post: '#2196f3',
      user: '#9c27b0'
    };
    
    if (type === 'alert' && colors.alert[severity]) {
      return colors.alert[severity];
    }
    
    return colors[type] || colors.post;
  }
}; 