const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

console.log('🚀 Test simple du système CommuniConnect');
console.log('============================================================');

// Test 1: Vérifier que le serveur répond
const testServerHealth = async () => {
  console.log('🔍 Test 1: Vérification du serveur...');
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Serveur opérationnel');
    return true;
  } catch (error) {
    console.log('❌ Serveur non accessible');
    return false;
  }
};

// Test 2: Vérifier l'API de modération
const testModerationAPI = async () => {
  console.log('\n🔍 Test 2: API de modération...');
  try {
    const response = await axios.get(`${API_BASE_URL}/moderation`);
    console.log('✅ API de modération opérationnelle');
    console.log('   Endpoints disponibles:', response.data.endpoints);
    return true;
  } catch (error) {
    console.log('❌ API de modération non accessible');
    return false;
  }
};

// Test 3: Vérifier l'API d'authentification
const testAuthAPI = async () => {
  console.log('\n🔍 Test 3: API d\'authentification...');
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/status`);
    console.log('✅ API d\'authentification opérationnelle');
    return true;
  } catch (error) {
    console.log('❌ API d\'authentification non accessible');
    return false;
  }
};

// Test 4: Vérifier l'API des posts
const testPostsAPI = async () => {
  console.log('\n🔍 Test 4: API des posts...');
  try {
    const response = await axios.get(`${API_BASE_URL}/posts`);
    console.log('✅ API des posts opérationnelle');
    return true;
  } catch (error) {
    console.log('❌ API des posts non accessible');
    return false;
  }
};

// Test 5: Vérifier l'API des alertes
const testAlertsAPI = async () => {
  console.log('\n🔍 Test 5: API des alertes...');
  try {
    const response = await axios.get(`${API_BASE_URL}/alerts`);
    console.log('✅ API des alertes opérationnelle');
    return true;
  } catch (error) {
    console.log('❌ API des alertes non accessible');
    return false;
  }
};

// Test 6: Vérifier l'API des événements
const testEventsAPI = async () => {
  console.log('\n🔍 Test 6: API des événements...');
  try {
    const response = await axios.get(`${API_BASE_URL}/events`);
    console.log('✅ API des événements opérationnelle');
    return true;
  } catch (error) {
    console.log('❌ API des événements non accessible');
    return false;
  }
};

// Test 7: Vérifier l'API des livestreams
const testLivestreamsAPI = async () => {
  console.log('\n🔍 Test 7: API des livestreams...');
  try {
    const response = await axios.get(`${API_BASE_URL}/livestreams`);
    console.log('✅ API des livestreams opérationnelle');
    return true;
  } catch (error) {
    console.log('❌ API des livestreams non accessible');
    return false;
  }
};

// Test 8: Vérifier l'API d'aide
const testHelpAPI = async () => {
  console.log('\n🔍 Test 8: API d\'aide...');
  try {
    const response = await axios.get(`${API_BASE_URL}/help`);
    console.log('✅ API d\'aide opérationnelle');
    return true;
  } catch (error) {
    console.log('❌ API d\'aide non accessible');
    return false;
  }
};

// Fonction principale
const runSimpleTest = async () => {
  const results = [];
  
  results.push(await testServerHealth());
  results.push(await testModerationAPI());
  results.push(await testAuthAPI());
  results.push(await testPostsAPI());
  results.push(await testAlertsAPI());
  results.push(await testEventsAPI());
  results.push(await testLivestreamsAPI());
  results.push(await testHelpAPI());
  
  console.log('\n============================================================');
  console.log('📊 Résumé des tests :');
  console.log(`   Tests réussis : ${results.filter(r => r).length}/${results.length}`);
  console.log(`   Tests échoués : ${results.filter(r => !r).length}/${results.length}`);
  
  if (results.every(r => r)) {
    console.log('🎉 Tous les tests sont passés ! Le système est opérationnel.');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez la configuration du serveur.');
  }
  
  console.log('\n🌐 Frontend disponible sur : http://localhost:3000');
  console.log('🔧 Backend disponible sur : http://localhost:5000');
};

// Exécuter le test
runSimpleTest(); 