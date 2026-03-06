
import os

lessons = [
    ("04_labels_icons.html", "Aula 04: Labels e Ícones", "Baseado no Capítulo 4"),
    ("05_botoes.html", "Aula 05: Botões", "Baseado no Capítulo 5"),
    ("06_bounded_range.html", "Aula 06: Componentes de Intervalo", "Baseado no Capítulo 6"),
    ("07_listas_combos.html", "Aula 07: Listas e Combos", "Baseado no Capítulo 7"),
    ("08_containers.html", "Aula 08: Containers Swing", "Baseado no Capítulo 8"),
    ("09_internal_frames.html", "Aula 09: Janelas Internas", "Baseado no Capítulo 9"),
    ("10_dialogos.html", "Aula 10: Diálogos", "Baseado no Capítulo 10"),
    ("11_paineis_especiais.html", "Aula 11: Painéis Especiais", "Baseado no Capítulo 11"),
    ("12_layouts.html", "Aula 12: Gerenciadores de Layout", "Baseado no Capítulo 11/12"),
    ("13_choosers.html", "Aula 13: Seletores", "Baseado no Capítulo 12"),
    ("14_bordas.html", "Aula 14: Bordas", "Baseado no Capítulo 13"),
    ("15_menus.html", "Aula 15: Menus e Barras de Ferramentas", "Baseado no Capítulo 14")
]

template = """<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <!-- Logo SENAI -->
    <img src="logo_senai.png" alt="Logo SENAI" class="senai-logo">

    <div class="progress-bar" id="progressBar"></div>

    <div class="slide-container">
        
        <!-- Slide 1: Capa -->
        <div class="slide active">
            <h1>{title}</h1>
            <h2>{subtitle}</h2>
            <div style="width: 100%; height: 300px; background: #004587; display: flex; justify-content: center; align-items: center; color: white; border-radius: 10px; margin-top: 20px;">
                <h1 style="color: white;">Em Desenvolvimento</h1>
            </div>
            <div style="background: #eee; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
                <p><strong>Status:</strong> Conteúdo sendo traduzido do livro.</p>
                <p>Aguarde as próximas atualizações.</p>
            </div>
        </div>

    </div>

    <!-- Controles de Navegação -->
    <div class="controls">
        <button id="btnPrev" disabled>Anterior</button>
        <span id="slideNumber">1 / 1</span>
        <button id="btnNext" disabled>Próximo</button>
    </div>

    <!-- Scripts -->
    <script src="assets/js/script.js"></script>
</body>
</html>
"""

output_dir = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java"

for filename, title, subtitle in lessons:
    content = template.format(title=title, subtitle=subtitle)
    with open(os.path.join(output_dir, filename), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created {filename}")
