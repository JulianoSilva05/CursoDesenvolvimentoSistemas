document.addEventListener('DOMContentLoaded', () => {
    // 1. Student Identification Logic
    const studentName = localStorage.getItem('studentName');
    
    if (!studentName) {
        showIdentificationModal();
    } else {
        console.log(`Aluno identificado: ${studentName}`);
    }

    // 2. F11 Suggestion Popup
    showF11Popup();

    // 3. Slideshow Logic
    initSlideshow();

    // 4. Email Sending Logic
    initEmailSender();

    // 5. Finish Lesson Logic (Wait for DOM to load potentially dynamic buttons)
    initFinishButton();
});

function showF11Popup() {
    // Check if not already in fullscreen
    if (!document.fullscreenElement) {
        const popup = document.createElement('div');
        popup.className = 'f11-popup';
        popup.innerHTML = `
            <span>🖥️ Pressione <strong>F11</strong> para Tela Cheia</span>
        `;
        document.body.appendChild(popup);
        
        // Remove after 5 seconds (handled by CSS animation, but good to clean DOM)
        setTimeout(() => {
            if (popup.parentNode) popup.remove();
        }, 6000);
    }
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

            // Find the question/activity title
            // Strategy: Look for the closest .activity-box and find .activity-title or just take the previous H2
            const slide = btn.closest('.slide');
            const activityTitleElement = slide.querySelector('.activity-title') || slide.querySelector('h2');
            const questionText = activityTitleElement ? activityTitleElement.innerText : "Atividade";

            // Disable button to prevent double submission
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '⏳ Enviando...';

            // Data to send via FormSubmit
            // We use dynamic keys to make the email look better
            const formData = {
                _subject: `${lessonTitle} - ${studentName}`,
                _template: "table", 
                _captcha: "false",
                Nome_Aluno: studentName,
                Aula: lessonTitle,
                [questionText]: codeContent // Key is the question text
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
                } else {
                    throw new Error('Erro na resposta do servidor de email.');
                }
            } catch (error) {
                console.error(error);
                alert('❌ Erro ao enviar. Tente novamente ou salve seu código localmente.');
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
