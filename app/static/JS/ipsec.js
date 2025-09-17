// Enable Functions
function disable(identifier) {
    console.log(identifier)
    const input = document.getElementById(identifier);
    input.disabled = !input.disabled;
    if (!input.disabled) {
        input.focus();
    }
}

// Copy Clipboard
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.value;

    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            const button = event.target.closest('.copy-button');
            const originalTitle = button.title;
            button.title = 'Copiado!';
            button.style.background = '#48bb78';

            setTimeout(() => {
                button.title = originalTitle;
                button.style.background = '';
            }, 2000);
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            element.select();
            document.execCommand('copy');
        });
    }
}

// Generate PSK functionality
document.querySelector('.generate-copy-button').addEventListener('click', function () {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let psk = '';
    for (let i = 0; i < 56; i++) {
        psk += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    document.getElementById('psk').value = psk;

    navigator.clipboard.writeText(psk).then(() => {
        this.innerHTML = 'Copiado!';
        this.style.background = '#48bb78';

        setTimeout(() => {
            this.innerHTML = 'Gerar & Copiar';
            this.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar PSK:', err);
    });
});

// Auto-generate client identifier based on client name
document.getElementById('client-name').addEventListener('input', function () {
    const clientIdentifier = document.getElementById('client-identifier');

    // Só gera automaticamente se o campo estiver desabilitado
    if (clientIdentifier.disabled) {
        clientIdentifier.value = this.value
            .toLowerCase()
            .replace(/\s+/g, '_') + '@ipsec.com';
    }
});

// NAT Button
document.querySelectorAll('.nat-button').forEach(button => {
    button.addEventListener('click', function () {
        document.querySelectorAll('.nat-button').forEach(btn => {
            btn.classList.remove('active');
        });

        this.classList.add('active');

        const natType = this.getAttribute('data-nat');

        const valueLocalIdentifier = document.getElementById("local-subnet");
        if (natType === 'binat') {
            valueLocalIdentifier.value = valueLocalIdentifier.dataset.default;
            valueLocalIdentifier.disabled = true;
        } else if (natType === 'no-nat') {
            valueLocalIdentifier.value = "";
            valueLocalIdentifier.disabled = false;
        }
    });
});

// Function to detect language and get localized texts
function getLanguageTexts() {
    const lang = navigator.language.toLowerCase();
    const isPtBr = lang.startsWith('pt');

    return {
        validationError: isPtBr ? 'Erro na Validação' : 'Validation Error',
        success: isPtBr ? 'Sucesso!' : 'Success!',
        successMessage: isPtBr ? 'Configuração criada com sucesso!' : 'Configuration created successfully!',
        processing: isPtBr ? 'Processando...' : 'Processing...',
        serverError: isPtBr ? 'Erro do Servidor' : 'Server Error',
        networkError: isPtBr ? 'Erro de Conexão' : 'Network Error',
        networkErrorMessage: isPtBr ? 'Não foi possível conectar ao servidor. Verifique sua conexão.' : 'Could not connect to server. Check your connection.'
    };
}

// Function to show custom alert
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

// Add CSS for animations
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

// Function to show loading state
function setLoadingState(isLoading) {
    const submitButton = document.querySelector('.submit-button');
    if (isLoading) {
        submitButton.classList.add('loading');
        submitButton.disabled = true;
    } else {
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
    }
}

// Main function to send data
async function send() {
    event.preventDefault();

    const texts = getLanguageTexts();

    // Show loading state
    setLoadingState(true);

    try {
        // Capture field values
        const formData = {
            client_name: document.getElementById('client-name').value.trim(),
            local_subnet: document.getElementById('local-subnet').value.trim(),
            remote_subnet: document.getElementById('remote-subnet').value.trim(),
            keep_alive_ip: document.getElementById('keep-alive').value.trim(),
            local_identifier: document.getElementById('local-identifier').value.trim(),
            client_identifier: document.getElementById('client-identifier').value.trim(),
            psk: document.getElementById('psk').value.trim(),
            tunnel_uuid: document.getElementById('tunnel-select').value,
            nat_type: document.querySelector('.nat-button.active').getAttribute('data-nat')
        };

        console.log('Enviando dados para validação:', formData);

        // Send data to backend for validation and processing
        const response = await fetch('/api/ipsec/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showAlert(texts.success, result.message, 'success');
            console.log('Configuração criada:', result);

        } else {
            // Validation or server errors
            let errorMessage = result.message;

            if (result.errors && Array.isArray(result.errors)) {
                errorMessage = result.errors.map(error => `• ${error}`).join('<br>');
            }

            showAlert(texts.validationError, errorMessage, 'error');
        }

    } catch (error) {
        console.error('Erro na requisição:', error);

        // Network or other errors
        showAlert(
            texts.networkError,
            texts.networkErrorMessage,
            'error'
        );
    } finally {
        // Remove loading state
        setLoadingState(false);
    }
}