const https = require('https');
const http = require('http');

// Données de test pour un utilisateur guinéen
const testUserData = {
  firstName: "Test",
  lastName: "Guinéen",
  email: "test@guinee.gn",
  phone: "+22461234567",
  password: "password123",
  latitude: 9.5144,
  longitude: -13.6783,
  quartier: "Centre",
  address: "Test Address",
  dateOfBirth: "1990-01-01",
  gender: "Homme"
};

// Données de test pour un utilisateur non-guinéen (pour tester le rejet)
const nonGuineanUserData = {
  firstName: "Test",
  lastName: "Étranger",
  email: "test@etranger.com",
  phone: "+22461234567",
  password: "password123",
  latitude: 48.8566, // Paris, France
  longitude: 2.3522,
  quartier: "Centre",
  address: "Test Address",
  dateOfBirth: "1990-01-01",
  gender: "Homme"
};

function testAPI(data, description) {
  const postData = JSON.stringify(data);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log(`\n=== ${description} ===`);
      console.log(`Status: ${res.statusCode}`);
      console.log('Response:', responseData);
      
      try {
        const parsed = JSON.parse(responseData);
        if (parsed.success) {
          console.log('✅ Succès: Utilisateur créé avec succès');
        } else {
          console.log('❌ Erreur:', parsed.message);
        }
      } catch (e) {
        console.log('❌ Erreur de parsing JSON');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Erreur de requête: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

console.log('🧪 Test de l\'API d\'inscription avec validation géographique\n');

// Test 1: Utilisateur guinéen (devrait réussir)
testAPI(testUserData, 'Test 1: Utilisateur guinéen (Conakry)');

// Attendre 2 secondes avant le prochain test
setTimeout(() => {
  // Test 2: Utilisateur non-guinéen (devrait échouer)
  testAPI(nonGuineanUserData, 'Test 2: Utilisateur non-guinéen (Paris)');
}, 2000);

// Test 3: Données manquantes (devrait échouer)
setTimeout(() => {
  const invalidData = { ...testUserData };
  delete invalidData.latitude;
  delete invalidData.longitude;
  testAPI(invalidData, 'Test 3: Coordonnées manquantes');
}, 4000); 