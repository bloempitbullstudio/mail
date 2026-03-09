import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Init EmailJS
(function() {
  if (!window.EMAILJS_PUBLIC_KEY) {
    console.warn("EmailJS public key ontbreekt (config.js).");
  } else {
    emailjs.init(window.EMAILJS_PUBLIC_KEY);
  }
})();

// Init Firebase + Firestore
const app = initializeApp(window.FIREBASE_CONFIG);
const db = getFirestore(app);

const form = document.getElementById('mailForm');
const alertBox = document.getElementById('alert');

function showAlert(text, type = "") {
  alertBox.textContent = text;
  alertBox.className = `alert ${type ? type : ""}`;
  alertBox.style.display = "block";
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.style.display = "none";

  const email = document.getElementById('email').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const message = document.getElementById('message').value.trim();

  if (!email || !subject || !message) {
    showAlert("Gelieve alle velden in te vullen.", "error");
    return;
  }

  // 1) Verstuur e‑mail via EmailJS
  let sentOk = false;
  let errorMsg = null;
  try {
    const params = {
      from_email: email,
      subject: subject,
      message: message,
      from_name: "MatteoDesignsnoreply", // afzendernaam
    };
    await emailjs.send(window.EMAILJS_SERVICE_ID, window.EMAILJS_TEMPLATE_ID, params);
    sentOk = true;
  } catch (err) {
    sentOk = false;
    errorMsg = err?.text || err?.message || "Onbekende fout bij e‑mail verzenden.";
    console.error("EmailJS error", err);
  }

  // 2) Sla op in Firestore (altijd, met status)
  try {
    await addDoc(collection(db, "messages"), {
      sender_email: email,
      subject: subject,
      message: message,
      sent_ok: sentOk,
      error: sentOk ? null : String(errorMsg || ""),
      created_at: serverTimestamp(),
      ua: navigator.userAgent || "",
    });
  } catch (err) {
    console.error("Opslaan in Firestore mislukt:", err);
    showAlert("Opslaan mislukt. Controleer je Firestore regels/instellingen.", "error");
    return;
  }

  if (sentOk) {
    showAlert("Je bericht is verzonden en opgeslagen. Bedankt!", "success");
    form.reset();
  } else {
    showAlert("Verzenden mislukt, maar het bericht is wel opgeslagen in het dashboard. Fout: " + (errorMsg || ""), "error");
  }
});