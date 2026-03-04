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

    // 5. Finish Lesson Logic (Wait for DOM to load potentially dynamic buttons)
    initFinishButton();

    // 6. Focus Mode (Proctoring) - Blocks access to other sites (deterrent)
    initFocusMode();
    // 7. Time Tracking (Time on Page)
    startTime = Date.now();

    // 8. Image Preview Modal Logic
    initImagePreview();

    // Check fullscreen on initial load if student is already identified (skipped modal)
    if (studentName && !document.fullscreenElement) {
        // We cannot force it without gesture, but we can show the resume overlay immediately
        // However, initFocusMode creates the logic but doesn't expose forceFullscreenReentry directly unless we attach it to window or move it out.
        // Let's rely on the first click (which we added listener for in initFocusMode) or wait for visibility change.
        // But the user specifically asked for maximize on unlock (which reloads).
        // On reload, we are here.
        // Let's simulate a "blur/focus" cycle or just wait for the user to interact.
        // The body click listener in initFocusMode will handle the first click.
    }
});

let startTime; // Global variable to store start time

function getFormattedTime() {
    const elapsed = Date.now() - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
}

/* 
function initFullscreenTextarea() {
    // ... Function removed to allow viewing slides while typing ...
}
*/

// --- Focus Mode Logic ---
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
                    <li>Qualquer ação que saia da tela implicará em infração.</li>
                    <li>Infrações descontam pontos da atividade do dia.</li>
                    <li>O sistema monitora trocas de aba e minimizações.</li>
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

// List of lessons in order for navigation
const lessonFiles = [
    "01_estrutura_html5.html",
    "02_flexbox_responsivo.html",
    "03_bootstrap.html",
    "04_logica_js.html",
    "05_intro_php.html",
    "06_lacos_arrays.html",
    "07_html_php_forms.html",
    "08_pdo_conexao.html",
    "09_crud_create.html",
    "10_crud_read.html",
    "11_crud_update_delete.html",
    "12_sessoes_autenticacao.html",
    "13_upload_relacionamentos.html",
    "14_arquitetura_seguranca.html",
    "15_projeto_final.html"
];

function navigateToNextLesson() {
    // Get current filename
    let path = window.location.pathname;
    let currentFile = path.substring(path.lastIndexOf('/') + 1);
    currentFile = decodeURIComponent(currentFile);
    
    // Handle case where URL might not have the file name (e.g. server root)
    if (!currentFile || currentFile === 'index.html') return; // Don't auto-nav from index

    const currentIndex = lessonFiles.indexOf(currentFile);
    if (currentIndex !== -1 && currentIndex < lessonFiles.length - 1) {
        if(confirm("Você finalizou esta aula. Deseja ir para a próxima?")) {
            window.location.href = lessonFiles[currentIndex + 1];
        }
    } else if (currentIndex === lessonFiles.length - 1) {
        alert("Parabéns! Você concluiu todas as aulas do curso.");
    }
}

function initSlideshow() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const progressBar = document.getElementById('progressBar');
    const slideNumber = document.getElementById('slideNumber');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    // Create controls if they don't exist (robustness)
    if (!btnPrev || !btnNext) {
        console.warn('Navigation buttons not found.');
        return;
    }

    function showSlide(index) {
        if (index < 0) index = 0;
        if (index >= slides.length) index = slides.length - 1;

        currentSlide = index;

        slides.forEach(slide => slide.classList.remove('active'));
        slides[currentSlide].classList.add('active');

        // Scroll to top when changing slide
        slides[currentSlide].scrollTop = 0;

        // Update Progress
        if (progressBar) {
            const progress = ((currentSlide + 1) / slides.length) * 100;
            progressBar.style.width = `${progress}%`;
        }

        // Update Number
        if (slideNumber) {
            slideNumber.textContent = `${currentSlide + 1} / ${slides.length}`;
        }

        // Update Buttons
        btnPrev.disabled = currentSlide === 0;
        btnNext.disabled = currentSlide === slides.length - 1;
        
        if (currentSlide === slides.length - 1) {
            // Last slide behavior
            btnNext.style.display = 'none'; // Hide "Next" on last slide
        } else {
            btnNext.style.display = 'inline-block';
            btnNext.textContent = "Próximo";
        }
    }

    // Check and Enforce Fullscreen on Navigation
    function checkAndEnforceFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log("Fullscreen request failed:", err);
            });
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

    // Keyboard Navigation REMOVED as requested
    /*
    document.addEventListener('keydown', (e) => {
        const activeSlide = slides[currentSlide];
        
        // Next Action (ArrowRight, Space, PageDown)
        if (['ArrowRight', ' ', 'PageDown'].includes(e.key)) {
            // Removed logic
        }
        // Prev Action (ArrowLeft, PageUp)
        else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
            // Removed logic
        }
    });
    */

    // Initialize
    showSlide(0);
}

function initEmailSender() {
    // Select all buttons with class 'send-btn' (used in our HTML templates)
    const sendBtns = document.querySelectorAll('.send-btn');
    
    sendBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const studentName = localStorage.getItem('studentName') || "Aluno Desconhecido";
            const lessonTitle = document.title;
            
            // Find the textarea in the same container (sibling or parent search)
            const container = btn.parentElement;
            const codeInput = container.querySelector('.code-input');
            
            if (!codeInput) {
                alert('Erro: Campo de código não encontrado.');
                return;
            }

            const codeContent = codeInput.value;
            if (!codeContent.trim()) {
                alert('Por favor, escreva sua resposta antes de enviar.');
                return;
            }

            // Find the question/activity title (Previous H2 in the slide)
            const slide = btn.closest('.slide');
            const activityTitleElement = slide.querySelector('h2');
            const questionText = activityTitleElement ? activityTitleElement.innerText : "Atividade";

            // Disable button to prevent double submission
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '⏳ Enviando...';

            // Data to send via FormSubmit
            const formData = {
                _subject: `PHP - ${lessonTitle} - ${studentName}`,
                _template: "table", 
                _captcha: "false",
                Nome_Aluno: studentName,
                Aula: lessonTitle,
                Tempo_de_Aula: getFormattedTime(),
                Codigo_Resposta: questionText,
                Resposta_Aluno: codeContent
            };

            try {
                // Using FormSubmit.co AJAX API
                const response = await fetch("https://formsubmit.co/ajax/julianoqm@gmail.com", {
                    method: "POST",
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert('✅ Resposta enviada com sucesso para o professor!');
                    btn.innerHTML = '✅ Enviado!';
                    btn.style.backgroundColor = '#28a745';
                } else {
                    throw new Error('Erro na resposta do servidor de email.');
                }
            } catch (error) {
                console.error(error);
                alert('❌ Erro ao enviar. Verifique sua internet.');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    });
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

function initFinishButton() {
    // This function looks for a button with id="finishLessonBtn"
    // It can be added dynamically or exist in HTML
    const finishBtn = document.getElementById('finishLessonBtn');
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja finalizar a aula? Isso apagará seus dados locais e voltará para o início.')) {
                localStorage.clear(); // Clears ALL localStorage data (studentName, infractions, etc.)
                alert('Aula finalizada! Obrigado.');
                
                // Redirect to the first slide of the current page (reload) 
                // OR if we want to go to a specific "Home", we could do window.location.href = 'index.html';
                // The request says "volta para o primeiro slide ... solicitando o nome do outro aluno"
                // Reloading the page will trigger the check for studentName, find it missing, and show the modal.
                location.reload(); 
            }
        });
    }
}
