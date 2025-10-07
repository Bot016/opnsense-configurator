(() => {
  // DOM Elements
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
  const tlsCertInput = document.getElementById('tls-cert');

  // pfSense auth
  const userInput = document.getElementById('fw-user');
  const passInput = document.getElementById('fw-pass');

  // Recurrence controls
  const recSeg = document.getElementById('recurrence-segment');
  const weeklyBox = document.getElementById('recurrence-weekly');
  const chipsWrap = document.getElementById('weekday-chips');
  const timeInput = document.getElementById('schedule-time');

  // ===== Language Detection and Texts =====
  function getLanguageTexts() {
    const lang = navigator.language.toLowerCase();
    const isPtBr = lang.startsWith('pt');

    return {
      validationError: isPtBr ? 'Erro na Validação' : 'Validation Error',
      success: isPtBr ? 'Sucesso!' : 'Success!',
      successMessage: isPtBr ? 'Cliente de backup criado com sucesso!' : 'Backup client created successfully!',
      processing: isPtBr ? 'Processando...' : 'Processing...',
      serverError: isPtBr ? 'Erro do Servidor' : 'Server Error',
      networkError: isPtBr ? 'Erro de Conexão' : 'Network Error',
      networkErrorMessage: isPtBr ? 'Não foi possível conectar ao servidor. Verifique sua conexão.' : 'Could not connect to server. Check your connection.'
    };
  }

  // ===== Custom Alert System =====
  function showAlert(title, message, type = 'error') {
    // Remove existing alert if any
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    const alertHTML = `
      <div class="custom-alert ${type}" style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? 'linear-gradient(135deg, #ff6b6b, #ee5a5a)' : 'linear-gradient(135deg, #51cf66, #40c057)'};
        color: white;
        padding: 20px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        z-index: 1000;
        max-width: 400px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
        animation: slideInRight 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="material-symbols-outlined" style="font-size: 24px;">
            ${type === 'error' ? 'error' : 'check_circle'}
          </span>
          <div>
            <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${title}</h4>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">${message}</p>
          </div>
        </div>
        <button onclick="this.parentElement.remove()" style="
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertHTML);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      const alert = document.querySelector('.custom-alert');
      if (alert) {
        alert.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => alert.remove(), 300);
      }
    }, 5000);
  }

  // ===== CSS Animations =====
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .submit-button.loading {
      position: relative;
      color: transparent;
      pointer-events: none;
    }
    
    .submit-button.loading::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid transparent;
      border-top: 2px solid #ffffff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // ===== Loading State Management =====
  function setLoadingState(isLoading) {
    const submitButton = form?.querySelector('button[type="submit"]') || 
                        form?.querySelector('.submit-button');
    
    if (submitButton) {
      if (isLoading) {
        submitButton.classList.add('loading');
        submitButton.disabled = true;
      } else {
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
      }
    }
  }

  // ===== Helper Functions =====
  const getActivePlatform = () =>
    platformSeg?.querySelector('.platform-option.is-active')?.dataset.platform || 'opnsense';

  const showPlatformSection = (platform) => {
    platformSections.forEach(sec => { 
      sec.hidden = sec.dataset.for !== platform; 
    });
  };

  const focusFirstField = () => requestAnimationFrame(() => nameInput?.focus());

  // ===== Modal Management =====
  const openModal = () => {
    document.body.classList.add('modal-open');
    modal?.classList.add('is-open');
    focusFirstField();
  };

  const closeModal = () => {
    modal?.classList.remove('is-open');
    const onDone = (e) => {
      if (e.target !== modal) return;
      modal.removeEventListener('transitionend', onDone);
      document.body.classList.remove('modal-open');
    };
    modal?.addEventListener('transitionend', onDone);
  };

  // ===== Event Listeners Setup =====
  
  // Modal controls
  addBtn?.addEventListener('click', openModal);
  modal?.addEventListener('click', (e) => {
    if (e.target.id === 'add-modal' || e.target.matches('[data-close]')) {
      closeModal();
    }
  });

  // Platform segmented control
  platformSeg?.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.platform-option');
    if (!btn) return;
    
    platformSeg.querySelectorAll('.platform-option').forEach(b => {
      b.classList.remove('is-active'); 
      b.setAttribute('aria-selected', 'false');
    });
    
    btn.classList.add('is-active'); 
    btn.setAttribute('aria-selected', 'true');
    showPlatformSection(btn.dataset.platform);
    focusFirstField();
  });

  // Recurrence segmented control
  recSeg?.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.recurrence-option');
    if (!btn) return;
    
    recSeg.querySelectorAll('.recurrence-option').forEach(b => {
      b.classList.remove('is-active'); 
      b.setAttribute('aria-selected', 'false');
    });
    
    btn.classList.add('is-active'); 
    btn.setAttribute('aria-selected', 'true');
    
    const mode = btn.dataset.recurrence;
    if (weeklyBox) {
      weeklyBox.hidden = mode !== 'weekly';
    }
  });

  // Weekday chips
  chipsWrap?.addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip');
    if (!chip) return;
    chip.classList.toggle('is-selected');
  });

  // Password visibility toggles
  document.getElementById('toggle-pass')?.addEventListener('click', () => {
    const icon = document.querySelector('#toggle-pass .material-symbols-outlined');
    if (passInput) {
      passInput.type = passInput.type === 'password' ? 'text' : 'password';
      if (icon) {
        icon.textContent = passInput.type === 'password' ? 'visibility' : 'visibility_off';
      }
    }
  });

  document.getElementById('toggle-secret')?.addEventListener('click', () => {
    const icon = document.querySelector('#toggle-secret .material-symbols-outlined');
    if (apiSecretInput) {
      apiSecretInput.type = apiSecretInput.type === 'password' ? 'text' : 'password';
      if (icon) {
        icon.textContent = apiSecretInput.type === 'password' ? 'visibility' : 'visibility_off';
      }
    }
  });

  // Initialize default sections
  showPlatformSection(getActivePlatform());

  // ===== Form Submission =====
  form?.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const texts = getLanguageTexts();
    setLoadingState(true);

    try {
      // Capture form data
      const platform = getActivePlatform();
      
      const formData = {
        platform,
        name: nameInput?.value?.trim() || '',
        host: hostInput?.value?.trim() || '',
        port: Number(portInput?.value || 0),
      };

      // Platform-specific authentication
      if (platform === 'pfsense') {
        formData.username = userInput?.value?.trim() || '';
        formData.password = passInput?.value || '';
      } else {
        formData.api_key = apiKeyInput?.value?.trim() || '';
        formData.api_secret = apiSecretInput?.value || '';
      }

      // Schedule configuration
      const recBtn = recSeg?.querySelector('.recurrence-option.is-active');
      const mode = recBtn?.dataset.recurrence || 'daily';
      const time = timeInput?.value || '02:00';
      
      const schedule = { type: mode, time };
      if (mode === 'weekly') {
        schedule.days = [...document.querySelectorAll('.weekday-chips .chip.is-selected')]
          .map(c => c.dataset.day);
      }

      console.log('Enviando dados para validação:', { ...formData, schedule });

      // Prepare FormData for multipart submission
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      fd.append('schedule', JSON.stringify(schedule));

      // Attach TLS certificate for OPNsense
      if (platform === 'opnsense' && tlsCertInput?.files?.[0]) {
        fd.append('tls_cert', tlsCertInput.files[0]);
      }

      // Submit to API
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: fd
      });

      const result = await response.json();

      if (response.ok && (result.success || result.ok)) {
        showAlert(texts.success, result.message || texts.successMessage, 'success');
        
        // Update UI with new client
        if (result.client?.id && result.client?.name) {
          updateClientList(result.client);
        }

        // Close modal and reset form
        closeModal();
        form.reset();

      } else {
        // Handle validation or server errors
        let errorMessage = result.message || result.error || 'Erro desconhecido';

        if (result.errors && Array.isArray(result.errors)) {
          errorMessage = result.errors.map(error => `• ${error}`).join('<br>');
        }

        showAlert(texts.validationError, errorMessage, 'error');
      }

    } catch (error) {
      console.error('Erro na requisição:', error);
      showAlert(
        texts.networkError,
        texts.networkErrorMessage,
        'error'
      );
    } finally {
      setLoadingState(false);
    }
  });

  // ===== Update Client List =====
  function updateClientList(client) {
    if (!list) return;

    const item = document.createElement('div');
    item.className = 'client-item';
    item.dataset.id = client.id;
    item.innerHTML = `
      <div class="item-row">
        <div class="item-display" title="${client.name}">${client.name}</div>
        <button type="button" class="square-button" title="Edit client" data-action="edit">
          <span class="material-symbols-outlined">edit</span>
        </button>
      </div>
    `;

    // Remove empty state
    document.querySelector('.empty-card')?.remove();
    container?.classList.remove('is-empty');
    list.appendChild(item);
  }

  // ===== Edit Navigation =====
  list?.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.square-button[data-action="edit"]');
    if (!btn) return;
    
    const id = btn.closest('.client-item')?.dataset?.id;
    if (id) {
      window.location.href = `/firewall-backup/${encodeURIComponent(id)}/edit`;
    }
  });

})();