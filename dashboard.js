import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, collection, query, where, orderBy, limit, getDocs, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Init Firebase
const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// UI refs
const loginBox = document.getElementById('loginBox');
const dashBox = document.getElementById('dashBox');
const topActions = document.getElementById('topActions');
const loginForm = document.getElementById('loginForm');
const loginAlert = document.getElementById('loginAlert');
const btnLogout = document.getElementById('btnLogout');
const rows = document.getElementById('rows');
const countText = document.getElementById('countText');
const searchForm = document.getElementById('searchForm');
const qInput = document.getElementById('q');
const statusSel = document.getElementById('status');

function showLogin() {
  loginBox.style.display = 'block';
  dashBox.style.display = 'none';
  topActions.style.display = 'none';
}
function showDashboard() {
  loginBox.style.display = 'none';
  dashBox.style.display = 'block';
  topActions.style.display = 'flex';
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Optioneel: restrict op specifieke admins
    const allowed = window.ADMIN_ALLOWED_EMAILS;
    if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(user.email)) {
      signOut(auth);
      loginAlert.textContent = "Deze gebruiker is niet geautoriseerd voor het dashboard.";
      loginAlert.style.display = 'block';
      showLogin();
      return;
    }
    showDashboard();
    loadData();
  } else {
    showLogin();
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginAlert.style.display = 'none';
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    loginAlert.textContent = err?.message || "Inloggen mislukt.";
    loginAlert.style.display = 'block';
  }
});

btnLogout.addEventListener('click', async () => {
  await signOut(auth);
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loadData();
});

async function loadData() {
  // NB: Firestore ondersteunt geen full-text LIKE; we doen client-side filter.
  // Voor grotere datasets kun je Algolia of Firestore's nieuwe FT-integraties gebruiken.
  const status = statusSel.value;
  rows.innerHTML = `<tr><td colspan="5">Laden…</td></tr>`;

  // Query basis: laatste 200
  const qRef = query(
    collection(db, "messages"),
    orderBy("created_at", "desc"),
    limit(200)
  );
  const snap = await getDocs(qRef);
  let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Client-side filteren
  const term = qInput.value.trim().toLowerCase();
  if (term) {
    data = data.filter(r => 
      (r.sender_email || '').toLowerCase().includes(term) ||
      (r.subject || '').toLowerCase().includes(term) ||
      (r.message || '').toLowerCase().includes(term)
    );
  }
  if (status === 'ok') data = data.filter(r => r.sent_ok === true);
  if (status === 'err') data = data.filter(r => r.sent_ok === false);

  countText.textContent = `${data.length} resultaten gevonden`;

  // Render
  if (data.length === 0) {
    rows.innerHTML = `<tr><td colspan="5">Geen berichten gevonden.</td></tr>`;
    return;
  }
  rows.innerHTML = data.map(r => {
    let dt = r.created_at;
    if (dt && dt.seconds) {
      const d = new Date(dt.seconds * 1000);
      dt = d.toLocaleString();
    } else {
      dt = '-';
    }
    const msg = (r.message || "");
    const short = msg.length > 200 ? (msg.substring(0,200) + "…") : msg;
    const badge = r.sent_ok ? `<span class="badge ok">OK</span>` :
                              `<span class="badge err" title="${(r.error||'').replace(/"/g, '&quot;')}">FOUT</span>`;
    return `
      <tr>
        <td style="white-space:nowrap;">${escapeHtml(dt)}</td>
        <td>${escapeHtml(r.sender_email || '')}</td>
        <td>${escapeHtml(r.subject || '')}</td>
        <td>${nl2br(escapeHtml(short))}</td>
        <td>${badge}</td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function nl2br(s) {
  return s.replace(/\n/g, '<br>');
}