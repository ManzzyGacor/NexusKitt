/**
 * NEXUSKIT MAIN JS (ONE PAGE EDITION)
 */

let currentUser = { username: null, role: null, token: null };

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    
    // Setup Register Link
    const regLink = document.querySelector('#auth-modal p a');
    if(regLink) regLink.addEventListener('click', (e) => { e.preventDefault(); doRegister(); });
});

// --- AUTH & SESSION ---
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
}

function checkSession() {
    const token = localStorage.getItem('nexusToken');
    if (token) {
        const decoded = parseJwt(token);
        if (decoded && Date.now() < decoded.exp * 1000) {
            currentUser = { username: decoded.username, role: decoded.role, token: token };
            updateUI(true);
        } else {
            logout(); // Token expired
        }
    } else {
        updateUI(false);
    }
}

function updateUI(isLoggedIn) {
    const toolsContainer = document.getElementById('tools-container');
    const authBtn = document.getElementById('auth-btn');
    const resellerSection = document.getElementById('reseller');

    if (isLoggedIn) {
        // 1. Ganti Tombol Login jadi Profile/Logout
        authBtn.innerText = "Hi, " + currentUser.username;
        authBtn.onclick = () => {
            if(confirm("Logout?")) logout();
        };

        // 2. Buka Gembok Tools
        toolsContainer.classList.remove('tools-locked');
        toolsContainer.classList.add('tools-unlocked');

        // 3. Tampilkan Panel Reseller jika berhak
        if(['reseller', 'reseller+', 'owner'].includes(currentUser.role)) {
            resellerSection.style.display = 'flex'; // Flex agar layout one-page rapi
        }
    } else {
        // Default State (Locked)
        authBtn.innerText = "Login";
        authBtn.onclick = openLogin;
        
        toolsContainer.classList.remove('tools-unlocked');
        toolsContainer.classList.add('tools-locked');
        
        resellerSection.style.display = 'none';
    }
}

// --- LOGIN & REGISTER ---
async function performLogin() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    const btn = document.querySelector('#auth-modal button');

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
            updateUI(true);
            closeLogin();
            // Scroll ke tools otomatis setelah login
            document.getElementById('tools').scrollIntoView(); 
        } else {
            alert("Gagal: " + data.error);
        }
    } catch (err) { alert("Error Server"); } 
    finally { btn.innerText = "Enter The Galaxy"; }
}

function logout() {
    localStorage.removeItem('nexusToken');
    location.reload();
}

async function doRegister() {
    const u = prompt("Username:");
    const p = prompt("Password:");
    if(!u || !p) return;
    
    try {
        await fetch('/api/register', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({username:u, password:p})
        });
        alert("Daftar sukses! Silahkan login.");
    } catch(e) { alert("Error"); }
}

// --- MODAL UTILS ---
function openLogin() { document.getElementById('auth-modal').style.display = 'block'; }
function closeLogin() { document.getElementById('auth-modal').style.display = 'none'; }
window.onclick = function(e) { if(e.target == document.getElementById('auth-modal')) closeLogin(); }

// --- TOOLS FUNCTIONS (Sama seperti sebelumnya) ---
function toolPassGen() {
    const chars = "ABCabc123!@#"; let pass = "";
    for(let i=0; i<12; i++) pass += chars.charAt(Math.floor(Math.random()*chars.length));
    document.getElementById('res-pass').innerText = pass;
}
function toolWordCount() {
    const txt = document.getElementById('word-input').value;
    document.getElementById('res-word').innerText = "Words: " + (txt.trim() ? txt.trim().split(/\s+/).length : 0);
}
function toolColor() {
    document.getElementById('res-color').innerText = document.getElementById('color-input').value;
}
function toolBase64() {
    try { document.getElementById('res-b64').innerText = btoa(document.getElementById('b64-input').value); } 
    catch(e){ document.getElementById('res-b64').innerText = "Err"; }
}
async function toolMyIP() {
    document.getElementById('res-ip').innerText = "Scanning...";
    try {
        const r = await fetch('https://api.ipify.org?format=json');
        const d = await r.json();
        document.getElementById('res-ip').innerText = d.ip;
    } catch(e) { document.getElementById('res-ip').innerText = "Failed"; }
}
function toolDiscount() {
    const p = document.getElementById('price').value, d = document.getElementById('disc').value;
    document.getElementById('res-disc').innerText = "Bayar: " + (p - (p*(d/100)));
}