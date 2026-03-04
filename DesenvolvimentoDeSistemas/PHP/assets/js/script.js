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

    // 5. Finish Lesson Logic (Wait for DOM to load potentially dynamic buttons)
    initFinishButton();

    // 6. Focus Mode (Proctoring) - Blocks access to other sites (deterrent)
    initFocusMode();
    // 7. Time Tracking (Time on Page)
    startTime = Date.now();

    // 8. Fullscreen Textarea Logic
    initFullscreenTextarea();
});

let startTime; // Global variable to store start time

function getFormattedTime() {
    const elapsed = Date.now() - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
}

function initFullscreenTextarea() {
    const textareas = document.querySelectorAll('.code-input');
    
    // Create Close Button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '❌ Sair da Tela Cheia (ESC)';
    closeBtn.className = 'close-fullscreen-btn';
    document.body.appendChild(closeBtn);

    let activeTextarea = null;

    function openFullscreen(textarea) {
        if (activeTextarea === textarea) return;
        
        // Close others if any
        if (activeTextarea) closeFullscreen();

        textarea.classList.add('fullscreen');
        closeBtn.style.display = 'block';
        activeTextarea = textarea;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    function closeFullscreen() {
        if (activeTextarea) {
            activeTextarea.classList.remove('fullscreen');
            closeBtn.style.display = 'none';
            activeTextarea = null;
            document.body.style.overflow = ''; // Restore scroll
        }
    }

    textareas.forEach(textarea => {
        textarea.addEventListener('click', () => {
            openFullscreen(textarea);
        });
    });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering textarea click if overlapping (unlikely but safe)
        closeFullscreen();
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFullscreen();
        }
    });
}

// --- Focus Mode Logic ---
function initFocusMode() {
    let infractionCount = 0;
    const maxInfractions = 5; // Changed to 5 chances
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

    // Unlock logic (Password: 05061989)
    document.getElementById('unlockBtn').addEventListener('click', () => {
        const passInput = document.getElementById('unlockPass');
        const pass = passInput.value;
        if (pass === '05061989') {
            infractionCount = 0;
            isBlocked = false;
            overlay.style.display = 'none';
            passInput.value = ''; // Clear password
            alert('Desbloqueado! Mantenha o foco.');
        } else {
            alert('Senha incorreta!');
            passInput.value = '';
        }
    });

    // Detect Tab Switch / Minimize
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && !isBlocked) {
            handleInfraction("Troca de aba ou minimização");
        }
    });

    // Detect Window Blur (losing focus to another app)
    window.addEventListener('blur', () => {
        if (!isBlocked) {
            // Check if document is hidden (to avoid double counting with visibilitychange)
            if (!document.hidden) {
                handleInfraction("Perda de foco da janela");
            }
        }
    });

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

    function handleInfraction(reason) {
        infractionCount++;
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
            alert(`⚠️ ATENÇÃO ${studentName}!\n\nVocê saiu da tela da aula!\nIsso foi registrado como uma infração.\n\nMotivo: ${reason}\nInfrações: ${infractionCount}/${maxInfractions}\n\nSe continuar saindo, a tela será bloqueada.`);
        }
    }

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

    btnPrev.addEventListener('click', () => showSlide(currentSlide - 1));
    btnNext.addEventListener('click', () => showSlide(currentSlide + 1));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'Space') showSlide(currentSlide + 1);
        else if (e.key === 'ArrowLeft') showSlide(currentSlide - 1);
    });

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
                Atividade: questionText,
                Resposta: codeContent
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

function initFinishButton() {
    // This function looks for a button with id="finishLessonBtn"
    // It can be added dynamically or exist in HTML
    const finishBtn = document.getElementById('finishLessonBtn');
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja finalizar a aula? Isso apagará seus dados locais.')) {
                localStorage.removeItem('studentName');
                alert('Aula finalizada! Obrigado.');
                location.reload(); // Reloads the page, which triggers the modal again
            }
        });
    }
}
