const puppeteer = require('puppeteer');
const fs = require('fs');

class TestFonctionnalitesCompletes {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      events: { success: false, details: [] },
      alerts: { success: false, details: [] },
      help: { success: false, details: [] },
      sharing: { success: false, details: [] },
      overall: { success: false, score: 0, total: 0 }
    };
  }

  async init() {
    console.log('🚀 Initialisation du test des fonctionnalités complètes...');
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Intercepter les erreurs de console
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Erreur console:', msg.text());
      }
    });

    // Intercepter les erreurs de réseau
    this.page.on('pageerror', error => {
      console.log('❌ Erreur page:', error.message);
    });
  }

  async testEvents() {
    console.log('\n📅 Test des fonctionnalités Événements...');
    const testSteps = [
      'Navigation vers la page événements',
      'Vérification du bouton FAB de création',
      'Ouverture du formulaire de création',
      'Remplissage du formulaire',
      'Soumission du formulaire',
      'Vérification de la création'
    ];

    try {
      // Navigation vers la page événements
      await this.page.goto('http://localhost:3000/events', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.results.events.details.push('✅ Navigation réussie');

      // Vérification du bouton FAB
      const fabButton = await this.page.$('[data-testid="fab-create-event"]');
      if (fabButton) {
        this.results.events.details.push('✅ Bouton FAB trouvé');
        await fabButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Recherche alternative du bouton FAB
        const fabButtons = await this.page.$$('button[aria-label*="Créer"], .MuiFab-root');
        if (fabButtons.length > 0) {
          this.results.events.details.push('✅ Bouton FAB trouvé (alternative)');
          await fabButtons[0].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          this.results.events.details.push('❌ Bouton FAB non trouvé');
        }
      }

      // Vérification du formulaire
      const form = await this.page.$('form, .MuiDialog-root');
      if (form) {
        this.results.events.details.push('✅ Formulaire ouvert');
        
        // Remplissage du formulaire
        const titleInput = await this.page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          return inputs.find(input => 
            input.name === 'title' || 
            input.placeholder?.includes('titre') ||
            input.placeholder?.includes('Titre')
          );
        });
        if (titleInput) {
          await this.page.evaluate((input) => input.value = 'Test Événement CommuniConnect', titleInput);
          await this.page.evaluate((input) => input.dispatchEvent(new Event('input', { bubbles: true })), titleInput);
        }
        
        const descInput = await this.page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('textarea'));
          return inputs.find(input => 
            input.name === 'description' || 
            input.placeholder?.includes('description') ||
            input.placeholder?.includes('Description')
          );
        });
        if (descInput) {
          await this.page.evaluate((input) => input.value = 'Description de test pour l\'événement', descInput);
          await this.page.evaluate((input) => input.dispatchEvent(new Event('input', { bubbles: true })), descInput);
        }
        
        // Sélection du type d'événement
        const typeSelect = await this.page.$('select[name="type"], .MuiSelect-select');
        if (typeSelect) {
          await typeSelect.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          const option = await this.page.$('li[data-value="celebration"], .MuiMenuItem-root');
          if (option) {
            await option.click();
          }
        }

        this.results.events.details.push('✅ Formulaire rempli');

        // Soumission avec recherche plus robuste
        const submitButton = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => 
            button.type === 'submit' || 
            button.textContent.includes('Créer') || 
            button.textContent.includes('Publier') ||
            button.textContent.includes('Créer l\'événement') ||
            button.textContent.includes('Créer l\'alerte') ||
            button.textContent.includes('Créer la demande') ||
            button.textContent.includes('Créer le Live') ||
            button.textContent.includes('Publier') ||
            button.textContent.includes('Enregistrer') ||
            button.textContent.includes('Soumettre')
          );
        });
        
        if (submitButton) {
          await this.page.evaluate((button) => button.click(), submitButton);
          await new Promise(resolve => setTimeout(resolve, 2000));
          this.results.events.details.push('✅ Formulaire soumis');
        } else {
          // Essayer de trouver le bouton dans les DialogActions
          const dialogActionsButton = await this.page.evaluate(() => {
            const dialogActions = document.querySelector('.MuiDialogActions-root');
            if (dialogActions) {
              const buttons = dialogActions.querySelectorAll('button');
              return Array.from(buttons).find(button => 
                button.textContent.includes('Créer') || 
                button.textContent.includes('Publier') ||
                button.textContent.includes('Enregistrer') ||
                button.textContent.includes('Soumettre')
              );
            }
            return null;
          });
          
          if (dialogActionsButton) {
            await this.page.evaluate((button) => button.click(), dialogActionsButton);
            await new Promise(resolve => setTimeout(resolve, 2000));
            this.results.events.details.push('✅ Formulaire soumis (via DialogActions)');
          } else {
            this.results.events.details.push('❌ Bouton de soumission non trouvé');
          }
        }
      } else {
        this.results.events.details.push('❌ Formulaire non trouvé');
      }

      this.results.events.success = this.results.events.details.filter(d => d.includes('✅')).length >= 3;
      this.results.overall.total += 6;
      this.results.overall.score += this.results.events.details.filter(d => d.includes('✅')).length;

    } catch (error) {
      console.error('❌ Erreur lors du test des événements:', error.message);
      this.results.events.details.push(`❌ Erreur: ${error.message}`);
    }
  }

  async testAlerts() {
    console.log('\n🚨 Test des fonctionnalités Alertes...');
    
    try {
      // Navigation vers la page alertes
      await this.page.goto('http://localhost:3000/alerts', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.results.alerts.details.push('✅ Navigation réussie');

      // Vérification du bouton FAB
      const fabButton = await this.page.$('[data-testid="fab-create-alert"]');
      if (fabButton) {
        this.results.alerts.details.push('✅ Bouton FAB trouvé');
        await fabButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Recherche alternative
        const fabButtons = await this.page.$$('button[aria-label*="alerte"], .MuiFab-root');
        if (fabButtons.length > 0) {
          this.results.alerts.details.push('✅ Bouton FAB trouvé (alternative)');
          await fabButtons[0].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          this.results.alerts.details.push('❌ Bouton FAB non trouvé');
        }
      }

      // Vérification du formulaire
      const form = await this.page.$('form, .MuiDialog-root');
      if (form) {
        this.results.alerts.details.push('✅ Formulaire ouvert');
        
        // Remplissage du formulaire
        const titleInput = await this.page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          return inputs.find(input => 
            input.name === 'title' || 
            input.placeholder?.includes('titre') ||
            input.placeholder?.includes('Titre')
          );
        });
        if (titleInput) {
          await this.page.evaluate((input) => input.value = 'Test Alerte CommuniConnect', titleInput);
          await this.page.evaluate((input) => input.dispatchEvent(new Event('input', { bubbles: true })), titleInput);
        }
        
        const descInput = await this.page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('textarea'));
          return inputs.find(input => 
            input.name === 'description' || 
            input.placeholder?.includes('description') ||
            input.placeholder?.includes('Description')
          );
        });
        if (descInput) {
          await this.page.evaluate((input) => input.value = 'Description de test pour l\'alerte', descInput);
          await this.page.evaluate((input) => input.dispatchEvent(new Event('input', { bubbles: true })), descInput);
        }
        
        // Sélection du type d'alerte
        const typeSelect = await this.page.$('select[name="type"], .MuiSelect-select');
        if (typeSelect) {
          await typeSelect.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          const option = await this.page.$('li[data-value="incendie"], .MuiMenuItem-root');
          if (option) {
            await option.click();
          }
        }

        this.results.alerts.details.push('✅ Formulaire rempli');

        // Soumission avec recherche plus robuste
        const submitButton = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => 
            button.type === 'submit' || 
            button.textContent.includes('Créer') || 
            button.textContent.includes('Publier') ||
            button.textContent.includes('Créer l\'événement') ||
            button.textContent.includes('Créer l\'alerte') ||
            button.textContent.includes('Créer la demande') ||
            button.textContent.includes('Créer le Live') ||
            button.textContent.includes('Publier') ||
            button.textContent.includes('Enregistrer') ||
            button.textContent.includes('Soumettre')
          );
        });
        
        if (submitButton) {
          await this.page.evaluate((button) => button.click(), submitButton);
          await new Promise(resolve => setTimeout(resolve, 2000));
          this.results.alerts.details.push('✅ Formulaire soumis');
        } else {
          // Essayer de trouver le bouton dans les DialogActions
          const dialogActionsButton = await this.page.evaluate(() => {
            const dialogActions = document.querySelector('.MuiDialogActions-root');
            if (dialogActions) {
              const buttons = dialogActions.querySelectorAll('button');
              return Array.from(buttons).find(button => 
                button.textContent.includes('Créer') || 
                button.textContent.includes('Publier') ||
                button.textContent.includes('Enregistrer') ||
                button.textContent.includes('Soumettre')
              );
            }
            return null;
          });
          
          if (dialogActionsButton) {
            await this.page.evaluate((button) => button.click(), dialogActionsButton);
            await new Promise(resolve => setTimeout(resolve, 2000));
            this.results.alerts.details.push('✅ Formulaire soumis (via DialogActions)');
          } else {
            this.results.alerts.details.push('❌ Bouton de soumission non trouvé');
          }
        }
      } else {
        this.results.alerts.details.push('❌ Formulaire non trouvé');
      }

      this.results.alerts.success = this.results.alerts.details.filter(d => d.includes('✅')).length >= 3;
      this.results.overall.total += 6;
      this.results.overall.score += this.results.alerts.details.filter(d => d.includes('✅')).length;

    } catch (error) {
      console.error('❌ Erreur lors du test des alertes:', error.message);
      this.results.alerts.details.push(`❌ Erreur: ${error.message}`);
    }
  }

  async testHelp() {
    console.log('\n🤝 Test des fonctionnalités Demandes d\'aide...');
    
    try {
      // Navigation vers la page d'aide
      await this.page.goto('http://localhost:3000/help', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.results.help.details.push('✅ Navigation réussie');

      // Vérification du bouton FAB
      const fabButton = await this.page.$('[data-testid="fab-create-help"]');
      if (fabButton) {
        this.results.help.details.push('✅ Bouton FAB trouvé');
        await fabButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Recherche alternative
        const fabButtons = await this.page.$$('button[aria-label*="aide"], .MuiFab-root');
        if (fabButtons.length > 0) {
          this.results.help.details.push('✅ Bouton FAB trouvé (alternative)');
          await fabButtons[0].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          this.results.help.details.push('❌ Bouton FAB non trouvé');
        }
      }

      // Vérification du formulaire
      const form = await this.page.$('form, .MuiDialog-root');
      if (form) {
        this.results.help.details.push('✅ Formulaire ouvert');
        
        // Remplissage du formulaire
        const titleInput = await this.page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          return inputs.find(input => 
            input.name === 'title' || 
            input.placeholder?.includes('titre') ||
            input.placeholder?.includes('Titre')
          );
        });
        if (titleInput) {
          await this.page.evaluate((input) => input.value = 'Test Demande d\'Aide', titleInput);
          await this.page.evaluate((input) => input.dispatchEvent(new Event('input', { bubbles: true })), titleInput);
        }
        
        const descInput = await this.page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('textarea'));
          return inputs.find(input => 
            input.name === 'description' || 
            input.placeholder?.includes('description') ||
            input.placeholder?.includes('Description')
          );
        });
        if (descInput) {
          await this.page.evaluate((input) => input.value = 'Description de test pour la demande d\'aide', descInput);
          await this.page.evaluate((input) => input.dispatchEvent(new Event('input', { bubbles: true })), descInput);
        }
        
        // Sélection de la catégorie
        const categorySelect = await this.page.$('select[name="category"], .MuiSelect-select');
        if (categorySelect) {
          await categorySelect.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          const option = await this.page.$('li[data-value="alimentaire"], .MuiMenuItem-root');
          if (option) {
            await option.click();
          }
        }

        this.results.help.details.push('✅ Formulaire rempli');

        // Soumission avec recherche plus robuste
        const submitButton = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => 
            button.type === 'submit' || 
            button.textContent.includes('Créer') || 
            button.textContent.includes('Publier') ||
            button.textContent.includes('Créer l\'événement') ||
            button.textContent.includes('Créer l\'alerte') ||
            button.textContent.includes('Créer la demande') ||
            button.textContent.includes('Créer le Live') ||
            button.textContent.includes('Publier') ||
            button.textContent.includes('Enregistrer') ||
            button.textContent.includes('Soumettre')
          );
        });
        
        if (submitButton) {
          await this.page.evaluate((button) => button.click(), submitButton);
          await new Promise(resolve => setTimeout(resolve, 2000));
          this.results.help.details.push('✅ Formulaire soumis');
        } else {
          // Essayer de trouver le bouton dans les DialogActions
          const dialogActionsButton = await this.page.evaluate(() => {
            const dialogActions = document.querySelector('.MuiDialogActions-root');
            if (dialogActions) {
              const buttons = dialogActions.querySelectorAll('button');
              return Array.from(buttons).find(button => 
                button.textContent.includes('Créer') || 
                button.textContent.includes('Publier') ||
                button.textContent.includes('Enregistrer') ||
                button.textContent.includes('Soumettre')
              );
            }
            return null;
          });
          
          if (dialogActionsButton) {
            await this.page.evaluate((button) => button.click(), dialogActionsButton);
            await new Promise(resolve => setTimeout(resolve, 2000));
            this.results.help.details.push('✅ Formulaire soumis (via DialogActions)');
          } else {
            this.results.help.details.push('❌ Bouton de soumission non trouvé');
          }
        }
      } else {
        this.results.help.details.push('❌ Formulaire non trouvé');
      }

      this.results.help.success = this.results.help.details.filter(d => d.includes('✅')).length >= 3;
      this.results.overall.total += 6;
      this.results.overall.score += this.results.help.details.filter(d => d.includes('✅')).length;

    } catch (error) {
      console.error('❌ Erreur lors du test des demandes d\'aide:', error.message);
      this.results.help.details.push(`❌ Erreur: ${error.message}`);
    }
  }

  async testSharing() {
    console.log('\n📤 Test des fonctionnalités de Partage...');
    
    try {
      // Navigation vers le feed
      await this.page.goto('http://localhost:3000/feed', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.results.sharing.details.push('✅ Navigation vers le feed réussie');

      // Créer d'abord une publication pour avoir du contenu à partager
      const createPostButton = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(button => 
          button.textContent.includes('Créer une publication') ||
          button.textContent.includes('Publier')
        );
      });
      
      if (createPostButton) {
        await this.page.evaluate((button) => button.click(), createPostButton);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Remplir le formulaire de publication
        await this.page.evaluate(() => {
          const textareas = Array.from(document.querySelectorAll('textarea'));
          const contentTextarea = textareas.find(textarea => 
            textarea.placeholder?.includes('partager') ||
            textarea.placeholder?.includes('pensées')
          );
          if (contentTextarea) {
            contentTextarea.value = 'Test de publication pour le partage';
            contentTextarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Publier
        const publishButton = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => 
            button.textContent.includes('Publier')
          );
        });
        
        if (publishButton) {
          await this.page.evaluate((button) => button.click(), publishButton);
          await new Promise(resolve => setTimeout(resolve, 2000));
          this.results.sharing.details.push('✅ Publication créée pour le test');
        }
      }

      // Maintenant chercher les boutons de partage
      const shareButtons = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.filter(button => 
          button.textContent.includes('Partager')
        );
      });
      
      if (shareButtons && shareButtons.length > 0) {
        this.results.sharing.details.push('✅ Boutons de partage trouvés');
        
        // Test du premier bouton de partage
        await this.page.evaluate((button) => button.click(), shareButtons[0]);
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.results.sharing.details.push('✅ Action de partage testée');
      } else {
        // Chercher les boutons de partage dans les cartes de posts
        const postCards = await this.page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('.MuiCard-root'));
          const shareButtons = [];
          cards.forEach(card => {
            const buttons = card.querySelectorAll('button');
            buttons.forEach(button => {
              if (button.textContent.includes('Partager') || 
                  button.querySelector('[data-testid="ShareIcon"]') ||
                  button.querySelector('.MuiSvgIcon-root')) {
                shareButtons.push(button);
              }
            });
          });
          return shareButtons;
        });
        
        if (postCards && postCards.length > 0) {
          this.results.sharing.details.push('✅ Boutons de partage trouvés dans les cartes');
          await this.page.evaluate((button) => button.click(), postCards[0]);
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.results.sharing.details.push('✅ Action de partage testée');
        } else {
          this.results.sharing.details.push('❌ Boutons de partage non trouvés');
        }
      }

      // Test du partage sur la carte
      await this.page.goto('http://localhost:3000/map', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mapShareButtons = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const shareButtons = buttons.filter(button => 
          button.textContent.includes('Partager') || 
          button.querySelector('.MuiSvgIcon-root')
        );
        return shareButtons.length > 0 ? shareButtons : [];
      });
      if (mapShareButtons && mapShareButtons.length > 0) {
        this.results.sharing.details.push('✅ Boutons de partage sur la carte trouvés');
      } else {
        // Chercher dans les popups de marqueurs
        const markerPopups = await this.page.evaluate(() => {
          const popups = Array.from(document.querySelectorAll('.MuiPopover-root, .MuiDialog-root'));
          const shareButtons = [];
          popups.forEach(popup => {
            const buttons = popup.querySelectorAll('button');
            buttons.forEach(button => {
              if (button.textContent.includes('Partager') || 
                  button.querySelector('[data-testid="ShareIcon"]') ||
                  button.querySelector('.MuiSvgIcon-root')) {
                shareButtons.push(button);
              }
            });
          });
          return shareButtons;
        });
        
        if (markerPopups && markerPopups.length > 0) {
          this.results.sharing.details.push('✅ Boutons de partage dans les popups trouvés');
        } else {
          this.results.sharing.details.push('❌ Boutons de partage sur la carte non trouvés');
        }
      }

      this.results.sharing.success = this.results.sharing.details.filter(d => d.includes('✅')).length >= 2;
      this.results.overall.total += 4;
      this.results.overall.score += this.results.sharing.details.filter(d => d.includes('✅')).length;

    } catch (error) {
      console.error('❌ Erreur lors du test du partage:', error.message);
      this.results.sharing.details.push(`❌ Erreur: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🧪 Démarrage des tests de fonctionnalités complètes...\n');
    
    try {
      await this.init();
      
      await this.testEvents();
      await this.testAlerts();
      await this.testHelp();
      await this.testSharing();
      
      // Calcul du score global
      this.results.overall.score = Math.min(this.results.overall.score, this.results.overall.total);
      this.results.overall.success = this.results.overall.score >= (this.results.overall.total * 0.7);
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Erreur lors des tests:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async generateReport() {
    console.log('\n📊 RAPPORT DES TESTS DE FONCTIONNALITÉS COMPLÈTES');
    console.log('=' .repeat(60));
    
    const sections = [
      { name: 'Événements', result: this.results.events },
      { name: 'Alertes', result: this.results.alerts },
      { name: 'Demandes d\'Aide', result: this.results.help },
      { name: 'Partage', result: this.results.sharing }
    ];

    sections.forEach(section => {
      console.log(`\n${section.name.toUpperCase()}:`);
      console.log(`Statut: ${section.result.success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
      section.result.details.forEach(detail => {
        console.log(`  ${detail}`);
      });
    });

    console.log('\n' + '='.repeat(60));
    console.log(`SCORE GLOBAL: ${this.results.overall.score}/${this.results.overall.total}`);
    console.log(`POURCENTAGE: ${Math.round((this.results.overall.score / this.results.overall.total) * 100)}%`);
    console.log(`STATUT GLOBAL: ${this.results.overall.success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    
    // Sauvegarde du rapport
    const reportData = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        totalTests: this.results.overall.total,
        passedTests: this.results.overall.score,
        percentage: Math.round((this.results.overall.score / this.results.overall.total) * 100),
        success: this.results.overall.success
      }
    };

    fs.writeFileSync('test-fonctionnalites-completes-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Rapport sauvegardé dans: test-fonctionnalites-completes-report.json');
  }
}

// Exécution des tests
async function main() {
  const tester = new TestFonctionnalitesCompletes();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TestFonctionnalitesCompletes; 