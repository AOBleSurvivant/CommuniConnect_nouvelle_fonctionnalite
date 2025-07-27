import api from './api';

const ALERTS_ENDPOINT = '/alerts';

export const alertsService = {
  // Obtenir toutes les alertes avec filtres
  getAlerts: async (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const response = await api.get(`${ALERTS_ENDPOINT}?${params.toString()}`);
    return response.data;
  },

  // Obtenir les alertes urgentes
  getUrgentAlerts: async () => {
    const response = await api.get(`${ALERTS_ENDPOINT}/urgent`);
    return response.data;
  },

  // Obtenir les alertes à proximité
  getNearbyAlerts: async (latitude, longitude, radius = 5) => {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString()
    });

    const response = await api.get(`${ALERTS_ENDPOINT}/nearby?${params.toString()}`);
    return response.data;
  },

  // Obtenir une alerte spécifique
  getAlert: async (id) => {
    const response = await api.get(`${ALERTS_ENDPOINT}/${id}`);
    return response.data;
  },

  // Créer une nouvelle alerte
  createAlert: async (alertData) => {
    const response = await api.post(ALERTS_ENDPOINT, alertData);
    return response.data;
  },

  // Mettre à jour une alerte
  updateAlert: async (id, updateData) => {
    const response = await api.put(`${ALERTS_ENDPOINT}/${id}`, updateData);
    return response.data;
  },

  // Confirmer une alerte
  confirmAlert: async (id) => {
    const response = await api.post(`${ALERTS_ENDPOINT}/${id}/confirm`);
    return response.data;
  },

  // Dénier une alerte
  denyAlert: async (id) => {
    const response = await api.post(`${ALERTS_ENDPOINT}/${id}/deny`);
    return response.data;
  },

  // Ajouter une mise à jour à une alerte
  addUpdate: async (id, updateData) => {
    const response = await api.post(`${ALERTS_ENDPOINT}/${id}/update`, updateData);
    return response.data;
  },

  // Signaler une alerte
  reportAlert: async (id, reportData) => {
    const response = await api.post(`${ALERTS_ENDPOINT}/${id}/report`, reportData);
    return response.data;
  },

  // Supprimer une alerte
  deleteAlert: async (id) => {
    const response = await api.delete(`${ALERTS_ENDPOINT}/${id}`);
    return response.data;
  }
};

export default alertsService; 