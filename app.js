// ZETRA — advanced client identity (file-based .zetra backup)
// Works fully offline. Generates ECDSA keypair, creates ZET ID from public key,
// stores profile in localStorage, supports export/import and UI flows (setup modal).

(function(){
  // UI elements
  const createBtn = document.getElementById('createBtn');
  const recoverBtn = document.getElementById('recoverBtn');
  const cardWrap   = document.getElementById('cardWrap');
  const avatarEl   = document.getElementById('avatar');
  const zetraIdEl  = document.getElementById('zetraId');
  const createdAtEl= document.getElementById('createdAt');
  const copyBtn    = document.getElementById('copyBtn');
  const exportBtn  = document.getElementById('exportBtn');
  const resetBtn   = document.getElementById('resetBtn');
  const noticeEl   = document.getElementById('notice');

  const setupModal = document.getElementById('setupModal');
  const setupForm  = document.getElementById('setupForm');
  const cancelSetup = document.getElementById('cancelSetup');
  const fileInput  = document.getElementById('fileInput');

  const STORAGE_KEY = 'zetra_profile_v3';

  // helpers
  function showNotice(txt, t=4000){
    if(!noticeEl) return;
    noticeEl.textContent = txt;
    if(t>0) setTimeout(()=> noticeEl.textContent = 'No account required. Your identity stays on your device unless you choose to share it.', t);
  }

  function bufToHex(buffer){
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function sha256Of(obj){
    const s = typeof obj === 'string' ? obj : JSON.stringify(obj);
    const enc = new TextEncoder();
    const data = enc.encode(s);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return bufToHex(hash);
  }

  function formatZET(hex){
    const a = hex.slice(0,4).toUpperCase();
    const b = hex.slice(4,8).toUpperCase();
    const c = hex.slice(8,11).toUpperCase();
    return `ZET-${a}-${b}-${c}`;
  }

  async function generateKeyPair(){
    // ECDSA P-256 (widely supported)
    const kp = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign","verify"]
    );
    const pub = await crypto.subtle.exportKey('jwk', kp.publicKey);
    const priv = await crypto.subtle.exportKey('jwk', kp.privateKey);
    return { publicJwk: pub, privateJwk: priv };
  }

  function saveProfile(profile){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }catch(e){
      console.error('save error', e);
      showNotice('Unable to save profile locally.');
    }
  }

  function loadProfile(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){
      return null;
    }
  }

  function clearProfile(){
    localStorage.removeItem(STORAGE_KEY);
  }

  function renderProfile(profile){
    if(!profile){
      cardWrap.classList.add('hidden');
      return;
    }
    zetraIdEl.textContent = profile.id || '—';
    avatarEl.textContent = (profile.displayName && profile.displayName[0]) ? profile.displayName[0].toUpperCase() : (profile.id && profile.id[4]) ? profile.id[4] : 'Z';
    createdAtEl.textContent = 'Created: ' + new Date(profile.createdAt).toLocaleString();
    cardWrap.classList.remove('hidden');
  }

  // Export profile to file
  function exportProfile(profile){
    if(!profile){ showNotice('No profile to export.'); return; }
    const payload = { zetra_profile: profile };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.id || 'zetra'}.zetra.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotice('Exported profile — keep file safe.');
  }

  // Recover from file input
  function openRecoverPicker(){
    fileInput.value = '';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if(!file) return;
      try{
        const text = await file.text();
        const obj = JSON.parse(text);
        const profile = obj.zetra_profile ? obj.zetra_profile : obj;
        if(!profile || !profile.id || !profile.publicKeyJwk || !profile.privateKeyJwk){
          showNotice('Invalid profile file.');
          return;
        }
        saveProfile(profile);
        renderProfile(profile);
        showNotice('Profile restored from file.');
      }catch(err){
        console.error(err);
        showNotice('Failed to read file.');
      }
    };
    fileInput.click();
  }

  // COPY ID
  async function copyId(){
    const p = loadProfile();
    if(!p || !p.id){ showNotice('No ID to copy.'); return; }
    try{
      await navigator.clipboard.writeText(p.id);
      showNotice('ID copied to clipboard.');
    }catch(e){
      showNotice('Copy failed.');
    }
  }

  // RESET
  function resetAll(){
    if(!confirm('Reset and delete your Zetra profile from this device?')) return;
    clearProfile();
    renderProfile(null);
    showNotice('Profile removed.');
  }

  // UI: show setup modal
  function showSetup(){ setupModal.classList.remove('hidden'); }
  function closeSetup(){ setupModal.classList.add('hidden'); }

  // core: create profile flow (uses setup inputs)
  async function createProfileFromForm(displayName, color){
    showNotice('Generating secure identity locally...');
    try{
      // generate keypair and profile
      const keys = await generateKeyPair();
      // compute id from public key JSON hash
      const hex = await sha256Of(keys.publicJwk);
      const id = formatZET(hex);
      const profile = {
        id,
        displayName: displayName || '',
        color: color || '#0ea5ff',
        createdAt: Date.now(),
        publicKeyJwk: keys.publicJwk,
        privateKeyJwk: keys.privateJwk,
        meta: { alg:'ECDSA-P256', version: 3 }
      };
      saveProfile(profile);
      renderProfile(profile);
      showNotice('Identity created. Export your profile to backup.');
      closeSetup();
    }catch(err){
      console.error(err);
      showNotice('Failed to generate identity.');
    }
  }

  // wire events
  createBtn.addEventListener('click', () => showSetup());
  cancelSetup.addEventListener('click', () => closeSetup());
  setupForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = document.getElementById('displayName').value.trim();
    const color = setupForm.elements['color'].value;
    if(!name) { alert('Please enter a display name.'); return; }
    createProfileFromForm(name, color);
  });

  recoverBtn.addEventListener('click', () => {
    openRecoverPicker();
  });

  copyBtn.addEventListener('click', () => copyId());
  exportBtn.addEventListener('click', () => {
    const p = loadProfile();
    exportProfile(p);
  });

  resetBtn.addEventListener('click', () => resetAll());

  // initial render
  const existing = loadProfile();
  if(existing) renderProfile(existing);

  // small polish: close modal on ESC
  window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') closeSetup();
  });
})();
