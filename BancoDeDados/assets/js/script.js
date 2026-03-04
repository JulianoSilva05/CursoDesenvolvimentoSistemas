document.addEventListener('DOMContentLoaded', () => {
    // 1. Student Identification Logic
    const studentName = localStorage.getItem('studentName');
    
    if (!studentName) {
        showIdentificationModal();
    } else {
        console.log(`Aluno identificado: ${studentName}`);
    }

    // 2. Focus Mode (Proctoring) - Blocks access to other sites
    initFocusMode();

    // 3. Slideshow Logic
    initSlideshow();

    // 4. Email Sending Logic
    initEmailSender();

    // 5. Finish Lesson Logic (Wait for DOM to load potentially dynamic buttons)
    initFinishButton();
    
    // 7. Time Tracking
    startTime = Date.now();
});

let startTime; // Global variable to store start time

function getFormattedTime() {
    const elapsed = Date.now() - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
}

// --- Focus Mode Logic ---
function initFocusMode() {
    let infractionCount = parseInt(localStorage.getItem('infractionCount') || '0');
    const maxInfractions = 5; 
    const studentName = localStorage.getItem('studentName') || 'Aluno';
    let isBlocked = false;
    let isSystemAlert = false; // Flag to ignore blur events caused by system alerts

    // Create blocking overlay (hidden by default)
    const overlay = document.createElement('div');
    overlay.id = 'focus-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(255, 0, 0, 0.95); z-index: 20000;
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
            
            // Maximize Screen immediately
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

    // Function to handle infractions
    function handleInfraction(reason) {
        infractionCount++;
        localStorage.setItem('infractionCount', infractionCount);
        const remaining = maxInfractions - infractionCount;

        if (infractionCount >= maxInfractions) {
            isBlocked = true;
            overlay.style.display = 'flex';
        } else {
            isSystemAlert = true; // Set flag to ignore subsequent blur
            alert(`⚠️ ATENÇÃO ${studentName}!\n\nVocê saiu da tela da aula!\nIsso foi registrado como uma infração.\n\nMotivo: ${reason}\nInfrações: ${infractionCount}/${maxInfractions}\n\n⚠️ IMPORTANTE: Não saia da tela cheia ou troque de aba!`);
            
            setTimeout(() => {
                isSystemAlert = false; 
            }, 500);
        }
    }

    // Detect Tab Switch / Minimize
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && !isBlocked) {
            handleInfraction("Troca de aba ou minimização");
        } else if (!document.hidden && !isBlocked) {
            // User came back. Check fullscreen.
            setTimeout(() => {
                if (!document.fullscreenElement) {
                    forceFullscreenReentry();
                }
            }, 200);
        }
    });

    // Detect Window Blur (losing focus to another app)
    window.addEventListener('blur', () => {
        if (!isBlocked && !isSystemAlert) {
            if (!document.hidden) {
                handleInfraction("Perda de foco da janela");
            }
        }
    });

    // Detect Exit Fullscreen
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && !isBlocked && !isSystemAlert) {
             handleInfraction("Saiu da Tela Cheia");
             forceFullscreenReentry();
        }
    });

    // Function to force fullscreen when returning
    function forceFullscreenReentry() {
        if (!document.fullscreenElement && !document.getElementById('resume-overlay')) {
            const resumeOverlay = document.createElement('div');
            resumeOverlay.id = 'resume-overlay';
            resumeOverlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.9); z-index: 20001;
                display: flex; flex-direction: column; justify-content: center; align-items: center;
                color: white; font-family: sans-serif; text-align: center; cursor: pointer;
            `;
            resumeOverlay.innerHTML = `
                <h1 style="font-size: 2.5rem; margin-bottom: 20px;">⏸️ Aula Pausada</h1>
                <p style="font-size: 1.5rem; margin-bottom: 30px;">Clique em qualquer lugar para retomar em Tela Cheia.</p>
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
        // alert('🚫 Clique direito desativado.'); // Optional: avoid spamming alerts
    });

    // Prevent some shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
        }
    });
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
            // Try to enter fullscreen after identification
            document.documentElement.requestFullscreen().catch(() => {});
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
    const sendBtns = document.querySelectorAll('.send-email-btn');
    
    sendBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const studentName = localStorage.getItem('studentName') || "Aluno Desconhecido";
            const lessonTitle = document.title;
            const codeInputId = btn.getAttribute('data-input-id');
            const codeInput = document.getElementById(codeInputId);
            
            if (!codeInput) {
                alert('Erro: Campo de código não encontrado.');
                return;
            }

            const codeContent = codeInput.value;
            if (!codeContent.trim()) {
                alert('Por favor, escreva sua resposta antes de enviar.');
                return;
            }

            const slide = btn.closest('.slide');
            const activityTitleElement = slide.querySelector('.activity-title') || slide.querySelector('h2');
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
                [questionText]: codeContent
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
                    // Success!
                    btn.innerHTML = '✅ Enviado!';
                    btn.style.backgroundColor = '#28a745';
                    
                    // Create a non-intrusive toast notification instead of alert() to prevent fullscreen exit
                    const toast = document.createElement('div');
                    toast.innerText = '✅ Resposta enviada com sucesso!';
                    toast.style.cssText = `
                        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                        background: #28a745; color: white; padding: 15px 30px; border-radius: 50px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3); font-size: 1.2rem; z-index: 20000;
                        animation: fadeInOut 3s forwards;
                    `;
                    document.body.appendChild(toast);
                    
                    // Add animation keyframes if not exists
                    if (!document.getElementById('toast-style')) {
                        const style = document.createElement('style');
                        style.id = 'toast-style';
                        style.innerHTML = `
                            @keyframes fadeInOut {
                                0% { opacity: 0; transform: translate(-50%, 20px); }
                                10% { opacity: 1; transform: translate(-50%, 0); }
                                90% { opacity: 1; transform: translate(-50%, 0); }
                                100% { opacity: 0; transform: translate(-50%, -20px); }
                            }
                        `;
                        document.head.appendChild(style);
                    }
                    
                    setTimeout(() => toast.remove(), 3000);

                } else {
                    throw new Error('Erro na resposta do servidor de email.');
                }
            } catch (error) {
                console.error(error);
                // Use toast for error too
                const toast = document.createElement('div');
                toast.innerText = '❌ Erro ao enviar. Tente novamente.';
                toast.style.cssText = `
                    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                    background: #dc3545; color: white; padding: 15px 30px; border-radius: 50px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3); font-size: 1.2rem; z-index: 20000;
                `;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
                
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    });
}

function initFinishButton() {
    const finishBtn = document.getElementById('finishLessonBtn');
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja finalizar a aula? Isso apagará seus dados locais e voltará para o início.')) {
                localStorage.clear(); // Clears all data
                alert('Aula finalizada! Obrigado.');
                location.reload(); 
            }
        });
    }
}
