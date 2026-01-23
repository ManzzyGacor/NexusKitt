const API_BOTCAHX = 'Varesa';
const API_ANABOT = 'freeApikey';

// --- Auth System ---
async function auth(action) {
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  
  if(!u || !p) return alert("Isi semua data!");

  try {
    const req = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, username: u, password: p })
    });
    const res = await req.json();

    if(res.success) {
      if(action === 'login') {
        localStorage.setItem('user', JSON.stringify(res.data));
        window.location.href = 'tools.html';
      } else {
        alert("Daftar berhasil! Silakan login.");
      }
    } else {
      alert(res.error);
    }
  } catch(e) { alert("Error koneksi"); }
}

// --- Dashboard Logic ---
function checkSession() {
  const data = localStorage.getItem('user');
  if(!data && window.location.pathname.includes('tools.html')) {
    window.location.href = 'login.html';
  }
  if(data) {
    const user = JSON.parse(data);
    if(document.getElementById('navProfilePic')) {
      document.getElementById('navProfilePic').src = user.pic;
      document.getElementById('modalPic').src = user.pic;
      document.getElementById('modalName').innerText = user.username;
      document.getElementById('modalRole').innerText = user.role;
      document.getElementById('modalExp').innerText = user.expired;
    }
  }
}
window.onload = checkSession;

function toggleProfile() {
  document.getElementById('profileModal').classList.toggle('active');
}
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// --- Tools Logic ---
const toolModal = document.getElementById('toolModal');
const toolTitle = document.getElementById('toolTitle');
const toolContent = document.getElementById('toolContent');
const toolResult = document.getElementById('toolResult');

function closeTool() {
  toolModal.classList.remove('active');
  toolResult.style.display = 'none';
}

function openTool(type) {
  toolModal.classList.add('active');
  toolResult.style.display = 'none';
  let html = '';

  if (type === 'unban') {
    toolTitle.innerText = "UNBAN WHATSAPP";
    // SAYA UPDATE OPSI DI SINI AGAR SESUAI CASE NYA
    html = `
      <label style="font-size:0.8rem; margin-bottom:5px; display:block;">Nomor Target</label>
      <input type="tel" id="nomor" class="form-input" placeholder="628xxx / +628xxx">
      
      <label style="font-size:0.8rem; margin:10px 0 5px; display:block;">Metode Banding</label>
      <select id="alasan" class="form-select">
        <option value="permafresh">PERMA FRESH (Baru Kena)</option>
        <option value="SPAM">SPAM (Salah Deteksi)</option>
        <option value="PERMA HARD">PERMA HARD (Susah Lepas)</option>
        <option value="PERMASEMINGGU">PERMA -SEMINGGU</option>
        <option value="opsi5">PERMA BATU (Bahasa Turki/India)</option>
      </select>
      
      <button onclick="execUnban()" class="btn" style="width:100%; margin-top:15px;">KIRIM EMAIL</button>
      <p style="font-size:0.7rem; margin-top:10px; opacity:0.6; text-align:center;">
        <i class="fas fa-info-circle"></i> Tombol ini akan membuka aplikasi Email otomatis.
      </p>
    `;
  } else if (type === 'downloader') {
    toolTitle.innerText = "ALL DOWNLOADER";
    html = `<input id="url" class="form-input" placeholder="Link TikTok/IG/Youtube"><button onclick="execDownloader()" class="btn" style="width:100%; margin-top:10px;">DOWNLOAD</button>`;
  } else if (type === 'ngl') {
    toolTitle.innerText = "SPAM NGL";
    html = `
      <input id="nglUser" class="form-input" placeholder="Username NGL">
      <input id="nglMsg" class="form-input" placeholder="Pesan">
      <input id="nglCount" type="number" class="form-input" placeholder="Jumlah" value="5">
      <button onclick="execNGL()" class="btn" style="width:100%; margin-top:10px;">GAS SPAM</button>
    `;
  } else if (type === 'fakechat') {
    toolTitle.innerText = "IPHONE CHAT";
    html = `<input id="chatText" class="form-input" placeholder="Teks Chat"><button onclick="execFakeChat()" class="btn" style="width:100%; margin-top:10px;">BUAT</button>`;
  } else if (type === 'removebg') {
    toolTitle.innerText = "REMOVE BG";
    html = `<input id="bgUrl" class="form-input" placeholder="URL Gambar"><button onclick="execRemBg()" class="btn" style="width:100%; margin-top:10px;">HAPUS BG</button>`;
  } else if (type === 'logo') {
    toolTitle.innerText = "LOGO CREATOR";
    html = `<input id="logoPrompt" class="form-input" placeholder="Prompt (ex: cat cyberpunk)"><button onclick="execLogo()" class="btn" style="width:100%; margin-top:10px;">BUAT</button>`;
  } else if (type === 'bypass') {
    toolTitle.innerText = "BYPASS CF";
    html = `<input id="cfUrl" class="form-input" placeholder="URL"><input id="cfKey" class="form-input" placeholder="SiteKey"><button onclick="execBypass()" class="btn" style="width:100%; margin-top:10px;">BYPASS</button>`;
  }
  
  toolContent.innerHTML = html;
}

// --- FUNGSI EKSEKUSI ---

// 1. Unban WA Logic (Full Template Integration)
function execUnban() {
    let nomor = document.getElementById('nomor').value;
    const alasan = document.getElementById('alasan').value;
    
    if(!nomor) return alert("Nomor wajib diisi!");

    // Normalisasi Nomor (Supaya formatnya rapi sesuai template)
    nomor = nomor.trim().replace(/\s+/g,'');
    // Jika user nulis 08xx, ubah jadi 628xx. Jika sudah +62 atau 62 biarkan.
    if(/^[0][0-9]+$/.test(nomor)) nomor = '62' + nomor.slice(1);
    
    // Variabel tampilNomor yang dipakai di dalam template string
    const tampilNomor = (nomor.startsWith('+') || nomor.startsWith('62')) ? nomor : ('+'+nomor);
    
    let result = { to: '', subject: '', body: '' };

    // --- TEMPLATE SESUAI PERMINTAAN ---
    switch(alasan){
      case "permafresh":
        result = {
          to: 'support@support.whatsapp.com',
          subject: 'Hello whatsapp developer, please help me.',
          body: `Hello developer, my Whatsapp is Vixzz. I would like to ask for help regarding my account being blocked a few hours ago. I don't know the exact reason, but when I woke up and wanted to chat with my girlfriend, my Whatsapp account was blocked permanently. Here is my blocked Whatsapp number:\n${tampilNomor} I beg you to restore it immediately, thank you.`
        };
        break;

      case "SPAM":
        result = {
          to: 'support@support.whatsapp.com',
          subject: 'tolong saya',
          body: `Hallo developer whatsapp saya vixzz salah satu pengguna whatsapp dari tahun 2023 dan saya saat ini ingin mengeluhkan atas pemblockiran akun whatsapp saya dengan alasan spam pada tanggal [ tanggal ke band ], ini sangat lah aneh karena saya sudah sering membaca layanan ketentuan aplikasi whatsapp dan sudah mematuhinya juga selama 2/3 tahun terakhir dan saya percaya ini adalah kesalahan sistem whatsapp yang salah mendeteksi kesalahan sehingga mungkin hanya chatan biasa pun bisa di anggap spam dan di blockir. Saya mohon untuk pihak whatsapp fix bug ini karena sangat meresahkan dan buka kan akun whatsapp saya [ ${tampilNomor} ] secepat mungkin karena saya ingin menghubungi keluarga saya yang kini sedang ada di luar kota dan saya menyayangi nya, terima kasih.`
        };
        break;

      case "PERMA HARD":
        result = {
          to: 'support@support.whatsapp.com',
          subject: `please unblock this WhatsApp account [ ${tampilNomor} ] its a system error`,
          body: `Hi developer, I'm contacting you via WhatsApp to request a review of my WhatsApp account, which has been blocked for no apparent reason. I've already requested a review through the WhatsApp application, but the block hasn't been lifted. I urgently need that WhatsApp account, as I've mentioned in the Gmail subject. Sorry for bothering you, but I need my WhatsApp account back now. Thank you.`
        };
        break;

      case "PERMASEMINGGU":
        result = {
          to: 'support@support.whatsapp.com',
          subject: 'help me plss',
          body: `Hi WhatsApp Developer, I'm vixzz. My WhatsApp account (+${tampilNomor}) was blocked without reason. I always follow WhatsApp's Terms of Service, use the official app, never spam, and behave respectfully. I believe this is a system error. Please review and restore my account. Thank you for your attention and help.`
        };
        break;

      case "opsi5":
        result = {
          to: 'support@support.whatsapp.com',
          subject: 'hi',
          body: `Hizmet şartlarınızı ihlal etmedim, hesabı açıklanamaz bir şekilde yasakladınız. Hesap etkinliklerimi inceledikten sonra, WhatsApp a erişebilmem için kısıtlamayı hızla kaldırırsınız. Çünkü hesabım yanlışlıkla yasaklandı 

Şartlarınızı veya politikanızı ihlal ettiğimi kabul ediyorum ve bunun için gerçekten üzgünüm lütfen bir şans verin ve yasağı hesabımdan kaldırın ${tampilNomor} isim Satya Budist gursarai

Görüşleriniz için teşekkürler
Hindistan lıyım, ülke kodum ${tampilNomor}
Yasal adım Satya Budist gursarai
Umarım bu SIM kartın yeni sahibi olduğum için WhatsApp hesap numaramdan kısıtlamalarınızı kaldırırsınız ${tampilNomor}

Ve o kaldırılmalıdır, aksi takdirde WhatsApp ın derecelendirmesini rahatsız etmeyeceksiniz Ki amaiyo chod hoga kardeş ke lado
`
        };
        break;

      default:
        // Default Template (Bahasa India / Formal)
        result = {
          to: 'support@support.whatsapp.com',
          subject: `My WhatsApp number was blocked ${tampilNomor}`,
          body: `प्रिय व्हाट्सएप सपोर्ट टीम,

मुझे आशा है कि यह संदेश आपको अच्छी तरह से मिल जाएगा ।  मैं अपने व्हाट्सएप अकाउंट पर प्रतिबंध की अपील करने के लिए लिख रहा हूं ।  मैं समझता हूं कि व्हाट्सएप की सेवा की शर्तों के उल्लंघन के कारण मेरे खाते पर प्रतिबंध लगा दिया गया था, और मैं किसी भी अनजाने कार्यों के लिए ईमानदारी से माफी मांगता हूं जिसके कारण यह हो सकता है । 

मैं व्हाट्सएप को एक आवश्यक संचार उपकरण और समुदाय के रूप में महत्व देता हूं, और मैं व्हाट्सएप की नीतियों और दिशानिर्देशों का पालन करने के लिए प्रतिबद्ध हूं ।  मैं कृपया अपने मामले की समीक्षा और अपने खाते पर प्रतिबंध हटाने का अनुरोध करता हूं ताकि मैं जिम्मेदारी से व्हाट्सएप का उपयोग करना जारी रख सकूं । 

कृपया नीचे कुछ जानकारी प्राप्त करें जो आपकी समीक्षा के लिए सहायक हो सकती हैं: - मेरा पंजीकृत फोन नंबर.`
        };
        break;
    }

    // Membuka Email
    const mailtoLink = `mailto:${result.to}?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(result.body)}`;
    
    // Efek visual loading sebentar
    const btn = document.querySelector('.modal-box .btn');
    if(btn) {
        btn.innerHTML = 'Membuka Email...';
        btn.disabled = true;
    }

    setTimeout(() => {
        window.location.href = mailtoLink;
        if(btn) {
             btn.innerHTML = 'KIRIM EMAIL';
             btn.disabled = false;
        }
    }, 500);
}

// Helper fetch wrapper
async function fetchAPI(url) {
    toolResult.style.display = 'block';
    toolResult.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    try {
        const req = await fetch(url);
        const res = await req.json();
        return res;
    } catch(e) {
        toolResult.innerHTML = 'Error: ' + e;
        return null;
    }
}

// 2. Downloader
async function execDownloader() {
    const url = document.getElementById('url').value;
    if(!url) return alert('Masukkan URL!');
    const res = await fetchAPI(`https://api.botcahx.eu.org/api/dowloader/allin?url=${encodeURIComponent(url)}&apikey=${API_BOTCAHX}`);
    if(res) toolResult.innerHTML = `<pre>${JSON.stringify(res.result || res, null, 2)}</pre>`;
}

// 3. NGL
async function execNGL() {
    const u = document.getElementById('nglUser').value;
    const m = document.getElementById('nglMsg').value;
    const c = document.getElementById('nglCount').value;
    if(!u || !m) return alert('Isi data NGL!');

    toolResult.style.display = 'block';
    let success = 0;
    
    for(let i=0; i<c; i++) {
        toolResult.innerHTML = `Mengirim ke-${i+1}... <i class="fas fa-paper-plane"></i>`;
        try {
            await fetch(`https://anabot.my.id/api/tools/ngl?username=${u}&message=${m}&apikey=${API_ANABOT}`);
            success++;
        } catch(e) {}
    }
    toolResult.innerHTML = `<span style="color:#0f0">Selesai!</span> ${success} Pesan terkirim.`;
}

// 4. Fake Chat
async function execFakeChat() {
    const t = document.getElementById('chatText').value;
    if(!t) return alert('Isi teks!');
    const res = await fetchAPI(`https://api.botcahx.eu.org/api/maker/iqc?text=${encodeURIComponent(t)}&apikey=${API_BOTCAHX}`);
    if(res && res.status) {
        toolResult.innerHTML = `<img src="${res.result}" style="width:100%; border-radius:10px; border:1px solid #333;"> <br> <a href="${res.result}" target="_blank" class="btn" style="margin-top:5px; font-size:0.8rem;">Download HD</a>`;
    } else {
        toolResult.innerHTML = 'Gagal membuat gambar.';
    }
}

// 5. Remove BG
async function execRemBg() {
    const u = document.getElementById('bgUrl').value;
    if(!u) return alert('Isi URL gambar!');
    const res = await fetchAPI(`https://anabot.my.id/api/ai/removebg?imageUrl=${encodeURIComponent(u)}&apikey=${API_ANABOT}`);
    if(res && res.url) {
        // Handle beda format response API
        const imgUrl = res.url.result || res.url;
        toolResult.innerHTML = `<img src="${imgUrl}" style="width:100%; border-radius:10px;">`;
    } else {
        toolResult.innerHTML = JSON.stringify(res, null, 2);
    }
}

// 6. Logo
async function execLogo() {
    const p = document.getElementById('logoPrompt').value;
    if(!p) return alert('Isi prompt!');
    const res = await fetchAPI(`https://anabot.my.id/api/ai/createLogo?prompt=${encodeURIComponent(p)}&apikey=${API_ANABOT}`);
    if(res && res.result) {
         toolResult.innerHTML = `<img src="${res.result}" style="width:100%; border-radius:10px;">`;
    } else {
         toolResult.innerHTML = `<pre>${JSON.stringify(res, null, 2)}</pre>`;
    }
}

// 7. Bypass
async function execBypass() {
    const u = document.getElementById('cfUrl').value;
    const k = document.getElementById('cfKey').value;
    if(!u || !k) return alert('Isi URL & SiteKey!');
    const res = await fetchAPI(`https://anabot.my.id/api/tools/bypass?url=${u}&siteKey=${k}&type=turnstile-min&apikey=${API_ANABOT}`);
    if(res) toolResult.innerHTML = `<pre>${JSON.stringify(res, null, 2)}</pre>`;
}