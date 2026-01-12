/**
 * NEXUSKIT MAIN LOGIC
 * Fix: Button Scope & Role Access
 */

let currentUser = { username: null, role: 'guest', token: null };

// --- 1. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    
    // Default View
    switchView('home');

    // Register Listener
    const regLink = document.getElementById('reg-link');
    if(regLink) regLink.addEventListener('click', (e) => { 
        e.preventDefault(); 
        doRegister(); 
    });
});

// --- 2. NAVIGATION & ROLE LOGIC ---
function switchView(viewId) {
    // Sembunyikan semua section
    document.querySelectorAll('.view-section').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });

    // Tampilkan target
    const target = document.getElementById(viewId);
    if(target) {
        target.style.display = 'block';
        target.classList.add('active');
    }

    // UPDATE UI LOGIC SAAT PINDAH HALAMAN
    if (viewId === 'tools') updateToolsAccess();
    if (viewId === 'reseller' && !['reseller','reseller+','owner'].includes(currentUser.role)) {
        alert("Restricted Area!");
        switchView('home');
    }
}

// Fungsi Mengatur Kunci/Buka Tools
function updateToolsAccess() {
    const overlay = document.getElementById('guest-overlay');
    const badge = document.getElementById('status-badge');
    const cards = document.querySelectorAll('.tool-card');

    badge.innerText = currentUser.role.toUpperCase();

    // KONDISI 1: GUEST (Belum Login)
    if (currentUser.role === 'guest') {
        overlay.style.display = 'flex'; // Tutup semua
        return;
    } 

    // KONDISI 2: SUDAH LOGIN
    overlay.style.display = 'none'; // Buka overlay utama

    cards.forEach(card => {
        const type = card.getAttribute('data-type');
        
        // Reset dulu
        card.classList.remove('is-locked');

        // Logic Member vs VIP
        if (currentUser.role === 'member') {
            if (type === 'vip') {
                card.classList.add('is-locked'); // Kunci yang VIP saja
            }
        }
        // VIP/Owner/Reseller -> Tidak ada yang dikunci (Loss doll)
    });
}

// --- 3. AUTH SYSTEM ---
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
    } catch (e) { return null; }
}

function checkSession() {
    const token = localStorage.getItem('nexusToken');
    if (token) {
        const decoded = parseJwt(token);
        if (decoded && Date.now() < decoded.exp * 1000) {
            currentUser = { username: decoded.username, role: decoded.role, token: token };
            updateAuthUI(true);
        } else {
            logout();
        }
    }
}

function updateAuthUI(isLoggedIn) {
    const btn = document.getElementById('auth-btn');
    if (isLoggedIn) {
        btn.innerText = currentUser.username;
        btn.onclick = () => { if(confirm("Logout?")) logout(); };
        
        // Show Reseller Menu
        if(['reseller','reseller+','owner'].includes(currentUser.role)){
            document.getElementById('reseller-menu').style.display = 'block';
        }
    } else {
        btn.innerText = "Login";
        btn.onclick = openLogin;
    }
}

async function performLogin() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    const btn = document.querySelector('#auth-modal button');
    
    if(!u || !p) return alert("Isi semua!");
    btn.innerText = "Processing...";

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('nexusToken', data.token);
            currentUser = { username: data.username, role: data.role, token: data.token };
            updateAuthUI(true);
            closeLogin();
            switchView('tools'); // Pindah ke tools setelah login
        } else {
            alert(data.error);
        }
    } catch (e) { alert("Connection Error"); }
    finally { btn.innerText = "Enter The Galaxy"; }
}

function logout() {
    localStorage.removeItem('nexusToken');
    location.reload();
}

async function doRegister() {
    const u = prompt("New Username:");
    const p = prompt("New Password:");
    if(!u || !p) return;
    // Panggil API Register
    try {
        await fetch('/api/register', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({username:u, password:p})
        });
        alert("Success! Please Login.");
    } catch(e) { alert("Error"); }
}

// --- 4. TOOL FUNCTIONS ---
function toolPassGen() {
    const chars = "XYZ123!@#abc"; 
    let res = ""; 
    for(let i=0;i<10;i++) res+=chars.charAt(Math.floor(Math.random()*chars.length));
    document.getElementById('res-pass').innerText = res;
}
function toolWordCount() {
    const val = document.getElementById('word-input').value;
    document.getElementById('res-word').innerText = "Words: " + (val.trim() ? val.trim().split(/\s+/).length : 0);
}
function toolColor() {
    document.getElementById('res-color').innerText = document.getElementById('color-input').value;
}
function toolBase64() {
    try { document.getElementById('res-b64').innerText = btoa(document.getElementById('b64-input').value); } 
    catch(e){ document.getElementById('res-b64').innerText = "Error"; }
}
async function toolMyIP() {
    document.getElementById('res-ip').innerText = "Scanning...";
    try {
        const req = await fetch('https://api.ipify.org?format=json');
        const data = await req.json();
        document.getElementById('res-ip').innerText = data.ip;
    } catch(e){ document.getElementById('res-ip').innerText = "Failed"; }
}

// --- 5. RESELLER ---
async function addRole() {
    const target = document.getElementById('target-username').value;
    const role = document.getElementById('role-select').value;
    // Logika fetch add-role disini (sama seperti sebelumnya)
    try {
        const res = await fetch('/api/add-role', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + currentUser.token 
            },
            body: JSON.stringify({ targetUsername: target, newRole: role })
        });
        const d = await res.json();
        alert(res.ok ? d.message : d.error);
    } catch(e) { alert("Error"); }
}

// --- 6. GLOBAL EXPORT (Fix Button Issue) ---
// Ini WAJIB ada agar HTML onclick="" bisa baca function JS
window.switchView = switchView;
window.openLogin = () => document.getElementById('auth-modal').style.display = 'block';
window.closeLogin = () => document.getElementById('auth-modal').style.display = 'none';
window.performLogin = performLogin;
window.toolPassGen = toolPassGen;
window.toolWordCount = toolWordCount;
window.toolColor = toolColor;
window.toolBase64 = toolBase64;
window.toolMyIP = toolMyIP;
window.addRole = addRole;