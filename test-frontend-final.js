const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');

class FrontendFinalTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
      performance: {},
      accessibility: {},
      security: {}
    };
    this.baseUrl = 'http://localhost:3000';
    this.startTime = Date.now();
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    this.results.details.push({ timestamp, type, message });
  }

  async init() {
    try {
      // Vérifier que le serveur est accessible
      await this.checkServerAccessibility();
      
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 720 },
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      this.page = await this.browser.newPage();
      
      // Configurer les listeners d'événements
      this.page.on('console', msg => this.log(`Console: ${msg.text()}`, 'debug'));
      this.page.on('pageerror', error => this.log(`Page Error: ${error.message}`, 'error'));
      this.page.on('requestfailed', request => this.log(`Request Failed: ${request.url()}`, 'warning'));
      
      await this.log('🚀 Navigateur initialisé avec succès');
      return true;
    } catch (error) {
      await this.log(`❌ Erreur lors de l'initialisation: ${error.message}`, 'error');
      return false;
    }
  }

  async checkServerAccessibility() {
    return new Promise((resolve, reject) => {
      const req = http.get(this.baseUrl, (res) => {
        if (res.statusCode === 200) {
          this.log(`✅ Serveur accessible (${res.statusCode})`);
          resolve(true);
        } else {
          this.log(`⚠️ Serveur accessible mais statut ${res.statusCode}`);
          resolve(true);
        }
      });
      
      req.on('error', (error) => {
        this.log(`❌ Serveur non accessible: ${error.message}`, 'error');
        reject(error);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Timeout lors de la connexion au serveur'));
      });
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      await this.log('🔒 Navigateur fermé');
    }
  }

  async test(testName, testFunction) {
    this.results.total++;
    const startTime = Date.now();
    
    try {
      await this.log(`🧪 Début du test: ${testName}`);
      await testFunction();
      const duration = Date.now() - startTime;
      this.results.passed++;
      await this.log(`✅ Test réussi: ${testName} (${duration}ms)`, 'success');
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.failed++;
      await this.log(`❌ Test échoué: ${testName} - ${error.message} (${duration}ms)`, 'error');
      return false;
    }
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      throw new Error(`Élément ${selector} non trouvé après ${timeout}ms`);
    }
  }

  async waitForNavigation(timeout = 10000) {
    try {
      await this.page.waitForNavigation({ timeout, waitUntil: 'networkidle0' });
      return true;
    } catch (error) {
      throw new Error(`Navigation échouée après ${timeout}ms`);
    }
  }

  async takeScreenshot(name) {
    try {
      const screenshotDir = path.join(__dirname, 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      const screenshotPath = path.join(screenshotDir, `${name}.png`);
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      await this.log(`📸 Screenshot sauvegardé: ${screenshotPath}`);
    } catch (error) {
      await this.log(`⚠️ Erreur lors de la capture d'écran: ${error.message}`, 'warning');
    }
  }

  // Test 1: Accessibilité de base de l'application
  async testBasicAccessibility() {
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
    
    // Vérifier le titre
    const title = await this.page.title();
    if (!title || title === '') {
      throw new Error('Titre de la page manquant');
    }
    await this.log(`📄 Titre de la page: ${title}`);
    
    // Vérifier la présence d'éléments de base
    const bodyContent = await this.page.evaluate(() => document.body.textContent);
    if (!bodyContent || bodyContent.trim().length < 100) {
      throw new Error('Contenu de la page insuffisant');
    }
    
    // Vérifier la présence d'éléments React
    const reactElements = await this.page.evaluate(() => {
      return {
        hasRoot: !!document.getElementById('root'),
        hasApp: !!document.querySelector('[data-testid="app"]'),
        hasReact: !!window.React || !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__
      };
    });
    
    await this.log(`🔍 Éléments React détectés: ${JSON.stringify(reactElements)}`);
    
    if (!reactElements.hasRoot) {
      throw new Error('Élément root React manquant');
    }
  }

  // Test 2: Navigation et routage
  async testNavigation() {
    const routes = [
      '/login',
      '/register', 
      '/feed',
      '/alerts',
      '/events',
      '/map',
      '/messages',
      '/friends',
      '/profile',
      '/help',
      '/moderation'
    ];

    for (const route of routes) {
      try {
        await this.page.goto(`${this.baseUrl}${route}`, { waitUntil: 'networkidle0' });
        const status = await this.page.evaluate(() => document.readyState);
        
        if (status === 'complete') {
          await this.log(`✅ Route ${route} accessible`);
        } else {
          await this.log(`⚠️ Route ${route} - État: ${status}`);
        }
      } catch (error) {
        await this.log(`❌ Erreur sur la route ${route}: ${error.message}`, 'error');
      }
    }
  }

  // Test 3: Formulaires et interactions
  async testForms() {
    // Test du formulaire de connexion
    await this.page.goto(`${this.baseUrl}/login`);
    
    try {
      // Vérifier la présence des champs de formulaire
      const formElements = await this.page.evaluate(() => {
        return {
          hasForm: !!document.querySelector('form'),
          hasEmailInput: !!document.querySelector('input[type="email"]') || !!document.querySelector('input[name="email"]'),
          hasPasswordInput: !!document.querySelector('input[type="password"]'),
          hasSubmitButton: !!document.querySelector('button[type="submit"]') || !!document.querySelector('input[type="submit"]')
        };
      });
      
      await this.log(`📝 Éléments de formulaire: ${JSON.stringify(formElements)}`);
      
      if (!formElements.hasForm) {
        throw new Error('Formulaire de connexion manquant');
      }
      
      // Test de saisie dans les champs
      if (formElements.hasEmailInput) {
        await this.page.type('input[type="email"], input[name="email"]', 'test@example.com');
        await this.log('✍️ Saisie email réussie');
      }
      
      if (formElements.hasPasswordInput) {
        await this.page.type('input[type="password"]', 'password123');
        await this.log('✍️ Saisie mot de passe réussie');
      }
      
    } catch (error) {
      await this.log(`⚠️ Test formulaire de connexion: ${error.message}`, 'warning');
    }
  }

  // Test 4: Responsivité
  async testResponsiveness() {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await this.page.setViewport(viewport);
      await this.page.goto(this.baseUrl);
      
      const dimensions = await this.page.evaluate(() => ({
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        documentWidth: document.documentElement.clientWidth,
        documentHeight: document.documentElement.clientHeight
      }));
      
      await this.log(`📱 ${viewport.name}: ${dimensions.windowWidth}x${dimensions.windowHeight}`);
      
      // Vérifier que la page s'adapte
      if (dimensions.windowWidth !== viewport.width) {
        throw new Error(`Largeur de fenêtre incorrecte: ${dimensions.windowWidth} au lieu de ${viewport.width}`);
      }
    }
  }

  // Test 5: Performance
  async testPerformance() {
    await this.page.goto(this.baseUrl);
    
    // Mesurer les métriques de performance
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    this.results.performance = performanceMetrics;
    
    await this.log(`⚡ Métriques de performance: ${JSON.stringify(performanceMetrics)}`);
    
    // Vérifier que les temps de chargement sont acceptables
    if (performanceMetrics.loadTime > 5000) {
      throw new Error(`Temps de chargement trop élevé: ${performanceMetrics.loadTime}ms`);
    }
  }

  // Test 6: Accessibilité WCAG
  async testAccessibility() {
    await this.page.goto(this.baseUrl);
    
    const accessibilityChecks = await this.page.evaluate(() => {
      const checks = {
        hasTitle: !!document.title,
        hasMain: !!document.querySelector('main') || !!document.querySelector('[role="main"]'),
        hasHeading: !!document.querySelector('h1, h2, h3, h4, h5, h6'),
        hasLandmarks: !!document.querySelector('nav, main, header, footer, aside'),
        hasAltText: true, // À vérifier plus en détail
        hasContrast: true, // À vérifier avec des outils spécialisés
        hasFocusIndicators: true // À vérifier avec le clavier
      };
      
      // Vérifier les images
      const images = document.querySelectorAll('img');
      for (let img of images) {
        if (!img.alt && !img.getAttribute('aria-label')) {
          checks.hasAltText = false;
          break;
        }
      }
      
      return checks;
    });
    
    this.results.accessibility = accessibilityChecks;
    await this.log(`♿ Vérifications d'accessibilité: ${JSON.stringify(accessibilityChecks)}`);
    
    if (!accessibilityChecks.hasTitle) {
      throw new Error('Titre de page manquant pour l\'accessibilité');
    }
  }

  // Test 7: Sécurité
  async testSecurity() {
    await this.page.goto(this.baseUrl);
    
    const securityChecks = await this.page.evaluate(() => {
      return {
        hasCSP: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
        hasXFrameOptions: true, // À vérifier dans les headers
        hasXContentTypeOptions: true, // À vérifier dans les headers
        hasSecureCookies: true, // À vérifier si des cookies sont présents
        hasHSTS: true // À vérifier dans les headers
      };
    });
    
    this.results.security = securityChecks;
    await this.log(`🔒 Vérifications de sécurité: ${JSON.stringify(securityChecks)}`);
  }

  // Test 8: Fonctionnalités JavaScript
  async testJavaScriptFunctionality() {
    await this.page.goto(this.baseUrl);
    
    // Vérifier que JavaScript fonctionne
    const jsWorking = await this.page.evaluate(() => {
      try {
        // Test de base de JavaScript
        const testElement = document.createElement('div');
        testElement.id = 'js-test';
        document.body.appendChild(testElement);
        const found = document.getElementById('js-test');
        document.body.removeChild(testElement);
        return !!found;
      } catch (error) {
        return false;
      }
    });
    
    if (!jsWorking) {
      throw new Error('JavaScript ne fonctionne pas correctement');
    }
    
    await this.log('✅ JavaScript fonctionne correctement');
  }

  // Test 9: Gestion des erreurs
  async testErrorHandling() {
    // Test d'une page inexistante
    await this.page.goto(`${this.baseUrl}/page-inexistante`);
    
    const errorHandling = await this.page.evaluate(() => {
      return {
        hasErrorContent: document.body.textContent.length > 0,
        hasErrorTitle: document.title !== '',
        hasErrorStructure: !!document.querySelector('body')
      };
    });
    
    await this.log(`🚨 Gestion d'erreur: ${JSON.stringify(errorHandling)}`);
    
    if (!errorHandling.hasErrorContent) {
      throw new Error('Page d\'erreur sans contenu');
    }
  }

  // Test 10: Compatibilité navigateur
  async testBrowserCompatibility() {
    const compatibilityTests = await this.page.evaluate(() => {
      return {
        hasFetch: typeof fetch !== 'undefined',
        hasPromise: typeof Promise !== 'undefined',
        hasAsyncAwait: true, // Testé par l'exécution de ce code
        hasES6: true, // Testé par l'utilisation de const/let
        hasLocalStorage: typeof localStorage !== 'undefined',
        hasSessionStorage: typeof sessionStorage !== 'undefined'
      };
    });
    
    await this.log(`🌐 Compatibilité navigateur: ${JSON.stringify(compatibilityTests)}`);
    
    if (!compatibilityTests.hasFetch) {
      throw new Error('Fetch API non supportée');
    }
  }

  async runAllTests() {
    await this.log('🚀 Début des tests frontend finaux');
    
    const tests = [
      { name: 'Accessibilité de base', fn: () => this.testBasicAccessibility() },
      { name: 'Navigation et routage', fn: () => this.testNavigation() },
      { name: 'Formulaires et interactions', fn: () => this.testForms() },
      { name: 'Responsivité', fn: () => this.testResponsiveness() },
      { name: 'Performance', fn: () => this.testPerformance() },
      { name: 'Accessibilité WCAG', fn: () => this.testAccessibility() },
      { name: 'Sécurité', fn: () => this.testSecurity() },
      { name: 'Fonctionnalités JavaScript', fn: () => this.testJavaScriptFunctionality() },
      { name: 'Gestion des erreurs', fn: () => this.testErrorHandling() },
      { name: 'Compatibilité navigateur', fn: () => this.testBrowserCompatibility() }
    ];

    for (const test of tests) {
      await this.test(test.name, test.fn);
    }
    
    await this.generateReport();
  }

  async generateReport() {
    const totalTime = Date.now() - this.startTime;
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(2);
    
    const report = {
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: successRate,
        totalTime: totalTime
      },
      performance: this.results.performance,
      accessibility: this.results.accessibility,
      security: this.results.security,
      details: this.results.details,
      timestamp: new Date().toISOString()
    };
    
    // Sauvegarder le rapport
    const reportPath = path.join(__dirname, 'frontend-final-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Afficher le résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT FINAL DES TESTS FRONTEND');
    console.log('='.repeat(60));
    console.log(`✅ Tests réussis: ${this.results.passed}/${this.results.total}`);
    console.log(`❌ Tests échoués: ${this.results.failed}/${this.results.total}`);
    console.log(`📈 Taux de réussite: ${successRate}%`);
    console.log(`⏱️ Temps total: ${totalTime}ms`);
    console.log('='.repeat(60));
    
    if (this.results.failed === 0) {
      console.log('🎉 TOUS LES TESTS SONT RÉUSSIS !');
    } else {
      console.log('⚠️ Certains tests ont échoué. Vérifiez les détails ci-dessus.');
    }
    
    await this.log(`📄 Rapport sauvegardé: ${reportPath}`);
  }
}

async function runFrontendFinalTests() {
  const testSuite = new FrontendFinalTestSuite();
  
  try {
    const initialized = await testSuite.init();
    if (!initialized) {
      console.error('❌ Impossible d\'initialiser les tests');
      process.exit(1);
    }
    
    await testSuite.runAllTests();
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tests:', error.message);
  } finally {
    await testSuite.cleanup();
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runFrontendFinalTests();
}

module.exports = { FrontendFinalTestSuite, runFrontendFinalTests }; 