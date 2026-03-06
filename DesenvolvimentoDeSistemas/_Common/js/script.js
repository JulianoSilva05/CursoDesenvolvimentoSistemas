document.addEventListener('DOMContentLoaded', () => {
    // 0. Auto-clear cache on load (except student name if we want persistence, but request said clear)
    // The request says "mude o site para apagar o chace assim que entrar", but also "solicitando o nome do outro aluno" at the end.
    // If we clear cache immediately on load, we lose the student name immediately. 
    // Assuming the user means "Clear cache when starting a NEW session/loading the page fresh".
    // However, if we clear localStorage here, we lose the student name right after they type it if they reload.
    // Let's implement the "Finalizar Aula" button logic which clears it. 
    // If "apagar o cache assim que entrar" means ensure a clean state:
    // We will NOT clear studentName here because that would force re-login on every refresh.
    // We WILL ensure other temporary data is reset if needed.
    
    // 1. Student Identification Logic
    const studentName = localStorage.getItem('studentName');
    
    if (!studentName) {
        showIdentificationModal();
    } else {
        console.log(`Aluno identificado: ${studentName}`);
    }

    // 2. Slideshow Logic
    initSlideshow();

    // 3. Email Sending Logic
    initEmailSender();

    // 4. Focus Mode Logic (Screen Lock)
    initFocusMode();

    // 5. Split Screen Textarea Logic
    initSplitScreenTextarea();

    // 6. Auto-Comment Activity Enunciado
    initAutoCommentActivity();

    // 7. Finish Lesson Button
    initFinishButton();

    // 7. Time Tracking
    startTime = Date.now();

    // 8. Image Preview Modal Logic
    initImagePreview();

    // 9. Code Validation (Real-time feedback)
    initCodeValidation();
});

// Load rules from window (defined in HTML) or empty default
const activityRules = window.activityRules || {};

function initCodeValidation() {
    const textareas = document.querySelectorAll('textarea[id^="activity-"]');
    
    textareas.forEach(textarea => {
        const rules = activityRules[textarea.id];
        if (!rules) return;

        // Create Validation UI Container
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'validation-feedback';
        feedbackContainer.style.cssText = `
            margin-top: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-left: 4px solid #004587;
            border-radius: 4px;
            font-size: 0.9rem;
        `;
        
        const title = document.createElement('strong');
        title.innerText = "Critérios da Atividade:";
        title.style.display = 'block';
        title.style.marginBottom = '5px';
        feedbackContainer.appendChild(title);

        const list = document.createElement('ul');
        list.style.listStyle = 'none';
        list.style.padding = '0';
        
        rules.forEach(rule => {
            const item = document.createElement('li');
            item.id = `rule-${textarea.id}-${rule.id}`;
            item.innerHTML = `⚪ ${rule.text}`;
            item.style.marginBottom = '3px';
            item.style.color = '#555';
            list.appendChild(item);
        });
        
        feedbackContainer.appendChild(list);
        
        // Insert after textarea (or after the send button if exists)
        const sendBtn = textarea.nextElementSibling;
        if (sendBtn && sendBtn.classList.contains('send-btn')) {
            sendBtn.parentNode.insertBefore(feedbackContainer, sendBtn);
        } else {
            textarea.parentNode.insertBefore(feedbackContainer, textarea.nextSibling);
        }

        // Real-time validation
        textarea.addEventListener('input', () => {
            // Get code ONLY, removing comments to avoid false positives from the instructions
            let code = textarea.value;
            
            // Remove block comments /* ... */
            code = code.replace(/\/\*[\s\S]*?\*\//g, '');
            // Remove line comments // ...
            code = code.replace(/\/\/.*/g, '');
            
            let allPassed = true;

            rules.forEach(rule => {
                const item = document.getElementById(`rule-${textarea.id}-${rule.id}`);
                if (rule.pattern.test(code)) {
                    item.innerHTML = `✅ <span style="text-decoration: line-through; color: #28a745;">${rule.text}</span>`;
                    item.style.color = '#28a745';
                } else {
                    item.innerHTML = `⚪ ${rule.text}`;
                    item.style.color = '#555';
                    allPassed = false;
                }
            });
            
            // Optional: Enable/Disable send button based on validation?
            // For now, let's just show visual feedback.
        });
        
        // Trigger once on load
        textarea.dispatchEvent(new Event('input'));
    });
}

function initAutoCommentActivity() {
    const textareas = document.querySelectorAll('.code-input');
    textareas.forEach(textarea => {
        // Prevent duplication
        if (textarea.dataset.enunciadoAdded) return;

        // Find the slide container
        const slide = textarea.closest('.slide');
        if (!slide) return;

        // Try to find description elements before the textarea
        // Strategy: Look for p, ul, ol, h2 within the slide that are NOT the textarea itself
        // We will construct the comment from all text content of the slide EXCEPT code blocks and the textarea
        
        let enunciadoText = "";
        
        // Better strategy: iterate over slide children
        const children = Array.from(slide.children);
        
        children.forEach(child => {
            // Skip the textarea itself, the send button, and previous code blocks (examples)
            if (child === textarea || child.classList.contains('send-btn') || child.classList.contains('code-block') || child.classList.contains('controls') || child.classList.contains('code-input')) {
                return;
            }
            
            // Also skip large code blocks used for teaching (usually have class code-block)
            // But we want to include H2, P, OL, UL
            if (['H2', 'P', 'UL', 'OL', 'DIV'].includes(child.tagName)) {
                 enunciadoText += child.innerText + "\n";
            }
        });

        if (enunciadoText.trim()) {
            const commentBlock = "/*\n * " + enunciadoText.trim().replace(/\n/g, "\n * ") + "\n */\n\n";
            
            // Prepend to existing value
            if (!textarea.value.includes(commentBlock.substring(0, 20))) {
                textarea.value = commentBlock + textarea.value;
                textarea.dataset.enunciadoAdded = "true";
            }
        }
    });
}

let startTime; 

function getFormattedTime() {
    const elapsed = Date.now() - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
}

function showIdentificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Identificação do Aluno</h2>
            <p>Por favor, digite seu nome completo para iniciar a aula.</p>
            <div style="background: #fff3cd; color: #d97706; padding: 10px; margin: 10px 0; border-left: 5px solid #ffc107; font-size: 0.9rem; text-align: left;">
                <strong>⚠️ Regras Importantes:</strong>
                <ul style="margin: 5px 0 0 20px;">
                    <li>O sistema monitora se você sair da tela.</li>
                    <li>Ao completar 5 infrações, a tela será bloqueada.</li>
                    <li>Use o botão de "Dividir Tela" para consultar o material enquanto responde.</li>
                </ul>
            </div>
            <input type="text" id="studentNameInput" placeholder="Seu Nome Completo">
            <button id="saveNameBtn" disabled>Começar Aula</button>
        </div>
    `;
    document.body.appendChild(modal);

    const input = document.getElementById('studentNameInput');
    const btn = document.getElementById('saveNameBtn');

    input.addEventListener('input', () => {
        btn.disabled = input.value.trim().length < 3;
    });

    btn.addEventListener('click', () => {
        const name = input.value.trim();
        if (name) {
            localStorage.setItem('studentName', name);
            modal.remove();
        }
    });
}

function initSlideshow() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const progressBar = document.getElementById('progressBar');
    const slideNumber = document.getElementById('slideNumber');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    if (!btnPrev || !btnNext) return;

    function checkAndEnforceFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log("Fullscreen request failed:", err);
            });
        }
    }

    function showSlide(index) {
        if (index < 0) index = 0;
        if (index >= slides.length) index = slides.length - 1;

        currentSlide = index;

        slides.forEach(slide => slide.classList.remove('active'));
        slides[currentSlide].classList.add('active');

        slides[currentSlide].scrollTop = 0;

        if (progressBar) {
            const progress = ((currentSlide + 1) / slides.length) * 100;
            progressBar.style.width = `${progress}%`;
        }

        if (slideNumber) {
            slideNumber.textContent = `${currentSlide + 1} / ${slides.length}`;
        }

        btnPrev.disabled = currentSlide === 0;
        btnNext.disabled = currentSlide === slides.length - 1;
        
        if (currentSlide === slides.length - 1) {
            btnNext.style.display = 'none';
        } else {
            btnNext.style.display = 'inline-block';
            btnNext.textContent = "Próximo";
        }
    }

    btnPrev.addEventListener('click', () => {
        checkAndEnforceFullscreen();
        showSlide(currentSlide - 1);
    });
    
    btnNext.addEventListener('click', () => {
        checkAndEnforceFullscreen();
        showSlide(currentSlide + 1);
    });

    showSlide(0);
}

function initEmailSender() {
    const sendBtns = document.querySelectorAll('.send-btn'); // PHP uses .send-btn (check HTML)
    
    // Helper para mostrar mensagens sem sair da tela cheia (evita infração)
    function showInlineMessage(btn, text, isError = false) {
        // Remove mensagens anteriores
        const oldMsg = btn.parentNode.querySelector('.status-msg');
        if (oldMsg) oldMsg.remove();

        const msg = document.createElement('p');
        msg.className = 'status-msg';
        msg.innerHTML = text; // Permite HTML/Emojis
        msg.style.color = isError ? '#dc3545' : '#28a745';
        msg.style.marginTop = '10px';
        msg.style.fontWeight = 'bold';
        msg.style.fontSize = '1.1rem';
        msg.style.transition = 'opacity 0.5s';
        
        // Insere logo após o botão
        btn.parentNode.insertBefore(msg, btn.nextSibling);

        // Remove após 5 segundos se for erro (sucesso fica fixo)
        if (isError) {
            setTimeout(() => {
                msg.style.opacity = '0';
                setTimeout(() => msg.remove(), 500);
            }, 5000);
        }
    }

    sendBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const studentName = localStorage.getItem('studentName') || "Aluno Desconhecido";
            const lessonTitle = document.title;
            
            // PHP files use .code-input class
            const container = btn.parentElement; // Usually inside a div
            // Try to find input in parent or siblings (robustness)
            let codeInput = container.querySelector('.code-input');
            if (!codeInput) {
                 // Try finding it in the previous sibling element (slide structure variation)
                 const prev = btn.previousElementSibling;
                 if (prev && prev.classList.contains('code-input')) {
                     codeInput = prev;
                 } else {
                     // Try searching in the whole slide
                     const slide = btn.closest('.slide');
                     if (slide) codeInput = slide.querySelector('.code-input');
                 }
            }
            
            if (!codeInput) {
                showInlineMessage(btn, '⚠️ Erro: Campo de código não encontrado.', true);
                return;
            }

            const codeContent = codeInput.value;
            if (!codeContent.trim()) {
                showInlineMessage(btn, '⚠️ Por favor, escreva sua resposta antes de enviar.', true);
                return;
            }

            const slide = btn.closest('.slide');
            const activityTitleElement = slide.querySelector('h2');
            const questionText = activityTitleElement ? activityTitleElement.innerText : "Atividade";

            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '⏳ Enviando...';

            const formData = {
                _subject: `PHP - ${lessonTitle} - ${studentName}`,
                _template: "table",
                _captcha: "false",
                Nome_Aluno: studentName,
                Aula: lessonTitle,
                Tempo_de_Aula: getFormattedTime(),
                Pergunta: questionText,
                Resposta: codeContent
            };

            try {
                const response = await fetch("https://formsubmit.co/ajax/julianoqm@gmail.com", {
                    method: "POST",
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    showInlineMessage(btn, '✅ Atividade enviada com sucesso!', false);
                    btn.innerHTML = '✅ Enviado!';
                    btn.style.backgroundColor = '#28a745';
                } else {
                    throw new Error('Erro na resposta do servidor.');
                }
            } catch (error) {
                console.error(error);
                showInlineMessage(btn, '❌ Erro ao enviar. Verifique sua internet e tente novamente.', true);
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    });
}

function initFocusMode() {
    let infractionCount = parseInt(localStorage.getItem('infractionCount') || '0');
    const maxInfractions = 5; 
    const studentName = localStorage.getItem('studentName') || 'Aluno';
    let isBlocked = false;

    // Create blocking overlay (hidden by default)
    const overlay = document.createElement('div');
    overlay.id = 'focus-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(255, 0, 0, 0.95); z-index: 9999;
        display: none; flex-direction: column; justify-content: center; align-items: center;
        color: white; font-family: sans-serif; text-align: center;
    `;
    overlay.innerHTML = `
        <h1 style="font-size: 3rem; margin-bottom: 20px;">⚠️ BLOQUEADO ⚠️</h1>
        <h2 style="font-size: 2rem;">Você saiu da aula muitas vezes!</h2>
        <p style="font-size: 1.5rem;">Chame o professor para desbloquear.</p>
        <div style="margin-top: 30px;">
            <input type="password" id="unlockPass" placeholder="Senha do Professor" style="padding: 15px; font-size: 1.2rem; border-radius: 5px; border: none;">
            <button id="unlockBtn" style="padding: 15px 30px; font-size: 1.2rem; cursor: pointer; background: white; color: red; border: none; font-weight: bold; border-radius: 5px;">Desbloquear</button>
        </div>
    `;
    document.body.appendChild(overlay);

    // Check if already blocked from previous session
    if (infractionCount >= maxInfractions) {
        isBlocked = true;
        overlay.style.display = 'flex';
    }

    // Unlock logic (Password: 05061989 or Juli@no)
    document.getElementById('unlockBtn').addEventListener('click', () => {
        const passInput = document.getElementById('unlockPass');
        const pass = passInput.value;
        if (pass === '05061989') {
            // Unblock Standard
            isBlocked = false;
            infractionCount = 0;
            localStorage.setItem('infractionCount', '0');
            overlay.style.display = 'none';
            passInput.value = ''; // Clear password field
            
            // Maximize Screen
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log("Fullscreen denied:", err);
                });
            }
        } else if (pass === 'Juli@no') {
            // Unblock Master (No fullscreen, no tracking)
            isBlocked = false;
            // Set a flag to ignore infractions for this session
            sessionStorage.setItem('masterMode', 'true');
            
            infractionCount = 0;
            localStorage.setItem('infractionCount', '0');
            overlay.style.display = 'none';
            passInput.value = '';
            
            showToast("🔓 Modo Master Ativado: Sem restrições.");
        } else {
            alert('Senha incorreta!');
            passInput.value = '';
        }
    });

    // Detect Tab Switch / Minimize
    document.addEventListener('visibilitychange', () => {
        if (sessionStorage.getItem('masterMode') === 'true') return;

        if (document.hidden && !isBlocked) {
            handleInfraction("Troca de aba ou minimização");
        } else if (!document.hidden && !isBlocked) {
            // User came back. Check fullscreen.
            // Wait a bit to check if reload is pending or just normal switching
            setTimeout(() => {
                if (!document.fullscreenElement) {
                    forceFullscreenReentry();
                }
            }, 200);
        }
    });

    let isSystemAlert = false; // Flag to ignore blur events caused by system alerts

    function handleInfraction(reason) {
        if (sessionStorage.getItem('masterMode') === 'true') return;
        
        infractionCount++;
        localStorage.setItem('infractionCount', infractionCount);
        const remaining = maxInfractions - infractionCount;

        if (infractionCount >= maxInfractions) {
            isBlocked = true;
            overlay.style.display = 'flex';
            // Play alarm sound (beep)
            const audio = new AudioContext();
            const osc = audio.createOscillator();
            osc.connect(audio.destination);
            osc.frequency.value = 500;
            osc.start();
            setTimeout(() => osc.stop(), 1000);
        } else {
            isSystemAlert = true; // Set flag to ignore subsequent blur
            alert(`⚠️ ATENÇÃO ${studentName}!\n\nVocê saiu da tela da aula!\nIsso foi registrado como uma infração.\n\nMotivo: ${reason}\nInfrações: ${infractionCount}/${maxInfractions}\n\n⚠️ IMPORTANTE: Qualquer ação que saia da tela implica em infração e será descontado pontos da atividade do dia!\nVocê NÃO pode sair da aula até finalizar.`);
            
            // Small timeout to allow focus to return to window before clearing flag
            setTimeout(() => {
                isSystemAlert = false; 
            }, 500);
        }
    }

    // Detect Window Blur (losing focus to another app)
    window.addEventListener('blur', () => {
        if (sessionStorage.getItem('masterMode') === 'true') return;

        if (!isBlocked && !isSystemAlert) {
            // Check if document is hidden (to avoid double counting with visibilitychange)
            if (!document.hidden) {
                handleInfraction("Perda de foco da janela");
            }
        }
    });

    // Detect Exit Fullscreen
    document.addEventListener('fullscreenchange', () => {
        if (sessionStorage.getItem('masterMode') === 'true') return;

        if (!document.fullscreenElement && !isBlocked && !isSystemAlert) {
             handleInfraction("Saiu da Tela Cheia");
             // Force resume overlay immediately
             forceFullscreenReentry();
        }
    });

    // Function to force fullscreen when returning
    function forceFullscreenReentry() {
        if (!document.fullscreenElement) {
            // We cannot requestFullscreen automatically without user gesture.
            // Show a modal that requires a click to dismiss, which triggers fullscreen.
            const resumeOverlay = document.createElement('div');
            resumeOverlay.id = 'resume-overlay';
            resumeOverlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.9); z-index: 10000;
                display: flex; flex-direction: column; justify-content: center; align-items: center;
                color: white; font-family: sans-serif; text-align: center; cursor: pointer;
            `;
            resumeOverlay.innerHTML = `
                <h1 style="font-size: 2.5rem; margin-bottom: 20px;">⏸️ Aula Pausada</h1>
                <p style="font-size: 1.5rem; margin-bottom: 30px;">Você saiu da tela. Clique em qualquer lugar para retomar em Tela Cheia.</p>
                <p style="font-size: 1rem; color: #ff6b6b;">⚠️ Atenção: Suas saídas estão sendo registradas. Não saia até finalizar a aula!</p>
                <div style="font-size: 3rem;">👆</div>
            `;
            document.body.appendChild(resumeOverlay);

            resumeOverlay.addEventListener('click', () => {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log("Fullscreen denied:", err);
                });
                resumeOverlay.remove();
            });
        }
    }

    // Prevent Context Menu (Right Click)
    document.addEventListener('contextmenu', (e) => {
        if (sessionStorage.getItem('masterMode') === 'true') return;
        e.preventDefault();
        showToast('🚫 Clique direito desativado para evitar cola!');
    });

    // Prevent some shortcuts (Ctrl+C, Ctrl+V, F12, Alt+Tab is impossible to block)
    document.addEventListener('keydown', (e) => {
        if (sessionStorage.getItem('masterMode') === 'true') return;

        // F12 or Ctrl+Shift+I (DevTools)
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
            showToast('🚫 Ferramentas de desenvolvedor bloqueadas.');
        }
        // Ctrl+C / Ctrl+V
        if ((e.ctrlKey && e.key === 'c') || (e.ctrlKey && e.key === 'v')) {
            e.preventDefault();
            showToast('🚫 Copiar/Colar bloqueado.');
        }
    });


    // Force Fullscreen on Click (Optional but recommended)
    document.body.addEventListener('click', () => {
        if (!document.fullscreenElement && !isBlocked) {
            try {
                document.documentElement.requestFullscreen().catch(err => {
                    // Ignore errors if user denies
                });
            } catch (e) {}
        }
    }, { once: true }); // Only try once per session to avoid annoyance
}

function showToast(message) {
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerText = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10002;
        font-family: 'Segoe UI', sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        opacity: 0;
        transition: opacity 0.5s;
    `;
    
    document.body.appendChild(toast);
    
    // Fade in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });

    // Fade out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function initSplitScreenTextarea() {
    const textareas = document.querySelectorAll('.code-input');
    
    // Create global close button if it doesn't exist
    let closeBtn = document.querySelector('.close-fullscreen-btn');
    if (!closeBtn) {
        closeBtn = document.createElement('button');
        closeBtn.className = 'close-fullscreen-btn';
        closeBtn.innerHTML = '➡️ Restaurar Tela';
        document.body.appendChild(closeBtn);
    }

    textareas.forEach(textarea => {
        // Create Split Button for each textarea
        const splitBtn = document.createElement('button');
        splitBtn.className = 'maximize-btn';
        splitBtn.innerHTML = '◫ Dividir Tela';
        splitBtn.title = 'Abrir editor ao lado para consultar os slides';
        
        // Prevent Copy/Paste
        textarea.addEventListener('paste', e => {
             if (sessionStorage.getItem('masterMode') === 'true') return;
             e.preventDefault();
             showToast("🚫 Colar é proibido! Digite sua resposta.");
        });
        textarea.addEventListener('copy', e => {
             if (sessionStorage.getItem('masterMode') === 'true') return;
             e.preventDefault();
        });
        
        // Insert button before textarea
        textarea.parentNode.insertBefore(splitBtn, textarea);

        // Logic
        splitBtn.addEventListener('click', () => {
            // Prevent double activation
            if (document.body.classList.contains('split-screen-mode')) {
                alert("Você já está no modo de tela dividida!");
                return;
            }

            // Store original parent to restore later
            if (!textarea.dataset.originalParent) {
                // Use a marker to know exactly where to put it back
                const marker = document.createElement('div');
                marker.id = 'textarea-marker-' + Math.random().toString(36).substr(2, 9);
                marker.style.display = 'none';
                textarea.parentNode.insertBefore(marker, textarea);
                textarea.dataset.markerId = marker.id;
            }

            // Move to body to persist across slide changes
            document.body.appendChild(textarea);
            
            textarea.classList.add('side-view');
            document.body.classList.add('split-screen-mode');
            closeBtn.style.display = 'block';
            textarea.focus();

            // Auto-copy question logic...
            // Logic to find activity content in the slide
            // We need to find the slide that *contained* the button
            const slide = splitBtn.closest('.slide'); 
            if (slide && !textarea.dataset.enunciadoAdded) {
                // If initAutoCommentActivity didn't run or didn't find it yet, run it now for this specific one
                initAutoCommentActivity();
            }
        });
    });

    closeBtn.addEventListener('click', () => {
        const splitInputs = document.querySelectorAll('.code-input.side-view');
        splitInputs.forEach(el => {
            el.classList.remove('side-view');
            
            // Restore to original location
            const markerId = el.dataset.markerId;
            if (markerId) {
                const marker = document.getElementById(markerId);
                if (marker && marker.parentNode) {
                    marker.parentNode.insertBefore(el, marker);
                    marker.remove();
                } else {
                    // Fallback if marker is lost: put it back near the split button
                    const splitBtn = el.previousElementSibling; // Try to find the button
                    if (splitBtn && splitBtn.classList.contains('maximize-btn')) {
                         splitBtn.parentNode.insertBefore(el, splitBtn.nextSibling);
                    } else {
                        // Extreme fallback: Find the active slide and append
                        const activeSlide = document.querySelector('.slide.active');
                        if (activeSlide) activeSlide.appendChild(el);
                    }
                }
                delete el.dataset.markerId;
            } else {
                // Should not happen if logic is correct, but safe fallback
                const activeSlide = document.querySelector('.slide.active');
                if (activeSlide) activeSlide.appendChild(el);
            }
        });
        
        document.body.classList.remove('split-screen-mode');
        closeBtn.style.display = 'none';
    });
}

function initFinishButton() {
    const finishBtn = document.getElementById('finishLessonBtn');
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja finalizar a aula? Isso apagará seus dados locais e reiniciará.')) {
                localStorage.clear(); 
                sessionStorage.removeItem('masterMode'); // Revoke Master Mode
                alert('Aula finalizada com sucesso!');
                location.reload(); 
            }
        });
    }
}

function initImagePreview() {
    const previewLinks = document.querySelectorAll('.preview-link');
    if (previewLinks.length === 0) return;

    // Create Modal Elements
    const modal = document.createElement('div');
    modal.id = 'img-preview-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); z-index: 10001; display: none;
        justify-content: center; align-items: center; cursor: zoom-out;
    `;
    
    const img = document.createElement('img');
    img.style.cssText = `max-width: 90%; max-height: 90%; border-radius: 8px; box-shadow: 0 0 20px rgba(255,255,255,0.2);`;
    
    const closeHint = document.createElement('div');
    closeHint.textContent = 'Clique em qualquer lugar para fechar';
    closeHint.style.cssText = `position: absolute; bottom: 20px; color: white; font-family: sans-serif; opacity: 0.7;`;

    modal.appendChild(img);
    modal.appendChild(closeHint);
    document.body.appendChild(modal);

    // Add Event Listeners
    previewLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const imgSrc = link.getAttribute('data-img');
            if (imgSrc) {
                img.src = imgSrc;
                modal.style.display = 'flex';
            }
        });
    });

    modal.addEventListener('click', () => {
        modal.style.display = 'none';
        img.src = ''; // Clear source
    });
}
