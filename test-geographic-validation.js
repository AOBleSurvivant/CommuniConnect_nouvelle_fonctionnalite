const { findExactLocation, calculateDistance, loadGuineaGeography } = require('./server/middleware/geographicValidation');

// Test avec les coordonnées de Labé
const testCoordinates = [
  { lat: 11.3182, lon: -12.2833, name: 'Labé-Centre' },
  { lat: 11.3182, lon: -12.2833, name: 'Labé (quartier Tata)' },
  { lat: 11.3, lon: -12.3, name: 'Labé (approximatif)' },
  { lat: 9.6412, lon: -13.5784, name: 'Conakry' },
  { lat: 10.0569, lon: -12.8657, name: 'Kindia' }
];

console.log('=== Test de validation géographique ===\n');

const geographyData = loadGuineaGeography();
if (!geographyData) {
  console.error('❌ Impossible de charger les données géographiques');
  process.exit(1);
}

console.log('✅ Données géographiques chargées avec succès');
console.log(`📊 ${geographyData.Guinée.Régions.length} régions trouvées\n`);

testCoordinates.forEach(({ lat, lon, name }) => {
  console.log(`📍 Test: ${name} (${lat}, ${lon})`);
  
  const location = findExactLocation(lat, lon, geographyData);
  
  if (location) {
    console.log(`✅ Localisation trouvée:`);
    console.log(`   Région: ${location.region}`);
    console.log(`   Préfecture: ${location.prefecture}`);
    console.log(`   Commune: ${location.commune}`);
    console.log(`   Distance: ${location.distance.toFixed(2)} km`);
  } else {
    console.log(`❌ Aucune localisation trouvée`);
  }
  
  console.log('');
});

console.log('=== Test terminé ==='); 