// ZETRA — client identity (file-based .zetra backup)
// advanced but still client-only. Generates ECDSA keys, creates ZET ID,
// stores profile in localStorage, supports export/import, copy, reset and UI flows.

(function(){
  // elements
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
  const continueBtn = document.getElementById('continueBtn');
  const cancelSetup = document.getElementById('cancelSetup');
  const displayNameInput = document.getElementById('displayName');
  const fileInput  = document.getElementById('fileInput');

  const STORAGE_KEY = 'zetra_profile_v_final';

  // small helpers
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
    return `ZETRA-UID-${a}${b}-${c}-CORE`;
  }

  async function generateKeyPair(){
    // ECDSA P-256
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
    }catch(e){ return null; }
  }

  function clearProfile(){
    localStorage.removeItem(STORAGE_KEY);
  }

  function renderProfile(profile){
    if(!profile){
      cardWrap.classList.add('hidden');
      return;
    }
    avatarEl.textContent = (profile.displayName && profile.displayName[0]) ? profile.displayName[0].toUpperCase() : 'Z';
    zetraIdEl.textContent = profile.id || '—';
    createdAtEl.textContent = 'Created: ' + new Date(profile.createdAt).toLocaleString();
    cardWrap.classList.remove('hidden');
  }

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

  async function copyId(){
    const p = loadProfile();
    if(!p || !p.id){ showNotice('No ID to copy.'); return; }
    try{
      await navigator.clipboard.writeText(p.id);
      showNotice('ID copied to clipboard.');
    }catch(e){ showNotice('Copy failed.'); }
  }

  function resetAll(){
    if(!confirm('Reset and delete your Zetra profile from this device?')) return;
    clearProfile();
    renderProfile(null);
    showNotice('Profile removed.');
  }

  // create flow using the modal
  function openSetup(){
    setupModal.classList.remove('hidden');
  }
  function closeSetup(){
    setupModal.classList.add('hidden');
    // clear inputs
    const inputs = setupModal.querySelectorAll('input[type="text"]');
    inputs.forEach(i => i.value = '');
  }

  async function createProfile(displayName, color){
    showNotice('Generating secure identity locally...');
    try{
      const keys = await generateKeyPair();
      const hex = await sha256Of(keys.publicJwk);
      const id = formatZET(hex);
      const profile = {
        id,
        displayName: displayName || '',
        color: color || '#0ea5ff',
        createdAt: Date.now(),
        publicKeyJwk: keys.publicJwk,
        privateKeyJwk: keys.privateJwk,
        meta: { alg:'ECDSA-P256', version: 1 }
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

  // wire UI events
  createBtn.addEventListener('click', () => openSetup());
  cancelSetup.addEventListener('click', () => closeSetup());
  continueBtn.addEventListener('click', () => {
    const name = (document.getElementById('displayName')||{value:''}).value.trim();
    const color = (() => {
      const r = document.querySelector('.color-option input:checked');
      return r ? r.value : '#0ea5ff';
    })();
    if(!name){ alert('Please enter a display name.'); return; }
    createProfile(name, color);
  });

  recoverBtn.addEventListener('click', () => openRecoverPicker());
  copyBtn.addEventListener('click', () => copyId());
  exportBtn.addEventListener('click', () => {
    const p = loadProfile();
    exportProfile(p);
  });
  resetBtn.addEventListener('click', () => resetAll());

  // init render
  const existing = loadProfile();
  if(existing) renderProfile(existing);

  // close on ESC
  window.addEventListener('keydown', e => { if(e.key === 'Escape') closeSetup(); });
})();
