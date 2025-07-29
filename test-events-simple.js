const puppeteer = require('puppeteer');

async function testAppAccessibility() {
  console.log('🔍 Test d\'accessibilité de l\'application...');
  
  let browser = null;
  try {
    // Lancer le navigateur
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Configuration des timeouts
    await page.setDefaultTimeout(30000);
    await page.setDefaultNavigationTimeout(30000);
    
    console.log('🌐 Test de connexion à l\'application...');
    
    // Test 1: Vérifier si l'application répond
    try {
      await page.goto('http://localhost:3000', { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      console.log('✅ Application accessible sur http://localhost:3000');
      
      // Vérifier le titre de la page
      const title = await page.title();
      console.log(`📄 Titre de la page: "${title}"`);
      
      // Vérifier le contenu de la page
      const content = await page.evaluate(() => document.body.innerText);
      console.log(`📝 Contenu de la page (premiers 200 caractères): "${content.substring(0, 200)}..."`);
      
    } catch (error) {
      console.log('❌ Impossible d\'accéder à l\'application:', error.message);
      console.log('💡 Vérifiez que l\'application est démarrée avec: npm start');
      return;
    }
    
    // Test 2: Vérifier la page des événements
    console.log('\n📅 Test de la page des événements...');
    try {
      await page.goto('http://localhost:3000/events', { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      console.log('✅ Page des événements accessible');
      
      // Vérifier le contenu de la page des événements
      const eventsContent = await page.evaluate(() => document.body.innerText);
      console.log(`📝 Contenu de la page événements (premiers 200 caractères): "${eventsContent.substring(0, 200)}..."`);
      
      // Vérifier s'il y a des boutons sur la page
      const buttons = await page.evaluate(() => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        return allButtons.map(btn => ({
          text: btn.textContent.trim(),
          className: btn.className,
          visible: btn.offsetParent !== null
        }));
      });
      
      console.log(`🔘 Boutons trouvés sur la page: ${buttons.length}`);
      buttons.forEach((btn, index) => {
        console.log(`  ${index + 1}. "${btn.text}" (${btn.className}) - Visible: ${btn.visible}`);
      });
      
    } catch (error) {
      console.log('❌ Erreur lors de l\'accès à la page des événements:', error.message);
    }
    
    // Test 3: Vérifier les autres routes importantes
    const routes = ['/alerts', '/help', '/feed', '/profile'];
    console.log('\n🛣️ Test des autres routes...');
    
    for (const route of routes) {
      try {
        await page.goto(`http://localhost:3000${route}`, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        const routeTitle = await page.title();
        console.log(`✅ ${route}: "${routeTitle}"`);
      } catch (error) {
        console.log(`❌ ${route}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Test d\'accessibilité terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Fonction pour vérifier si l'application est démarrée
async function checkAppStatus() {
  console.log('🔍 Vérification du statut de l\'application...');
  
  try {
    const response = await fetch('http://localhost:3000');
    console.log('✅ Application accessible via fetch');
    return true;
  } catch (error) {
    console.log('❌ Application non accessible via fetch:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Démarrage du test d\'accessibilité...');
  
  // Vérifier d'abord le statut de l'application
  const appRunning = await checkAppStatus();
  if (!appRunning) {
    console.log('\n💡 Instructions pour démarrer l\'application:');
    console.log('1. Ouvrez un terminal dans le dossier client');
    console.log('2. Exécutez: npm start');
    console.log('3. Attendez que l\'application soit démarrée');
    console.log('4. Relancez ce test');
    return;
  }
  
  await testAppAccessibility();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAppAccessibility, checkAppStatus }; 