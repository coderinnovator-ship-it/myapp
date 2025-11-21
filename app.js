// app.js — Advanced Zetra ID (client-only, file-based identity)
// Generates ECDSA key pair, creates ZET ID from public key hash,
// stores profile in localStorage, allows export/import of .zetra file.

(async function(){
  // DOM elements
  const createBtn = document.getElementById('createBtn');
  const recoverBtn = document.getElementById('recoverBtn');
  const cardWrap  = document.getElementById('cardWrap');
  const zetraIdEl = document.getElementById('zetraId');
  const avatarEl  = document.getElementById('avatar');
  const createdAt = document.getElementById('createdAt');
  const copyBtn   = document.getElementById('copyBtn');
  const exportBtn = document.getElementById('exportBtn');
  const resetBtn  = document.getElementById('resetBtn');
  const noticeEl  = document.getElementById('notice');

  const STORAGE_KEY = 'zetra_profile_v2';

  // Helpers
  function showNotice(txt){
    if(!noticeEl) return;
    noticeEl.textContent = txt;
    setTimeout(()=> {
      noticeEl.textContent = 'No account required. Your identity stays on your device unless you choose to share it.';
    }, 5000);
  }

  function bufToHex(buffer){
    const bytes = new Uint8Array(buffer);
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
    return hex;
  }

  async function sha256Hex(text){
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return bufToHex(hash);
  }

  function formatZetFromHex(hex){
    // produce something like ZET-XXXX-XXXX-XXX using hex string
    // take first 11*? chars -> we'll pick 11 chars (alnum) from hex and split
    const a = hex.slice(0,4).toUpperCase();
    const b = hex.slice(4,8).toUpperCase();
    const c = hex.slice(8,11).toUpperCase();
    return `ZET-${a}-${b}-${c}`;
  }

  async function generateKeyPairAndProfile(){
    // generate ECDSA P-256 keypair (suitable and supported)
    const kp = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign","verify"]
    );

    // export keys as JWK
    const pubJwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
    const privJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);

    // create stable id: hash of public JWK JSON
    const pubJson = JSON.stringify(pubJwk);
    const hex = await sha256Hex(pubJson);
    const zetId = formatZetFromHex(hex);

    const profile = {
      id: zetId,
      createdAt: Date.now(),
      publicKeyJwk: pubJwk,
      privateKeyJwk: privJwk,
      meta: { alg: 'ECDSA-P256', version: 2 }
    };

    saveProfile(profile);
    return profile;
  }

  function saveProfile(profile){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }catch(e){
      console.error('save error', e);
      showNotice('Unable to save locally.');
    }
  }

  function loadProfile(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){
      console.error('load error', e);
      return null;
    }
  }

  function clearProfile(){
    localStorage.removeItem(STORAGE_KEY);
  }

  function renderProfile(profile){
    if(!profile){
      cardWrap.style.display = 'none';
      return;
    }
    zetraIdEl.textContent = profile.id || '—';
    avatarEl.textContent = (profile.id && profile.id[4]) ? profile.id[4] : 'Z';
    createdAt.textContent = 'Created: ' + new Date(profile.createdAt).toLocaleString();
    cardWrap.style.display = 'block';
  }

  // Export profile to .zetra.json file (this includes private key — user must keep it safe)
  function exportProfileToFile(profile){
    if(!profile) { showNotice('No profile to export.'); return; }
    const data = {
      zetra_profile: {
        id: profile.id,
        createdAt: profile.createdAt,
        publicKeyJwk: profile.publicKeyJwk,
        privateKeyJwk: profile.privateKeyJwk,
        meta: profile.meta
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.id || 'zetra'}.zetra.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotice('Profile exported — save the file somewhere safe.');
  }

  // Recover by reading a file input (we will open a file picker)
  function openFilePickerAndRecover(){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.zetra.json,application/json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if(!file) return;
      try{
        const text = await file.text();
        const obj = JSON.parse(text);
        // support wrapped format
        const profile = obj.zetra_profile ? obj.zetra_profile : obj;
        if(!profile || !profile.id){
          showNotice('Invalid file format.');
          return;
        }
        // small validation
        if(!profile.publicKeyJwk || !profile.privateKeyJwk){
          showNotice('Profile missing keys.');
          return;
        }
        saveProfile(profile);
        renderProfile(profile);
        showNotice('Profile recovered from file.');
      }catch(err){
        console.error(err);
        showNotice('Failed to read file.');
      }
    };
    input.click();
  }

  // copy ID to clipboard
  async function copyId(){
    const profile = loadProfile();
    if(!profile || !profile.id){ showNotice('No Zetra ID to copy.'); return; }
    try{
      await navigator.clipboard.writeText(profile.id);
      showNotice('Zetra ID copied to clipboard.');
    }catch(e){
      console.error(e);
      showNotice('Copy failed — try manual selection.');
    }
  }

  // reset profile
  function resetProfile(){
    if(!confirm('Reset and delete saved Zetra profile from this device?')) return;
    clearProfile();
    renderProfile(null);
    showNotice('Profile removed from this device.');
  }

  // wire UI
  createBtn.addEventListener('click', async () => {
    try{
      showNotice('Generating secure identity — this happens in your browser.');
      // small delay for UX
      setTimeout(async () => {
        const prof = await generateKeyPairAndProfile();
        renderProfile(prof);
        showNotice('Identity created. Export backup to keep it safe.');
      }, 250);
    }catch(e){
      console.error(e);
      showNotice('Failed to create identity.');
    }
  });

  recoverBtn.addEventListener('click', () => {
    openFilePickerAndRecover();
  });

  copyBtn.addEventListener('click', async () => {
    await copyId();
  });

  exportBtn.addEventListener('click', () => {
    const prof = loadProfile();
    if(!prof){ showNotice('No profile to export.'); return; }
    exportProfileToFile(prof);
  });

  resetBtn.addEventListener('click', () => {
    resetProfile();
  });

  // initial render
  const existing = loadProfile();
  if(existing) renderProfile(existing);
})();
