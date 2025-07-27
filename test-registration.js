const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Données de test pour l'inscription
const testUserData = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '22412345678',
  password: 'password123',
  region: 'Labé',
  prefecture: 'Labé',
  commune: 'Labé-Centre',
  quartier: 'Tata',
  latitude: 11.3182,
  longitude: -12.2833,
  address: 'Tata, Labé-Centre, Labé, Labé, Guinée'
};

async function testRegistration() {
  console.log('=== Test d\'inscription ===\n');
  console.log('Données de test:', JSON.stringify(testUserData, null, 2));
  console.log('');

  try {
    console.log('📡 Envoi de la requête d\'inscription...');
    
    const response = await axios.post(`${API_URL}/auth/register`, testUserData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Inscription réussie !');
    console.log('Réponse:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Erreur d\'inscription:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Données d\'erreur:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Erreur réseau:', error.message);
    }
  }
}

// Vérifier que le serveur est en cours d'exécution
async function checkServerStatus() {
  try {
    const response = await axios.get(`${API_URL}/auth`);
    console.log('✅ Serveur accessible');
    console.log('Status:', response.data);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Serveur non accessible');
    console.log('Assurez-vous que le serveur est démarré sur le port 5000');
    return false;
  }
}

async function main() {
  const serverOk = await checkServerStatus();
  if (serverOk) {
    await testRegistration();
  }
}

main().catch(console.error); 