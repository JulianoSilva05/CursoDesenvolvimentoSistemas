/* ========== SENAI — API JSON, matrícula, pontos, avisos ========== */
/** Teto de pontos vindos de atividades por matéria (soma das notas ≤ isto). */
const SENAI_DISCIPLINE_CAP = 30;
const SENAI_ACTIVITY_POINTS = 30;
const SENAI_INFRINGEMENT_POINTS = 5;

function readCachedDisciplineGrades() {
    try {
        const t = localStorage.getItem('senaiDisciplineGradesJson');
        if (!t) return [];
        const j = JSON.parse(t);
        return Array.isArray(j) ? j : [];
    } catch {
        return [];
    }
}

function writeCachedDisciplineGrades(grades) {
    if (grades && Array.isArray(grades)) {
        localStorage.setItem('senaiDisciplineGradesJson', JSON.stringify(grades));
    }
}

function formatDisciplineGradesLine(grades) {
    if (!Array.isArray(grades) || grades.length === 0) {
        return '—';
    }
    return grades
        .map((g) => {
            const pend = g.pendingCount > 0 ? ` (${g.pendingCount} pend.)` : '';
            return `${g.discipline}: ${g.earnedDisplay}/${g.max}${pend}`;
        })
        .join(' · ');
}

/** @returns {Promise<string>} hex SHA-256, igual a api/lib.php senai_workspace_storage_key */
async function senaiWorkspaceStorageKey(path, pageTitle, inputId) {
    const p = String(path || '')
        .replace(/\\/g, '/')
        .trim()
        .toLowerCase();
    const t = String(pageTitle || '').trim();
    const id = String(inputId || '').trim();
    const s = `${p}\n${t}\n${id}`;
    if (!window.crypto || !crypto.subtle) {
        return null;
    }
    const buf = new TextEncoder().encode(s);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

function resolveActivityInputId(textarea) {
    if (textarea.id) return textarea.id;
    const dk = textarea.getAttribute('data-activity-key');
    if (dk) return dk;
    let slide = textarea.closest('.slide');
    if (!slide && textarea.classList.contains('side-view')) {
        slide =
            document.querySelector('.slide.active') || document.querySelector('.slide');
    }
    const slides = document.querySelectorAll('.slide');
    const si = slide ? Array.from(slides).indexOf(slide) : 0;
    const h2 = slide && slide.querySelector('h2');
    const t = h2 ? h2.innerText.trim().slice(0, 80) : 'slide';
    const slug = t
        .replace(/\s+/g, '_')
        .replace(/[^\w\u00C0-\u024F-]/g, '')
        .slice(0, 48);
    return `s${si}_${slug || 'atividade'}`;
}

function getActivityDisciplineTag() {
    try {
        const p = (window.location.pathname || '').replace(/\\/g, '/');
        if (p.includes('/Testes/')) return 'Testes';
        if (p.includes('/DesenvolvimentoDeSistemas/')) return 'DesenvolvimentoDeSistemas';
        if (p.includes('/PHP/')) return 'PHP';
        if (p.includes('/Java/')) return 'Java';
        if (p.includes('/Python/')) return 'Python';
        if (p.includes('/BancoDeDados/')) return 'BancoDeDados';
        if (p.includes('/IOT/')) return 'IoT';
    } catch (e) {
        /* ignore */
    }
    return 'Curso';
}

function getWorkspaceDescriptor(textarea) {
    const path = window.location.pathname || '';
    const pageTitle = document.title || '';
    const inputId = resolveActivityInputId(textarea);
    let slide = textarea.closest('.slide');
    if (!slide && textarea.classList.contains('side-view')) {
        slide =
            document.querySelector('.slide.active') || document.querySelector('.slide');
    }
    const h2 = slide && slide.querySelector('h2');
    const activityLabel = h2
        ? `${pageTitle} — ${h2.innerText.trim().slice(0, 160)}`
        : pageTitle;
    return {
        path,
        pageTitle,
        inputId,
        activityLabel,
        discipline: getActivityDisciplineTag()
    };
}

function ensureWorkspaceFeedbackEl(textarea) {
    let el = textarea.previousElementSibling;
    if (el && el.classList && el.classList.contains('senai-workspace-feedback')) return el;
    el = document.createElement('div');
    el.className = 'senai-workspace-feedback';
    el.style.cssText =
        'display:none;margin-bottom:10px;padding:12px 14px;background:#fff7ed;border-left:4px solid #ea580c;border-radius:6px;font-size:0.88rem;color:#9a3412;line-height:1.45;white-space:pre-wrap;';
    textarea.parentNode.insertBefore(el, textarea);
    return el;
}

function updateWorkspaceFeedback(textarea, ws) {
    const el = ensureWorkspaceFeedbackEl(textarea);
    const c = ws && ws.professorComment ? String(ws.professorComment).trim() : '';
    if (!c) {
        el.style.display = 'none';
        el.textContent = '';
        return;
    }
    el.style.display = 'block';
    const when = ws.professorCommentAt ? `\n(${ws.professorCommentAt})` : '';
    el.innerHTML = `<strong>Comentário do professor:</strong><br>${c.replace(/</g, '&lt;').replace(/>/g, '&gt;')}${when ? `<br><small style="opacity:.85">${when.replace(/</g, '&lt;')}</small>` : ''}`;
}

const senaiWorkspaceSaveTimers = new WeakMap();

async function saveActivityWorkspaceServer(textarea, code) {
    const mat = getStudentMatricula();
    const sid = getStudentSessionId();
    if (!mat || !sid) return;
    const d = getWorkspaceDescriptor(textarea);
    const k = await senaiWorkspaceStorageKey(d.path, d.pageTitle, d.inputId);
    if (!k) return;
    try {
        await senaiApiPost('student_workspace_save', {
            matricula: mat,
            sessionId: sid,
            path: d.path,
            pageTitle: d.pageTitle,
            inputId: d.inputId,
            activityLabel: d.activityLabel,
            discipline: d.discipline,
            code: code != null ? code : textarea.value
        });
    } catch (e) {
        console.warn('Salvar rascunho da atividade:', e.message);
    }
}

function scheduleActivityWorkspaceSave(textarea) {
    textarea.dataset.workspaceDirty = '1';
    const prev = senaiWorkspaceSaveTimers.get(textarea);
    if (prev) clearTimeout(prev);
    const t = setTimeout(() => {
        senaiWorkspaceSaveTimers.delete(textarea);
        saveActivityWorkspaceServer(textarea, textarea.value);
        textarea.dataset.workspaceDirty = '0';
    }, 2000);
    senaiWorkspaceSaveTimers.set(textarea, t);
}

async function senaiLoadAllActivityWorkspaces(applyCode) {
    const mat = getStudentMatricula();
    const sid = getStudentSessionId();
    if (!mat || !sid) return;
    const textareas = document.querySelectorAll('textarea.code-input');
    if (!textareas.length) return;
    const items = [];
    textareas.forEach((ta) => {
        const d = getWorkspaceDescriptor(ta);
        items.push({ path: d.path, pageTitle: d.pageTitle, inputId: d.inputId });
    });
    try {
        const j = await senaiApiPost('student_workspace_load_many', {
            matricula: mat,
            sessionId: sid,
            items
        });
        const map = j.workspaces || {};
        for (const ta of textareas) {
            const d = getWorkspaceDescriptor(ta);
            const k = await senaiWorkspaceStorageKey(d.path, d.pageTitle, d.inputId);
            if (!k) continue;
            const w = map[k];
            if (applyCode && w && typeof w.code === 'string' && w.code.length > 0) {
                if (ta.dataset.workspaceDirty !== '1' && document.activeElement !== ta) {
                    ta.value = w.code;
                } else if (!ta.value || ta.value.trim().length === 0) {
                    ta.value = w.code;
                }
            }
            if (w) updateWorkspaceFeedback(ta, w);
            else updateWorkspaceFeedback(ta, null);
        }
    } catch (e) {
        console.warn('Carregar rascunhos:', e.message);
    }
}

function initActivityWorkspacePersistence() {
    document.addEventListener(
        'input',
        (e) => {
            const t = e.target;
            if (!t || !t.classList || !t.classList.contains('code-input')) return;
            if (sessionStorage.getItem('masterMode') === 'true') return;
            scheduleActivityWorkspaceSave(t);
        },
        true
    );
    document.addEventListener(
        'blur',
        (e) => {
            const t = e.target;
            if (!t || !t.classList || !t.classList.contains('code-input')) return;
            const prev = senaiWorkspaceSaveTimers.get(t);
            if (prev) clearTimeout(prev);
            senaiWorkspaceSaveTimers.delete(t);
            if (getStudentMatricula() && getStudentSessionId()) {
                saveActivityWorkspaceServer(t, t.value);
                t.dataset.workspaceDirty = '0';
            }
        },
        true
    );
    window.addEventListener('beforeunload', () => {
        document.querySelectorAll('textarea.code-input').forEach((ta) => {
            if (ta.dataset.workspaceDirty === '1' && getStudentMatricula()) {
                saveActivityWorkspaceServer(ta, ta.value);
            }
        });
    });
    setInterval(() => {
        if (document.hidden) return;
        if (!getStudentMatricula() || !getStudentSessionId()) return;
        senaiLoadAllActivityWorkspaces(false);
    }, 50000);
}

function buildLoginGradesPanel(grades) {
    const wrap = document.createElement('div');
    wrap.className = 'senai-login-grades';
    wrap.style.cssText =
        'background:#ecfdf5;border-left:5px solid #059669;padding:12px;margin:12px 0;font-size:0.88rem;text-align:left;color:#065f46;';
    const t = document.createElement('strong');
    t.textContent = `Suas notas por matéria (máx. ${SENAI_DISCIPLINE_CAP} pts em cada):`;
    wrap.appendChild(t);
    if (!grades || !grades.length) {
        const p = document.createElement('p');
        p.style.margin = '8px 0 0';
        p.textContent =
            'Nenhuma atividade registrada ainda nesta conta. Ao enviar, cada aula vale até 30 ÷ N pontos após o professor avaliar.';
        wrap.appendChild(p);
        return wrap;
    }
    const ul = document.createElement('ul');
    ul.style.margin = '8px 0 0';
    ul.style.paddingLeft = '20px';
    grades.forEach((g) => {
        const li = document.createElement('li');
        let s = `${g.discipline}: ${g.earnedDisplay}/${g.max} pts`;
        if (g.pendingCount > 0) {
            s += ` (${g.pendingCount} envio(s) aguardando avaliação)`;
        }
        li.textContent = s;
        ul.appendChild(li);
    });
    wrap.appendChild(ul);
    return wrap;
}

/** Base da API PHP: pasta /api na raiz do site (json.php). */
function getSenaiApiBase() {
    try {
        const meta = document.querySelector('meta[name="senai-api-base"]');
        if (meta && meta.content && meta.content.trim()) {
            return meta.content.trim().replace(/\/$/, '');
        }
        if (window.__SENAI_API_BASE__) {
            return String(window.__SENAI_API_BASE__).replace(/\/$/, '');
        }
        const el = document.querySelector('script[src*="_Common/js/script.js"]');
        if (el && el.src) {
            const u = new URL(el.src);
            const rootPath = u.pathname.replace(/\/DesenvolvimentoDeSistemas\/_Common\/js\/script\.js$/i, '');
            return `${u.origin}${rootPath}/api`.replace(/\/$/, '');
        }
        const path = window.location.pathname.replace(/\/[^/]+$/, '');
        return `${window.location.origin}${path}/api`.replace(/\/$/, '');
    } catch {
        return `${window.location.origin}/api`.replace(/\/$/, '');
    }
}

/**
 * Uma única entrada PHP (json.php). action = nome da operação; demais campos no corpo.
 */
async function senaiApiPost(action, body) {
    const url = `${getSenaiApiBase()}/json.php`;
    const payload = { action, ...(body && typeof body === 'object' ? body : {}) };
    const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
    });
    const t = await r.text();
    let j;
    try {
        j = JSON.parse(t);
    } catch {
        j = null;
    }
    if (!r.ok) {
        throw new Error((j && j.error) || t || r.statusText);
    }
    return j;
}

function getStudentMatricula() {
    return (localStorage.getItem('studentMatricula') || '').trim();
}

function getStudentSessionId() {
    return localStorage.getItem('studentSessionId') || '';
}

let senaiHeartbeatTimer = null;

function ensureSenaiPointsBar() {
    let bar = document.getElementById('senai-points-bar');
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = 'senai-points-bar';
    bar.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:10003;background:linear-gradient(90deg,#004587,#0c4a6e);color:#fff;padding:8px 16px;font-size:0.88rem;font-family:Segoe UI,sans-serif;display:flex;justify-content:center;gap:20px;flex-wrap:wrap;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,.2);';
    document.body.prepend(bar);
    document.body.style.paddingTop = '48px';
    return bar;
}

function renderSenaiPointsBar(points, infLocal, disciplineGrades) {
    const bar = ensureSenaiPointsBar();
    const name = localStorage.getItem('studentName') || '';
    const mat = getStudentMatricula();
    const grades = disciplineGrades != null ? disciplineGrades : readCachedDisciplineGrades();
    const bySubject = formatDisciplineGradesLine(grades);
    const esc = (s) =>
        String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;');
    bar.innerHTML = `<span><strong>${esc(name)}</strong> · Mat. ${esc(mat)}</span>
        <span>Pontos totais: <strong>${esc(String(points))}</strong></span>
        <span>Infrações: <strong>${esc(String(infLocal))}</strong>/5</span>
        <span title="${esc(bySubject)}">Por matéria: ${esc(bySubject)}</span>
        <span style="opacity:.92;">Até ${SENAI_DISCIPLINE_CAP} pts/matéria (30÷N por aula, após avaliação) · Infração: −${SENAI_INFRINGEMENT_POINTS} pts</span>`;
}

async function senaiHeartbeatTick() {
    const mat = getStudentMatricula();
    const sid = getStudentSessionId();
    if (!mat || !sid) return;
    try {
        const j = await senaiApiPost('student_heartbeat', {
            matricula: mat,
            sessionId: sid,
            path: window.location.pathname,
            title: document.title
        });
        const pts = j.points ?? 0;
        localStorage.setItem('senaiPointsCache', String(pts));
        if (typeof j.infractionCount === 'number') {
            localStorage.setItem('infractionCount', String(j.infractionCount));
        }
        const infLocal = parseInt(localStorage.getItem('infractionCount') || '0', 10);
        if (Array.isArray(j.disciplineGrades)) {
            writeCachedDisciplineGrades(j.disciplineGrades);
        }
        renderSenaiPointsBar(pts, infLocal, j.disciplineGrades);
        window.dispatchEvent(
            new CustomEvent('senai-server-sync', {
                detail: {
                    infractionCount: j.infractionCount,
                    resetInfractionsLocal: j.resetInfractionsLocal === true
                }
            })
        );
        if (j.notices && j.notices.length) {
            showSenaiNotices(j.notices);
        }
    } catch (e) {
        console.warn('SENAI heartbeat:', e.message);
        const cached = parseInt(localStorage.getItem('senaiPointsCache') || '0', 10);
            renderSenaiPointsBar(
                cached,
                parseInt(localStorage.getItem('infractionCount') || '0', 10),
                readCachedDisciplineGrades()
            );
    }
}

/** @param {{ skipInitial?: boolean }} [opts] skipInitial: não dispara tick imediato (após await na carga da página). */
function startSenaiHeartbeat(opts) {
    if (senaiHeartbeatTimer) clearInterval(senaiHeartbeatTimer);
    if (!opts || !opts.skipInitial) {
        senaiHeartbeatTick();
    }
    senaiHeartbeatTimer = setInterval(senaiHeartbeatTick, 8000);
}

/**
 * Modal na página (substitui alert). Fica acima do overlay de bloqueio (z-index 9999).
 * @param {{ title?: string, message: string, variant?: 'info'|'warning'|'error'|'success', okLabel?: string, onClose?: () => void }} opts
 */
function showSenaiModal(opts) {
    const title = (opts && opts.title) || 'Aviso';
    const message = (opts && opts.message) || '';
    const variant = (opts && opts.variant) || 'info';
    const okLabel = (opts && opts.okLabel) || 'OK';
    const onClose = opts && opts.onClose;

    const accent =
        variant === 'warning'
            ? '#d97706'
            : variant === 'error'
              ? '#b91c1c'
              : variant === 'success'
                ? '#15803d'
                : '#004587';

    const overlay = document.createElement('div');
    overlay.className = 'senai-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'senai-modal-title');
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 10050;
        background: rgba(15, 23, 42, 0.55);
        display: flex; align-items: center; justify-content: center;
        padding: 20px; font-family: 'Segoe UI', system-ui, sans-serif;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
        background: #fff; border-radius: 12px; max-width: 520px; width: 100%;
        box-shadow: 0 20px 50px rgba(0,0,0,.25); overflow: hidden;
        border-top: 4px solid ${accent};
    `;

    const h = document.createElement('div');
    h.id = 'senai-modal-title';
    h.textContent = title;
    h.style.cssText =
        'padding: 18px 20px 8px; font-size: 1.2rem; font-weight: 700; color: #0f172a;';

    const body = document.createElement('div');
    body.textContent = message;
    body.style.cssText =
        'padding: 8px 20px 22px; font-size: 1rem; line-height: 1.55; color: #334155; white-space: pre-line; max-height: 60vh; overflow-y: auto;';

    const footer = document.createElement('div');
    footer.style.cssText =
        'padding: 12px 20px 18px; display: flex; justify-content: flex-end; gap: 10px; background: #f8fafc; border-top: 1px solid #e2e8f0;';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = okLabel;
    btn.style.cssText = `
        padding: 10px 22px; border: none; border-radius: 8px; cursor: pointer;
        font-weight: 600; font-size: 1rem; background: ${accent}; color: #fff;
    `;

    function tearDown() {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
        if (typeof onClose === 'function') onClose();
    }

    function onKey(e) {
        if (e.key === 'Escape') tearDown();
    }

    document.addEventListener('keydown', onKey);
    btn.addEventListener('click', tearDown);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) tearDown();
    });

    footer.appendChild(btn);
    box.appendChild(h);
    box.appendChild(body);
    box.appendChild(footer);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    btn.focus();
}

function showSenaiNotices(notices) {
    const mat = getStudentMatricula();
    const ids = notices.map((n) => n.id);
    const text = notices.map((n) => n.text).join('\n---\n');
    showSenaiModal({
        title: '📢 Aviso do professor',
        message: text,
        variant: 'info',
        okLabel: 'Entendi',
        onClose: () => {
            senaiApiPost('student_notices_read', { matricula: mat, ids }).catch(() => {});
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const studentName = localStorage.getItem('studentName');
    const matricula = getStudentMatricula();

    if (!studentName || !matricula) {
        showIdentificationModal();
    } else {
        console.log(`Aluno identificado: ${studentName} (${matricula})`);
        ensureSenaiPointsBar();
        renderSenaiPointsBar(
            parseInt(localStorage.getItem('senaiPointsCache') || '0', 10),
            parseInt(localStorage.getItem('infractionCount') || '0', 10),
            readCachedDisciplineGrades()
        );
        await senaiHeartbeatTick();
        startSenaiHeartbeat({ skipInitial: true });
        await senaiLoadAllActivityWorkspaces(true);
    }

    // 2. Slideshow Logic
    initSlideshow();

    // 3. Email Sending Logic
    initEmailSender();

    // 4. Focus Mode Logic (Screen Lock) — após 1º heartbeat para refletir “Zerar infrações” no servidor
    initFocusMode();

    // 5. Split Screen Textarea Logic
    initSplitScreenTextarea();

    // 6. Auto-Comment Activity Enunciado (antes de restaurar rascunhos do servidor)
    initAutoCommentActivity();

    // 6b. Rascunho JSON por atividade (api) + comentários do professor
    initActivityWorkspacePersistence();

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
    const old = document.querySelector('.modal-overlay.identificacao-aluno');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay identificacao-aluno';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 520px;">
            <h2>Identificação do Aluno</h2>
            <p><strong>Nome completo</strong> e <strong>matrícula</strong> são obrigatórios para iniciar.</p>
            <div style="background: #e0f2fe; color: #0369a1; padding: 12px; margin: 10px 0; border-left: 5px solid #0284c7; font-size: 0.9rem; text-align: left;">
                <strong>📊 Pontuação:</strong> em cada matéria você pode somar até <strong>${SENAI_DISCIPLINE_CAP} pontos</strong>.
                Cada <strong>atividade enviada</strong> pode render até <strong>30 ÷ N</strong> pontos (N = total de atividades da matéria), após o <strong>professor avaliar</strong> no painel.
                <strong>Infração</strong> (sair da tela etc.) desconta <strong>${SENAI_INFRINGEMENT_POINTS} pontos</strong> do total.
            </div>
            <div style="background: #fff3cd; color: #d97706; padding: 10px; margin: 10px 0; border-left: 5px solid #ffc107; font-size: 0.9rem; text-align: left;">
                <strong>⚠️ Modo foco:</strong>
                <ul style="margin: 5px 0 0 20px;">
                    <li>O sistema monitora se você sair da tela.</li>
                    <li>5 infrações bloqueiam a aula (desbloqueio: professor ou 30 min).</li>
                    <li>Use <strong>Dividir Tela</strong> para ler o slide enquanto digita a atividade.</li>
                </ul>
            </div>
            <label style="display:block;margin-top:10px;font-weight:600;">Nome completo</label>
            <input type="text" id="studentNameInput" placeholder="Seu nome completo" style="width:100%;padding:10px;margin-bottom:10px;box-sizing:border-box;">
            <label style="display:block;font-weight:600;">Matrícula</label>
            <input type="text" id="studentMatriculaInput" placeholder="Sua matrícula" style="width:100%;padding:10px;margin-bottom:10px;box-sizing:border-box;">
            <p id="identificacaoErro" style="color:#b91c1c;font-size:0.9rem;min-height:1.2em;"></p>
            <button id="saveNameBtn" disabled>Começar aula</button>
        </div>
    `;
    document.body.appendChild(modal);

    const inputName = document.getElementById('studentNameInput');
    const inputMat = document.getElementById('studentMatriculaInput');
    const btn = document.getElementById('saveNameBtn');
    const errEl = document.getElementById('identificacaoErro');

    function validateForm() {
        btn.disabled = inputName.value.trim().length < 3 || inputMat.value.trim().length < 2;
    }
    inputName.addEventListener('input', validateForm);
    inputMat.addEventListener('input', validateForm);

    btn.addEventListener('click', async () => {
        if (btn.dataset.phase === '2') {
            modal.remove();
            ensureSenaiPointsBar();
            renderSenaiPointsBar(
                parseInt(localStorage.getItem('senaiPointsCache') || '0', 10),
                parseInt(localStorage.getItem('infractionCount') || '0', 10),
                readCachedDisciplineGrades()
            );
            (async () => {
                await senaiHeartbeatTick();
                startSenaiHeartbeat({ skipInitial: true });
                await senaiLoadAllActivityWorkspaces(true);
            })();
            return;
        }
        const name = inputName.value.trim();
        const matricula = inputMat.value.trim();
        errEl.textContent = '';
        if (name.length < 3 || matricula.length < 2) return;
        btn.disabled = true;
        btn.textContent = 'Conectando...';
        try {
            const j = await senaiApiPost('student_session', { name, matricula });
            localStorage.setItem('studentName', name);
            localStorage.setItem('studentMatricula', matricula.trim().toUpperCase());
            localStorage.setItem('studentSessionId', j.sessionId);
            localStorage.setItem('infractionCount', String(j.infractionCount ?? 0));
            localStorage.setItem('senaiPointsCache', String(j.points ?? 0));
            if (Array.isArray(j.disciplineGrades)) {
                writeCachedDisciplineGrades(j.disciplineGrades);
            }
            const content = modal.querySelector('.modal-content');
            content.querySelector('.senai-login-grades')?.remove();
            content.insertBefore(buildLoginGradesPanel(j.disciplineGrades), errEl);
            inputName.disabled = true;
            inputMat.disabled = true;
            btn.disabled = false;
            btn.textContent = 'Continuar';
            btn.dataset.phase = '2';
        } catch (e) {
            errEl.textContent =
                'Não foi possível registrar a sessão. Verifique se a pasta api/ está no servidor PHP e se json.php responde, ou ajuste o meta senai-api-base. ' +
                (e.message || '');
            btn.disabled = false;
            btn.textContent = 'Começar aula';
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

    function slideshowKeyboardTargetIsEditable(target) {
        if (!target || !target.tagName) return false;
        const tag = target.tagName.toUpperCase();
        if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return true;
        if (target.isContentEditable) return true;
        return false;
    }

    document.addEventListener('keydown', (e) => {
        if (slideshowKeyboardTargetIsEditable(e.target)) return;
        const k = e.key;
        const goPrev = k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp';
        const goNext = k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ';
        if (!goPrev && !goNext) return;
        if (k === ' ' && e.target && e.target.tagName && e.target.tagName.toUpperCase() === 'BUTTON') return;
        e.preventDefault();
        checkAndEnforceFullscreen();
        showSlide(currentSlide + (goNext ? 1 : -1));
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
            
            // PHP / Banco: .code-input ou data-input-id no botão
            const container = btn.parentElement; // Usually inside a div
            const inputId = btn.getAttribute('data-input-id');
            let codeInput = inputId ? document.getElementById(inputId) : null;
            if (!codeInput && container) {
                codeInput = container.querySelector('.code-input');
            }
            
            // If not found in direct container (sibling logic)
            if (!codeInput) {
                 // 1. Try finding it in the previous sibling element (slide structure variation)
                 const prev = btn.previousElementSibling;
                 if (prev && prev.classList.contains('code-input')) {
                     codeInput = prev;
                 } else {
                     // 2. Try searching in the whole slide
                     const slide = btn.closest('.slide');
                     if (slide) {
                         // Try standard query inside slide
                         codeInput = slide.querySelector('.code-input');
                     }
                     
                     // 3. Fallback for Split Screen Mode
                     // If still not found, and we are in split screen mode, the textarea is in the body
                     if (!codeInput && document.body.classList.contains('split-screen-mode')) {
                         const sideViewInput = document.querySelector('.code-input.side-view');
                         if (sideViewInput) {
                             codeInput = sideViewInput;
                         }
                     }
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
            const activityTitleElement = slide && slide.querySelector('h2');
            const questionText = activityTitleElement ? activityTitleElement.innerText : 'Atividade';

            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '⏳ Enviando...';

            const disciplineTag = getActivityDisciplineTag();
            const activityLessonLabel = `${lessonTitle} — ${questionText}`.slice(0, 240);

            const formData = {
                _subject: `${disciplineTag} - ${lessonTitle} - ${studentName}`,
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
                    btn.innerHTML = '✅ Enviado!';
                    btn.style.backgroundColor = '#28a745';
                    try {
                        const mat = getStudentMatricula();
                        const sid = getStudentSessionId();
                        if (mat && sid) {
                            await saveActivityWorkspaceServer(codeInput, codeContent);
                            const d = getWorkspaceDescriptor(codeInput);
                            const workspaceKey = await senaiWorkspaceStorageKey(
                                d.path,
                                d.pageTitle,
                                d.inputId
                            );
                            const jAct = await senaiApiPost('student_activity', {
                                matricula: mat,
                                sessionId: sid,
                                lessonTitle: activityLessonLabel,
                                discipline: disciplineTag,
                                workspaceKey: workspaceKey || undefined
                            });
                            localStorage.setItem('senaiPointsCache', String(jAct.points));
                            if (Array.isArray(jAct.disciplineGrades)) {
                                writeCachedDisciplineGrades(jAct.disciplineGrades);
                            }
                            const maxP =
                                typeof jAct.maxPoints === 'number' ? jAct.maxPoints.toFixed(2) : '—';
                            showInlineMessage(
                                btn,
                                `✅ E-mail enviado e registro no painel. Esta aula: até <strong>${maxP}</strong> pts após o professor avaliar.`,
                                false
                            );
                            renderSenaiPointsBar(
                                jAct.points,
                                parseInt(localStorage.getItem('infractionCount') || '0', 10),
                                jAct.disciplineGrades
                            );
                        } else {
                            showInlineMessage(
                                btn,
                                '✅ Atividade enviada por e-mail. Identifique-se para pontuar no painel.',
                                false
                            );
                        }
                    } catch (e) {
                        console.warn('Registro de atividade no servidor:', e.message);
                        showInlineMessage(
                            btn,
                            '✅ E-mail enviado; não foi possível registrar no painel (verifique PHP/api).',
                            false
                        );
                    }
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
    const blockDurationMs = 30 * 60 * 1000;
    let lockInterval = null;

    function isExitAllowed() {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return false;
        return activeSlide.dataset.allowExit === 'true' || activeSlide.classList.contains('allow-exit');
    }

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
        <p id="lockCountdown" style="font-size: 1.2rem; margin-top: 10px;">Desbloqueio automático em 30:00</p>
        <div style="margin-top: 24px; max-width: 420px; width: 92%; text-align: left;">
            <p style="font-size: 1rem; margin-bottom: 8px; font-weight: bold;">Código de desbloqueio (painel do professor)</p>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                <input type="password" id="unlockPass" placeholder="Código do professor" autocomplete="off" style="flex: 1; min-width: 160px; padding: 12px; font-size: 1rem; border-radius: 5px; border: none;">
                <button type="button" id="unlockBtn" style="padding: 12px 20px; font-size: 1rem; cursor: pointer; background: white; color: red; border: none; font-weight: bold; border-radius: 5px;">Desbloquear</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    window.addEventListener('senai-server-sync', (ev) => {
        const d = ev.detail || {};
        if (typeof d.infractionCount === 'number') {
            infractionCount = d.infractionCount;
            localStorage.setItem('infractionCount', String(infractionCount));
        }
        if (d.resetInfractionsLocal === true) {
            localStorage.removeItem('blockStartAt');
            localStorage.removeItem('infractionLastAt');
        }
        if (isBlocked && infractionCount < maxInfractions) {
            isBlocked = false;
            overlay.style.display = 'none';
            if (lockInterval) {
                clearInterval(lockInterval);
                lockInterval = null;
            }
            localStorage.removeItem('blockStartAt');
            localStorage.removeItem('infractionLastAt');
        }
    });

    const unlockBtn = document.getElementById('unlockBtn');
    const unlockPass = document.getElementById('unlockPass');
    if (unlockPass && unlockBtn) {
        unlockPass.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                unlockBtn.click();
            }
        });
    }

    function fmtTime(ms) {
        let s = Math.max(0, Math.floor(ms / 1000));
        const m = Math.floor(s / 60);
        const ss = s % 60;
        return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    }

    function autoResetBlock() {
        isBlocked = false;
        infractionCount = 0;
        localStorage.setItem('infractionCount', '0');
        localStorage.removeItem('infractionLastAt');
        localStorage.removeItem('blockStartAt');
        overlay.style.display = 'none';
        if (lockInterval) {
            clearInterval(lockInterval);
            lockInterval = null;
        }
        localStorage.removeItem('studentName');
        localStorage.removeItem('studentMatricula');
        localStorage.removeItem('studentSessionId');
        localStorage.removeItem('senaiPointsCache');
        if (senaiHeartbeatTimer) {
            clearInterval(senaiHeartbeatTimer);
            senaiHeartbeatTimer = null;
        }
        showIdentificationModal();
    }

    function startLockCountdown(existingStart) {
        const startAt = existingStart && existingStart > 0 ? existingStart : Date.now();
        localStorage.setItem('blockStartAt', String(startAt));
        const countdownEl = document.getElementById('lockCountdown');
        if (lockInterval) clearInterval(lockInterval);
        lockInterval = setInterval(() => {
            const elapsed = Date.now() - startAt;
            const remaining = blockDurationMs - elapsed;
            if (countdownEl) countdownEl.textContent = `Desbloqueio automático em ${fmtTime(remaining)}`;
            if (remaining <= 0) {
                autoResetBlock();
            }
        }, 1000);
    }

    // Check if already blocked from previous session
    if (infractionCount >= maxInfractions) {
        isBlocked = true;
        overlay.style.display = 'flex';
        const storedBlockStart = parseInt(localStorage.getItem('blockStartAt') || '0');
        startLockCountdown(storedBlockStart);
    }

    function finishUnlockSuccess() {
        isBlocked = false;
        infractionCount = 0;
        localStorage.setItem('infractionCount', '0');
        localStorage.removeItem('infractionLastAt');
        localStorage.removeItem('blockStartAt');
        overlay.style.display = 'none';
        if (unlockPass) unlockPass.value = '';
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
        if (lockInterval) {
            clearInterval(lockInterval);
            lockInterval = null;
        }
    }

    unlockBtn.addEventListener('click', async () => {
        const passInput = unlockPass;
        const pass = passInput.value;
        let apiOk = false;
        try {
            const r = await senaiApiPost('student_unlock', { code: pass });
            apiOk = r && r.ok === true;
        } catch {
            apiOk = false;
        }
        if (apiOk) {
            finishUnlockSuccess();
            return;
        }
        if (pass === 'Juli@no') {
            isBlocked = false;
            sessionStorage.setItem('masterMode', 'true');
            finishUnlockSuccess();
            showToast('🔓 Modo demonstração (professor): sem restrições nesta sessão.');
            return;
        }
        showSenaiModal({
            title: 'Código inválido',
            message:
                'Código incorreto ou servidor indisponível. Peça o código ao professor ou aguarde o desbloqueio automático.',
            variant: 'error',
            okLabel: 'Fechar'
        });
        passInput.value = '';
    });

    // Detect Tab Switch / Minimize
    document.addEventListener('visibilitychange', () => {
        if (sessionStorage.getItem('masterMode') === 'true') return;

        if (document.hidden && !isBlocked) {
            if (isExitAllowed()) return;
            handleInfraction("Troca de aba ou minimização");
        } else if (!document.hidden && !isBlocked) {
            // User came back. Check fullscreen.
            // Wait a bit to check if reload is pending or just normal switching
            setTimeout(() => {
                if (isExitAllowed()) return;
                if (!document.fullscreenElement) {
                    forceFullscreenReentry();
                }
            }, 200);
        }
    });

    let isSystemAlert = false; // Flag to ignore blur events caused by system alerts

    function handleInfraction(reason) {
        if (sessionStorage.getItem('masterMode') === 'true') return;
        if (isExitAllowed()) return;

        const mat = getStudentMatricula();
        const sid = getStudentSessionId();
        const doLocal = () => {
            infractionCount++;
            localStorage.setItem('infractionCount', String(infractionCount));
            localStorage.setItem('infractionLastAt', String(Date.now()));
            const remaining = maxInfractions - infractionCount;

            if (infractionCount >= maxInfractions) {
                isBlocked = true;
                overlay.style.display = 'flex';
                startLockCountdown(Date.now());
                const audio = new AudioContext();
                const osc = audio.createOscillator();
                osc.connect(audio.destination);
                osc.frequency.value = 500;
                osc.start();
                setTimeout(() => osc.stop(), 1000);
            } else {
                isSystemAlert = true;
                showSenaiModal({
                    title: `⚠️ Atenção, ${studentName}`,
                    message: `Infração registrada.\nMotivo: ${reason}\nInfrações: ${infractionCount}/${maxInfractions}\n\nForam descontados ${SENAI_INFRINGEMENT_POINTS} pontos (total atualizado no servidor quando online).\n\nNão saia da tela até finalizar a aula.`,
                    variant: 'warning',
                    onClose: () => {
                        setTimeout(() => {
                            isSystemAlert = false;
                        }, 500);
                    }
                });
            }
        };

        if (mat && sid) {
            senaiApiPost('student_infraction', { matricula: mat, sessionId: sid, reason })
                .then((j) => {
                    infractionCount = j.infractionCount;
                    localStorage.setItem('infractionCount', String(infractionCount));
                    localStorage.setItem('senaiPointsCache', String(j.points));
                    if (Array.isArray(j.disciplineGrades)) {
                        writeCachedDisciplineGrades(j.disciplineGrades);
                    }
                    renderSenaiPointsBar(j.points, infractionCount, j.disciplineGrades);
                    const remaining = maxInfractions - infractionCount;
                    if (infractionCount >= maxInfractions) {
                        isBlocked = true;
                        overlay.style.display = 'flex';
                        startLockCountdown(Date.now());
                        const audio = new AudioContext();
                        const osc = audio.createOscillator();
                        osc.connect(audio.destination);
                        osc.frequency.value = 500;
                        osc.start();
                        setTimeout(() => osc.stop(), 1000);
                    } else {
                        isSystemAlert = true;
                        showSenaiModal({
                            title: `⚠️ Atenção, ${studentName}`,
                            message: `Infração registrada.\nMotivo: ${reason}\nInfrações: ${infractionCount}/${maxInfractions}\nPontos descontados: ${j.lostPoints || SENAI_INFRINGEMENT_POINTS}. Saldo: ${j.points} pts.`,
                            variant: 'warning',
                            onClose: () => {
                                setTimeout(() => {
                                    isSystemAlert = false;
                                }, 500);
                            }
                        });
                    }
                })
                .catch(() => {
                    doLocal();
                });
        } else {
            doLocal();
        }
    }

    // Detect Window Blur (losing focus to another app)
    window.addEventListener('blur', () => {
        if (sessionStorage.getItem('masterMode') === 'true') return;

        if (!isBlocked && !isSystemAlert) {
            if (isExitAllowed()) return;
            // Check if document is hidden (to avoid double counting with visibilitychange)
            if (!document.hidden) {
                handleInfraction("Perda de foco da janela");
            }
        }
    });

    // Detect Exit Fullscreen
    document.addEventListener('fullscreenchange', () => {
        if (sessionStorage.getItem('masterMode') === 'true') return;

        if (isExitAllowed()) return;
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
                showSenaiModal({
                    title: 'Tela dividida',
                    message: 'Você já está no modo de tela dividida.',
                    variant: 'info'
                });
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
                // Clear ALL storage types
                localStorage.clear(); 
                sessionStorage.clear(); // This is crucial for masterMode removal
                
                // Explicitly remove known keys just in case
                sessionStorage.removeItem('masterMode'); 
                localStorage.removeItem('infractionCount');
                localStorage.removeItem('studentName');
                localStorage.removeItem('studentMatricula');
                localStorage.removeItem('studentSessionId');
                localStorage.removeItem('senaiPointsCache');
                if (senaiHeartbeatTimer) {
                    clearInterval(senaiHeartbeatTimer);
                    senaiHeartbeatTimer = null;
                }

                showSenaiModal({
                    title: 'Aula finalizada',
                    message: 'Dados locais foram apagados. A página será recarregada.',
                    variant: 'success',
                    okLabel: 'Recarregar',
                    onClose: () => {
                        location.reload();
                    }
                }); 
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
