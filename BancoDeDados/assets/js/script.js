document.addEventListener('DOMContentLoaded', () => {
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

    // 4. Focus Mode (Anti-Cheat)
    initFocusMode();

    // 5. Split Screen Textarea Logic
    initSplitScreenTextarea();

    // 6. Finish Lesson Button
    initFinishButton();

    // 7. Time Tracking
    startTime = Date.now();
});

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
    const sendBtns = document.querySelectorAll('.send-email-btn');

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
            const codeInputId = btn.getAttribute('data-input-id');
            const codeInput = document.getElementById(codeInputId);
            
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
                _subject: `BD - ${lessonTitle} - ${studentName}`,
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

    // Unlock logic (Password: 05061989)
    document.getElementById('unlockBtn').addEventListener('click', () => {
        const passInput = document.getElementById('unlockPass');
        const pass = passInput.value;
        if (pass === '05061989') {
            // Unblock
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
        } else {
            alert('Senha incorreta!');
            passInput.value = '';
        }
    });

    // Detect Tab Switch / Minimize
    document.addEventListener('visibilitychange', () => {
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

    // ... (inside handleInfraction)
    function handleInfraction(reason) {
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
        if (!isBlocked && !isSystemAlert) {
            // Check if document is hidden (to avoid double counting with visibilitychange)
            if (!document.hidden) {
                handleInfraction("Perda de foco da janela");
            }
        }
    });

    // Detect Exit Fullscreen
    document.addEventListener('fullscreenchange', () => {
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
        e.preventDefault();
        alert('🚫 Clique direito desativado para evitar cola!');
    });

    // Prevent some shortcuts (Ctrl+C, Ctrl+V, F12, Alt+Tab is impossible to block)
    document.addEventListener('keydown', (e) => {
        // F12 or Ctrl+Shift+I (DevTools)
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
            alert('🚫 Ferramentas de desenvolvedor bloqueadas.');
        }
        // Ctrl+C / Ctrl+V
        if ((e.ctrlKey && e.key === 'c') || (e.ctrlKey && e.key === 'v')) {
            e.preventDefault();
            alert('🚫 Copiar/Colar bloqueado.');
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
        
        textarea.parentNode.insertBefore(splitBtn, textarea);

        // Logic
        splitBtn.addEventListener('click', () => {
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
            const slide = splitBtn.closest('.slide'); // Use button to find slide since textarea is now in body
            if (slide) {
                const activityBox = slide.querySelector('.activity-box');
                if (activityBox) {
                    let formattedText = "";
                    const separator = "\n/* =========================================\n   SUA RESPOSTA ABAIXO:\n   ========================================= */\n\n";
                    
                    let introText = [];
                    let hasList = false;

                    Array.from(activityBox.children).forEach(child => {
                        if (child.tagName === 'OL' || child.tagName === 'UL') {
                            hasList = true;
                            if (introText.length > 0) {
                                formattedText += `/* \n${introText.join('\n\n')}\n*/\n\n`;
                                introText = [];
                            }
                            Array.from(child.children).forEach((li, index) => {
                                const prefix = child.tagName === 'OL' ? `${index + 1}. ` : '• ';
                                formattedText += `/* ${prefix}${li.innerText.trim()} */${separator}`;
                            });
                        } else {
                            const text = child.innerText.trim();
                            if (text) introText.push(text);
                        }
                    });

                    if (introText.length > 0) {
                        if (hasList) {
                            formattedText += `/* \n${introText.join('\n\n')}\n*/\n`;
                        } else {
                            formattedText += `/* \n${introText.join('\n\n')}\n*/${separator}`;
                        }
                    }

                    if (!textarea.value.includes("SUA RESPOSTA ABAIXO")) {
                        textarea.value = formattedText + textarea.value;
                    }
                }
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
                }
                delete el.dataset.markerId;
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
                alert('Aula finalizada com sucesso!');
                location.reload(); 
            }
        });
    }
}
