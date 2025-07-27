import api from './api';

class PushNotificationService {
  constructor() {
    this.isSupported = this.checkSupport();
    this.permission = null;
    this.registration = null;
    this.init();
  }

  // Vérifier si les notifications push sont supportées
  checkSupport() {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  // Initialiser le service
  async init() {
    if (!this.isSupported) {
      console.log('⚠️ Notifications push non supportées par ce navigateur');
      return;
    }

    try {
      // Enregistrer le service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker enregistré');

      // Vérifier la permission
      this.permission = await this.requestPermission();
      
      if (this.permission === 'granted') {
        await this.subscribeToPush();
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des notifications push:', error);
    }
  }

  // Demander la permission pour les notifications
  async requestPermission() {
    if (!this.isSupported) return 'denied';

    try {
      const permission = await Notification.requestPermission();
      console.log('📱 Permission notifications:', permission);
      return permission;
    } catch (error) {
      console.error('❌ Erreur lors de la demande de permission:', error);
      return 'denied';
    }
  }

  // S'abonner aux notifications push
  async subscribeToPush() {
    if (!this.isSupported || this.permission !== 'granted') {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
      });

      // Envoyer le token au serveur
      await this.registerToken(subscription);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'abonnement aux notifications:', error);
      return false;
    }
  }

  // Se désabonner des notifications push
  async unsubscribeFromPush() {
    if (!this.isSupported) return false;

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.unregisterToken();
        console.log('✅ Désabonnement des notifications réussi');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur lors du désabonnement:', error);
      return false;
    }
  }

  // Enregistrer le token FCM au serveur
  async registerToken(subscription) {
    try {
      const response = await api.post('/notifications/register-token', {
        fcmToken: subscription.endpoint,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      });

      if (response.data.success) {
        console.log('✅ Token FCM enregistré au serveur');
        return true;
      } else {
        console.error('❌ Échec de l\'enregistrement du token');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du token:', error);
      return false;
    }
  }

  // Supprimer le token FCM du serveur
  async unregisterToken() {
    try {
      const response = await api.delete('/notifications/unregister-token');
      
      if (response.data.success) {
        console.log('✅ Token FCM supprimé du serveur');
        return true;
      } else {
        console.error('❌ Échec de la suppression du token');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du token:', error);
      return false;
    }
  }

  // Récupérer les paramètres de notification
  async getNotificationSettings() {
    try {
      const response = await api.get('/notifications/settings');
      
      if (response.data.success) {
        return response.data.settings;
      } else {
        console.error('❌ Échec de la récupération des paramètres');
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des paramètres:', error);
      return null;
    }
  }

  // Mettre à jour les paramètres de notification
  async updateNotificationSettings(settings) {
    try {
      const response = await api.put('/notifications/settings', { settings });
      
      if (response.data.success) {
        console.log('✅ Paramètres de notification mis à jour');
        return true;
      } else {
        console.error('❌ Échec de la mise à jour des paramètres');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des paramètres:', error);
      return false;
    }
  }

  // Envoyer une notification de test
  async sendTestNotification(type, title, body) {
    try {
      const response = await api.post('/notifications/test', {
        type,
        title,
        body
      });
      
      if (response.data.success) {
        console.log('✅ Notification de test envoyée');
        return true;
      } else {
        console.error('❌ Échec de l\'envoi de la notification de test');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification de test:', error);
      return false;
    }
  }

  // Afficher une notification locale
  showLocalNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        requireInteraction: false,
        ...options
      });

      // Gérer les clics sur la notification
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (options.onClick) {
          options.onClick(event);
        }
      };

      return notification;
    } catch (error) {
      console.error('❌ Erreur lors de l\'affichage de la notification locale:', error);
      return false;
    }
  }

  // Convertir la clé VAPID en Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Vérifier si les notifications sont activées
  isEnabled() {
    return this.isSupported && this.permission === 'granted';
  }

  // Obtenir le statut des notifications
  getStatus() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      enabled: this.isEnabled()
    };
  }

  // Réinitialiser le service
  async reset() {
    try {
      await this.unsubscribeFromPush();
      await this.init();
      console.log('✅ Service de notifications réinitialisé');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
      return false;
    }
  }
}

// Créer une instance singleton
const pushNotificationService = new PushNotificationService();

export default pushNotificationService; 