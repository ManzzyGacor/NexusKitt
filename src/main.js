/**
 * NEXUSKIT MAIN JAVASCRIPT
 * Version: 2.0 (Connected to Backend)
 * Author: ManzzyID
 */

// --- 1. STATE MANAGEMENT & INITIALIZATION ---
let currentUser = {
    username: null,
    role: null,
    expiry: null,
    token: null
};

// Jalankan saat website dimuat
document.addEventListener('DOMContentLoaded', () => {
    checkSession(); // Cek apakah user sudah login sebelumnya
    
    // Event Listener untuk Tombol Daftar di Modal
    const registerLink = document.querySelector('#auth-modal p a');
    if(registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            doRegister();
        });
    }

    // Load default view
    switchView('home');
});

// --- 2. VIEW CONTROLLER (Navigasi) ---
function switchView(viewId) {
    // Sembunyikan semua section
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => sec.style.display = 'none');
    
    // Logika Proteksi Halaman
    if (viewId === 'tools') {
        if (!checkAccess(['member','vip','vvip','reseller','reseller+','owner'])) {
            alert("Akses Ditolak! Fitur ini khusus Member terdaftar.");
            switchView('pricing');
            return;
        }
    }

    if (viewId === 'reseller') {
        if (!checkAccess(['reseller','reseller+','owner'])) {
            alert("Akses Ditolak! Halaman ini khusus Reseller.");
            switchView('home');
            return;
        }
    }

    // Tampilkan section target
    const target = document.getElementById(viewId);
    if(target) {
        target.style.display = 'block';
        // Animasi fade in ulang
        target.style.animation = 'none';
        target.offsetHeight; /* trigger reflow */
        target.style.animation = 'fadeIn 0.5s ease-in-out';
    }
}

function checkAccess(allowedRoles) {
    if(!currentUser.role) return false;
    return allowedRoles.includes(currentUser.role);
}

// --- 3. AUTH SYSTEM (Login & Register via API) ---

// Fungsi Helper: Parse JWT Token tanpa library tambahan
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function checkSession() {
    const token = localStorage.getItem('nexusToken');
    if (token) {
        const decoded = parseJwt(token);
        if (decoded) {
            // Cek apakah token expired
            if (Date.now() >= decoded.exp * 1000) {
                logout();
                return;
            }
            // Restore session
            currentUser = {
                username: decoded.username,
                role: decoded.role,
                token: token,
                expiry: decoded.expiry || '-' 
            };
            updateUI();
        }
    }
}

async function performLogin() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    const btn = document.querySelector('#auth-modal button');
    
    if(!u || !p) return alert("Username dan Password wajib diisi!");

    btn.innerText = "Connecting to Galaxy...";
    btn.disabled = true;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('nexusToken', data.token);
            currentUser = {
                username: data.username,
                role: data.role,
                expiry: data.expiry,
                token: data.token
            };
            
            alert(`Welcome Commander ${data.username}!`);
            updateUI();
            closeLogin();
            switchView('tools'); // Redirect ke tools setelah login
        } else {
            alert("Login Gagal: " + data.error);
        }
    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan koneksi ke server.");
    } finally {
        btn.innerText = "Enter The Galaxy";
        btn.disabled = false;
    }
}

async function doRegister() {
    const u = prompt("Masukkan Username yang diinginkan:");
    if(!u) return;
    const p = prompt("Masukkan Password:");
    if(!p) return;

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();
        if(res.ok) {
            alert("Registrasi Berhasil! Silahkan Login.");
        } else {
            alert("Gagal: " + data.error);
        }
    } catch(err) {
        alert("Error koneksi saat register.");
    }
}

function logout() {
    localStorage.removeItem('nexusToken');
    location.reload();
}

// UI Updates
function updateUI() {
    if(currentUser.username) {
        const authBtn = document.getElementById('auth-btn');
        authBtn.innerText = currentUser.username;
        authBtn.onclick = () => switchView('profile'); // Klik nama user ke profile
        
        document.getElementById('p-username').innerText = currentUser.username;
        document.getElementById('p-role').innerText = currentUser.role.toUpperCase();
        
        // Show Reseller Menu jika role sesuai
        if(['reseller', 'reseller+', 'owner'].includes(currentUser.role)) {
            document.getElementById('reseller-menu').style.display = 'block';
        }

        // Setup Reseller Dropdown Logic
        const optReseller = document.getElementById('opt-reseller');
        if(optReseller) {
            if(currentUser.role === 'reseller+' || currentUser.role === 'owner') {
                optReseller.disabled = false;
                optReseller.innerText = "Reseller";
            } else {
                optReseller.disabled = true;
                optReseller.innerText = "Reseller (Locked)";
            }
        }
    }
}

// Modal Logic
function openLogin() { document.getElementById('auth-modal').style.display = 'block'; }
function closeLogin() { document.getElementById('auth-modal').style.display = 'none'; }
// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('auth-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// --- 4. RESELLER PANEL LOGIC ---

async function addRole() {
    const target = document.getElementById('target-username').value;
    const role = document.getElementById('role-select').value;
    const btn = document.querySelector('.panel-box button');

    if(!target) return alert("Masukkan username target!");
    
    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        const res = await fetch('/api/add-role', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + currentUser.token 
            },
            body: JSON.stringify({ targetUsername: target, newRole: role })
        });

        const data = await res.json();
        
        if (res.ok) {
            alert(data.message);
            document.getElementById('target-username').value = ""; // Clear input
        } else {
            alert("Gagal: " + data.error);
        }
    } catch (err) {
        alert("Terjadi kesalahan sistem.");
    } finally {
        btn.innerText = "Add Role";
        btn.disabled = false;
    }
}

// --- 5. TOOLS FUNCTIONS (10+ Tools) ---

// 1. Password Generator
function toolPassGen() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for(let i=0; i<16; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    document.getElementById('res-pass').innerText = pass;
}

// 2. Word Counter
function toolWordCount() {
    const txt = document.getElementById('word-input').value;
    const count = txt.trim() ? txt.trim().split(/\s+/).length : 0;
    const chars = txt.length;
    document.getElementById('res-word').innerText = `Words: ${count} | Chars: ${chars}`;
}

// 3. Color Picker (HEX to RGB)
function toolColor() {
    const hex = document.getElementById('color-input').value;
    // Convert hex to rgb
    const r = parseInt(hex.substr(1,2), 16);
    const g = parseInt(hex.substr(3,2), 16);
    const b = parseInt(hex.substr(5,2), 16);
    document.getElementById('res-color').innerText = `${hex} \n RGB(${r}, ${g}, ${b})`;
}

// 4. Base64 Encoder
function toolBase64() {
    const txt = document.getElementById('b64-input').value;
    if(!txt) return;
    try {
        document.getElementById('res-b64').innerText = btoa(txt);
    } catch(e) { document.getElementById('res-b64').innerText = "Error: Invalid Input"; }
}

// 5. Public IP Checker (Real API)
async function toolMyIP() {
    const resBox = document.getElementById('res-ip');
    resBox.innerText = "Scanning Satellite...";
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        resBox.innerText = "Public IP: " + data.ip;
    } catch (e) {
        resBox.innerText = "Error: Connection Failed";
    }
}

// 6. Discount Calculator
function toolDiscount() {
    const p = parseFloat(document.getElementById('price').value);
    const d = parseFloat(document.getElementById('disc').value);
    if(isNaN(p) || isNaN(d)) return;
    
    const hemat = p * (d/100);
    const total = p - hemat;
    
    document.getElementById('res-disc').innerHTML = 
        `Bayar: <strong>Rp ${total.toLocaleString()}</strong><br>` +
        `<small>Hemat: Rp ${hemat.toLocaleString()}</small>`;
}

// 7. Case Converter (Upper/Lower) - *New*
// Tambahkan HTML untuk tool ini di index.html jika ingin muncul
/*
<div class="tool-card">
  <h3>🔠 Case Converter</h3>
  <input type="text" id="case-input" placeholder="Text here...">
  <button onclick="toolUpperCase()">UPPERCASE</button>
  <button onclick="toolLowerCase()" style="margin-top:5px; background:transparent; border:1px solid var(--primary);">lowercase</button>
  <div id="res-case" class="result-box"></div>
</div>
*/
function toolUpperCase() {
    const txt = document.getElementById('case-input').value;
    document.getElementById('res-case').innerText = txt.toUpperCase();
}
function toolLowerCase() {
    const txt = document.getElementById('case-input').value;
    document.getElementById('res-case').innerText = txt.toLowerCase();
}

// 8. Text Repeater - *New*
/*
<div class="tool-card">
  <h3>🔁 Text Repeater</h3>
  <input type="text" id="rep-txt" placeholder="Text">
  <input type="number" id="rep-count" placeholder="Count (e.g. 10)">
  <button onclick="toolRepeat()">Repeat</button>
  <div id="res-rep" class="result-box" style="max-height:100px; overflow:auto;"></div>
</div>
*/
function toolRepeat() {
    const txt = document.getElementById('rep-txt').value;
    const count = parseInt(document.getElementById('rep-count').value);
    if(!txt || isNaN(count)) return;
    
    let result = "";
    for(let i=0; i<count; i++) result += txt + " ";
    document.getElementById('res-rep').innerText = result;
}

// 9. Random Number Generator - *New*
/*
<div class="tool-card">
  <h3>🎲 RNG (1-100)</h3>
  <button onclick="toolRNG()">Roll Dice</button>
  <div id="res-rng" class="result-box" style="font-size: 2em;"></div>
</div>
*/
function toolRNG() {
    const num = Math.floor(Math.random() * 100) + 1;
    document.getElementById('res-rng').innerText = num;
}

// 10. Aspect Ratio Calculator - *New*
/*
<div class="tool-card">
  <h3>📐 Aspect Ratio</h3>
  <input type="number" id="ar-w" placeholder="Width">
  <input type="number" id="ar-h" placeholder="Height">
  <button onclick="toolRatio()">Calc Ratio</button>
  <div id="res-ar" class="result-box"></div>
</div>
*/
function toolRatio() {
    const w = parseInt(document.getElementById('ar-w').value);
    const h = parseInt(document.getElementById('ar-h').value);
    
    function gcd (a, b) { return (b == 0) ? a : gcd (b, a%b); }
    const r = gcd(w, h);
    
    document.getElementById('res-ar').innerText = `${w/r}:${h/r}`;
}