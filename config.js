

// EmailJS: https://www.emailjs.com/
// - Maak account → Add new service (SMTP provider of EmailJS default)
// - Maak email template met variabelen: from_email, subject, message
// - Haal je PUBLIC KEY, SERVICE ID en TEMPLATE ID op (Dashboard → Integration)
window.EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";
window.EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
window.EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
// In je template kun je de "from_name" op "MatteoDesignsnoreply" zetten,
// of we sturen het mee in app.js (zie onder).

// Firebase config (Project settings → General → Your apps → Web)
window.FIREBASE_CONFIG = {
  apiKey: "AIza...yourkey",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef",
};

// Dashboard beveiliging: optioneel restrict op e-maildomein
window.ADMIN_ALLOWED_EMAILS = [
  // bv. "jij@jouwdomein.com"
];