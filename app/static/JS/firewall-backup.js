(() => {
  const container = document.querySelector('.container');
  const list = document.getElementById('client-list');
  const addBtn = document.getElementById('add-client');
  const modal = document.getElementById('add-modal');
  const form = document.getElementById('add-client-form');

  // Common fields
  const nameInput = document.getElementById('client-name');
  const hostInput = document.getElementById('fw-host');
  const portInput = document.getElementById('fw-port');

  // Platform controls
  const platformSeg = document.getElementById('platform-segment');
  const platformSections = document.querySelectorAll('.platform-section');

  // OPNsense auth
  const apiKeyInput = document.getElementById('api-key');
  const apiSecretInput = document.getElementById('api-secret');
  const tlsCertInput = document.getElementById('tls-cert'); // <input type="file">

  // pfSense auth
  const userInput = document.getElementById('fw-user');
  const passInput = document.getElementById('fw-pass');

  // Recurrence controls
  const recSeg = document.getElementById('recurrence-segment');
  const weeklyBox = document.getElementById('recurrence-weekly');
  const chipsWrap = document.getElementById('weekday-chips');
  const timeInput = document.getElementById('schedule-time');

  // ===== helpers =====
  const getActivePlatform = () =>
    platformSeg.querySelector('.platform-option.is-active')?.dataset.platform || 'opnsense';

  const showPlatformSection = (platform) => {
    platformSections.forEach(sec => { sec.hidden = sec.dataset.for !== platform; });
  };

  const focusFirstField = () => requestAnimationFrame(() => nameInput?.focus());

  // ===== modal open/close =====
  const openModal = () => {
    document.body.classList.add('modal-open');
    modal.classList.add('is-open');
    focusFirstField();
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    const onDone = (e) => {
      if (e.target !== modal) return;
      modal.removeEventListener('transitionend', onDone);
      document.body.classList.remove('modal-open');
    };
    modal.addEventListener('transitionend', onDone);
  };

  addBtn?.addEventListener('click', openModal);
  modal?.addEventListener('click', (e) => {
    if (e.target.id === 'add-modal' || e.target.matches('[data-close]')) closeModal();
  });

  // ===== platform segmented control =====
  platformSeg?.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.platform-option');
    if (!btn) return;
    platformSeg.querySelectorAll('.platform-option').forEach(b => {
      b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('is-active'); btn.setAttribute('aria-selected', 'true');
    showPlatformSection(btn.dataset.platform);
    focusFirstField();
  });

  // Default section on load
  showPlatformSection(getActivePlatform());

  // ===== recurrence segmented control =====
  recSeg?.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.recurrence-option');
    if (!btn) return;
    recSeg.querySelectorAll('.recurrence-option').forEach(b => {
      b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('is-active'); btn.setAttribute('aria-selected', 'true');
    const mode = btn.dataset.recurrence; // "daily" | "weekly"
    weeklyBox.hidden = mode !== 'weekly';
  });

  chipsWrap?.addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip');
    if (!chip) return;
    chip.classList.toggle('is-selected');
  });

  // ===== show/hide secrets (visual only) =====
  document.getElementById('toggle-pass')?.addEventListener('click', () => {
    const icon = document.querySelector('#toggle-pass .material-symbols-outlined');
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
    if (icon) icon.textContent = passInput.type === 'password' ? 'visibility' : 'visibility_off';
  });

  document.getElementById('toggle-secret')?.addEventListener('click', () => {
    const icon = document.querySelector('#toggle-secret .material-symbols-outlined');
    apiSecretInput.type = apiSecretInput.type === 'password' ? 'text' : 'password';
    if (icon) icon.textContent = apiSecretInput.type === 'password' ? 'visibility' : 'visibility_off';
  });

  // ===== submit: just log everything =====
  form?.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    // read active platform
    const platform = document
      .querySelector('#platform-segment .platform-option.is-active')
      ?.dataset.platform || 'opnsense';

    // common fields
    const payload = {
      platform,
      name: document.getElementById('client-name')?.value?.trim() || '',
      host: document.getElementById('fw-host')?.value?.trim() || '',
      port: Number(document.getElementById('fw-port')?.value || 0),
    };

    // auth per platform
    if (platform === 'pfsense') {
      payload.username = document.getElementById('fw-user')?.value?.trim() || '';
      payload.password = document.getElementById('fw-pass')?.value || '';
    } else {
      payload.api_key = document.getElementById('api-key')?.value?.trim() || '';
      payload.api_secret = document.getElementById('api-secret')?.value || '';
    }

    // schedule block
    const recBtn = document.querySelector('#recurrence-segment .recurrence-option.is-active');
    const mode = recBtn?.dataset.recurrence || 'daily';
    const time = document.getElementById('schedule-time')?.value || '02:00';
    const schedule = { type: mode, time };
    if (mode === 'weekly') {
      schedule.days = [...document.querySelectorAll('.weekday-chips .chip.is-selected')]
        .map(c => c.dataset.day); // e.g. ["mon","wed","fri"]
    }

    // build FormData (always use multipart; attach PEM for OPNsense)
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => fd.append(k, v));
    fd.append('schedule', JSON.stringify(schedule));

    // attach CA file only for OPNsense
    if (platform === 'opnsense') {
      const caFile = document.getElementById('tls-cert')?.files?.[0] || null;
      if (caFile) fd.append('tls_cert', caFile);
    }

    try {
      // IMPORTANT: do NOT set Content-Type — the browser sets multipart boundary
      const r = await fetch('/api/backup/create', { method: 'POST', body: fd });
      const data = await r.json();

      const ok = (data && (data.ok ?? data.success)) === true;
      if (!r.ok || !ok) {
        throw new Error(data?.error || data?.message || 'Save failed');
      }

      // optionally append to list (keeps your current UX)
      if (data.client?.id && data.client?.name) {
        const list = document.getElementById('client-list');
        const item = document.createElement('div');
        item.className = 'client-item';
        item.dataset.id = data.client.id;
        item.innerHTML = `
        <div class="item-row">
          <div class="item-display" title="${data.client.name}">${data.client.name}</div>
          <button type="button" class="square-button" title="Edit client" data-action="edit">
            <span class="material-symbols-outlined">edit</span>
          </button>
        </div>`;
        document.querySelector('.empty-card')?.remove();
        document.querySelector('.container')?.classList.remove('is-empty');
        list?.appendChild(item);
      }

      // close modal after success
      document.getElementById('add-modal')?.classList.remove('is-open');

      // simple toast/message (reuse your form-msg if you like)
      console.log('Saved successfully:', data);

    } catch (err) {
      console.error('API error:', err);
      // if you still have #form-msg in the DOM, you can show it:
      const formMsg = document.getElementById('form-msg');
      if (formMsg) {
        formMsg.textContent = err.message || 'Unexpected error.';
        formMsg.className = 'form-msg error';
        formMsg.hidden = false;
      }
    }
  });

  // ===== optional: go to edit page on list click (still works, no changes) =====
  list?.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.square-button[data-action="edit"]');
    if (!btn) return;
    const id = btn.closest('.client-item')?.dataset?.id;
    if (id) window.location.href = `/firewall-backup/${encodeURIComponent(id)}/edit`;
  })

})();
