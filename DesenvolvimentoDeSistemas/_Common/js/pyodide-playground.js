/**
 * Laboratório Python no navegador (Pyodide — WebAssembly).
 * Não usa API externa: o código roda localmente no computador do aluno.
 *
 * Marque um container com .senai-py-playground e use:
 *   .py-stdin   — uma linha por cada input() do programa
 *   .py-editor  — código (pode ter também .code-input para rascunho no servidor)
 *   .py-run-btn — executar
 *   .py-output  — saída (stdout/stderr)
 *   .py-status  — opcional: status de carregamento
 * Opcional: .py-verify-btn com data-stdin="a\\nb" data-expect="texto1||texto2"
 */
(function () {
    'use strict';

    var pyodidePromise = null;

    function getPyodide() {
        if (typeof loadPyodide !== 'function') {
            return Promise.reject(
                new Error('Pyodide não carregou. Verifique a internet e recarregue a página.')
            );
        }
        if (!pyodidePromise) {
            pyodidePromise = loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
            });
        }
        return pyodidePromise;
    }

    function ensurePlaygroundId(root) {
        if (!root.id) {
            root.id = 'senai-py-lab-' + Math.random().toString(36).slice(2, 11);
        }
        return root.id;
    }

    /**
     * Com «Dividir tela», o .py-editor é movido para document.body e deixa de ser
     * descendente de .senai-py-playground — localizamos pelo data-senai-py-lab.
     */
    function resolvePyEditor(root) {
        var inside = root.querySelector('.py-editor');
        if (inside) {
            return inside;
        }
        var pid = root.id;
        if (!pid) {
            return null;
        }
        return document.querySelector('.py-editor[data-senai-py-lab="' + pid + '"]');
    }

    /**
     * @param {HTMLElement} root
     * @param {{ stdinOverride?: string }} [opts]
     */
    async function runPlayground(root, opts) {
        var editor = resolvePyEditor(root);
        var stdinEl = root.querySelector('.py-stdin');
        var outEl = root.querySelector('.py-output');
        var statusEl = root.querySelector('.py-status');
        var code = editor ? editor.value : '';
        var stdinText =
            opts && typeof opts.stdinOverride === 'string' ? opts.stdinOverride : stdinEl ? stdinEl.value : '';
        var lines = stdinText.split(/\r?\n/);
        while (lines.length && lines[0].trim() === '') {
            lines.shift();
        }
        while (lines.length && lines[lines.length - 1].trim() === '') {
            lines.pop();
        }

        if (outEl) outEl.textContent = '';
        if (statusEl) statusEl.textContent = 'Preparando Python…';

        var stdout = '';
        try {
            var pyodide = await getPyodide();

            pyodide.setStdout({
                batched: function (s) {
                    stdout += s;
                }
            });
            pyodide.setStderr({
                batched: function (s) {
                    stdout += s;
                }
            });

            pyodide.globals.set('_senai_stdin_lines', pyodide.toPy(lines));

            await pyodide.runPythonAsync(
                'import builtins\n' +
                    '_lines = list(_senai_stdin_lines)\n' +
                    'def _senai_input(prompt=""):\n' +
                    '    if prompt:\n' +
                    '        print(prompt, end="")\n' +
                    '    if not _lines:\n' +
                    '        raise EOFError("Sem mais linhas no campo «Entrada simulada». Coloque uma linha para cada input().")\n' +
                    '    return _lines.pop(0)\n' +
                    'builtins.input = _senai_input\n'
            );

            if (statusEl) statusEl.textContent = 'Executando…';
            await pyodide.runPythonAsync(code);
            try {
                await pyodide.runPythonAsync(
                    'import sys\n' +
                        '_o = getattr(sys.stdout, "flush", None)\n' +
                        'if callable(_o):\n' +
                        '    _o()\n'
                );
            } catch {
                /* ignore */
            }

            if (outEl) {
                outEl.textContent = stdout.trim() ? stdout : '(sem saída no console)';
            }
            if (statusEl) statusEl.textContent = 'Concluído.';
            return { ok: true, stdout: stdout };
        } catch (e) {
            var msg = e && e.message ? String(e.message) : String(e);
            if (outEl) {
                outEl.textContent =
                    (outEl.textContent || '').trim() +
                    (outEl.textContent ? '\n\n' : '') +
                    '— Erro —\n' +
                    msg;
            }
            if (statusEl) statusEl.textContent = 'Erro na execução.';
            return { ok: false, stdout: stdout, error: msg };
        }
    }

    function normalizeVerificationText(s) {
        return String(s || '')
            .replace(/\u00a0/g, ' ')
            .replace(/\u2003|\u2002|\u2009/g, ' ')
            .replace(/\r\n/g, '\n')
            .trim();
    }

    function wireVerify(root, vbtn) {
        vbtn.addEventListener('click', async function () {
            var stdin = vbtn.getAttribute('data-stdin') || '';
            stdin = stdin.replace(/\\n/g, '\n');
            var expectRaw = vbtn.getAttribute('data-expect') || '';
            var expects = expectRaw
                .split('||')
                .map(function (s) {
                    return s.trim();
                })
                .filter(Boolean);
            var stdinEl = root.querySelector('.py-stdin');
            var prevStdin = stdinEl ? stdinEl.value : '';
            if (stdinEl && stdin) stdinEl.value = stdin;

            var result = await runPlayground(root, stdin ? { stdinOverride: stdin } : undefined);

            if (stdinEl) stdinEl.value = prevStdin;

            var out = normalizeVerificationText(result.stdout || '');
            var feedback = root.querySelector('.py-verify-feedback');
            if (!feedback) {
                feedback = document.createElement('p');
                feedback.className = 'py-verify-feedback';
                feedback.style.cssText =
                    'margin-top:10px;padding:10px 12px;border-radius:8px;font-size:1rem;font-weight:600;';
                vbtn.parentNode.insertBefore(feedback, vbtn.nextSibling);
            }

            if (!result.ok) {
                feedback.style.background = '#fef2f2';
                feedback.style.color = '#b91c1c';
                feedback.style.borderLeft = '4px solid #ef4444';
                var errTail = out ? ' Saída parcial: ' + (out.length > 200 ? out.slice(0, 200) + '…' : out) : '';
                feedback.textContent =
                    'Erro na execução: ' +
                    (result.error || 'desconhecido') +
                    '.' +
                    errTail +
                    ' Corrija o código e tente de novo.';
                return;
            }

            function outMeetsExpectation(ex) {
                if (out.indexOf(ex) !== -1) {
                    return true;
                }
                if (ex === 'Total: 200') {
                    return /Total\s*:\s*200(?:\.0)?(?!\d)/i.test(out);
                }
                if (ex === 'Produto cadastrado com sucesso') {
                    return /Produto\s+cadastrado\s+com\s+sucesso/i.test(out);
                }
                return false;
            }

            var missing = expects.filter(function (ex) {
                return !outMeetsExpectation(ex);
            });

            if (missing.length === 0) {
                feedback.style.background = '#ecfdf5';
                feedback.style.color = '#047857';
                feedback.style.borderLeft = '4px solid #10b981';
                feedback.textContent =
                    'Verificação automática: a saída contém os trechos esperados. (Ainda assim, revise todos os casos da tabela.)';
            } else {
                feedback.style.background = '#fffbeb';
                feedback.style.color = '#b45309';
                feedback.style.borderLeft = '4px solid #f59e0b';
                var snip = out.length > 220 ? out.slice(0, 220) + '…' : out;
                feedback.textContent =
                    'A saída ainda não contém: ' +
                    missing.map(function (m) {
                        return '"' + m + '"';
                    }).join(', ') +
                    '. Trecho obtido: ' +
                    (snip || '(vazio)') +
                    ' — Confira se não há aspas “curvas” ou texto diferente nas linhas finais.';
            }
        });
    }

    function init(root) {
        var labId = ensurePlaygroundId(root);
        var ed = root.querySelector('.py-editor');
        if (ed) {
            ed.setAttribute('data-senai-py-lab', labId);
        }

        var runBtn = root.querySelector('.py-run-btn');
        if (runBtn) {
            runBtn.addEventListener('click', function () {
                runPlayground(root, {});
            });
        }
        root.querySelectorAll('.py-verify-btn').forEach(function (vb) {
            wireVerify(root, vb);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.senai-py-playground').forEach(init);
    });
})();
