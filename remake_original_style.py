
import os
import pypdf
import re

pdf_path = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\java-swing-2nbsped-9780596004088_compress.pdf"
output_dir = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java"

chapter_starts = {
    4: 111, 5: 125, 6: 157, 7: 183, 8: 249, 9: 283, 
    10: 311, 11: 339, 12: 391, 13: 431, 14: 457, 15: 513
}

lessons_map = {
    4: ("04_labels_icons.html", "Aula 04: Labels e Ícones", "JLabel, Icon, ImageIcon"),
    5: ("05_botoes.html", "Aula 05: Botões", "JButton, JToggleButton, JCheckBox, JRadioButton"),
    6: ("06_bounded_range.html", "Aula 06: Componentes de Intervalo", "JScrollBar, JSlider, JProgressBar"),
    7: ("07_listas_combos.html", "Aula 07: Listas e Combos", "JList, JComboBox, JSpinner"),
    8: ("08_containers.html", "Aula 08: Containers Swing", "JPanel, JSplitPane, JTabbedPane"),
    9: ("09_internal_frames.html", "Aula 09: Janelas Internas", "JInternalFrame, JDesktopPane"),
    10: ("10_dialogos.html", "Aula 10: Diálogos", "JOptionPane, JDialog"),
    11: ("11_paineis_especiais.html", "Aula 11: Painéis Especiais", "JScrollPane, JViewport"),
    12: ("12_layouts.html", "Aula 12: Gerenciadores de Layout", "FlowLayout, BorderLayout, GridLayout"),
    13: ("13_choosers.html", "Aula 13: Seletores", "JFileChooser, JColorChooser"),
    14: ("14_bordas.html", "Aula 14: Bordas", "BorderFactory, TitledBorder"),
    15: ("15_menus.html", "Aula 15: Menus", "JMenuBar, JMenu, JMenuItem, JPopupMenu")
}

def clean_text(text):
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        if "Title of the Book" in line or "Copyright" in line or "Chapter" in line and len(line) < 20: continue
        if line.strip().isdigit(): continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)

def extract_key_concepts(text):
    # This function extracts short concepts to fit in the "Grid Layout" style of Lesson 01
    concepts = []
    
    # Try to find Definitions (sentences starting with "A ... is" or "The ... component")
    definitions = re.findall(r'([A-Z][a-zA-Z\s]+)\s+(is a|provides|allows)\s+([^.]+\.)', text)
    
    for term, verb, desc in definitions[:4]: # Limit to 4 concepts
        if len(desc) < 150:
            concepts.append({"title": term.strip(), "desc": f"{term} {verb} {desc}"})
            
    # Fallback if regex fails (common in PDF text extraction)
    if not concepts:
        paragraphs = text.split('\n\n')
        for p in paragraphs:
            p = p.strip()
            if len(p) > 50 and len(p) < 200 and p[0].isupper():
                 concepts.append({"title": "Conceito", "desc": p})
                 if len(concepts) >= 4: break
                 
    return concepts

def generate_lesson_html(ch_num, filename, title, subtitle, raw_text):
    concepts = extract_key_concepts(raw_text)
    
    # If extraction failed completely, add generic placeholders to match style
    if len(concepts) < 2:
        concepts = [
            {"title": "Definição", "desc": f"Neste capítulo exploramos {subtitle}."},
            {"title": "Uso Prático", "desc": "Estes componentes são essenciais para interfaces ricas."}
        ]

    # Generate Grid Items HTML
    grid_html = ""
    for c in concepts:
        grid_html += f"""
                <div class="grid-item">
                    <h3>{c['title']}</h3>
                    <p>{c['desc']}</p>
                </div>"""

    # Validation Rules
    keywords = subtitle.split(',')
    rules_js = ""
    for i, kw in enumerate(keywords):
        kw = kw.strip()
        rules_js += f"                {{ id: 'rule{i}', text: 'Utilizar {kw}', pattern: /{kw}/i }},\n"
    rules_js += "                { id: 'main', text: 'Método main', pattern: /public\\s+static\\s+void\\s+main/ }"

    html = f"""<!DOCTYPE html>
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
                <h1 style="color: white;">Aula {filename[:2]}</h1>
            </div>
            <div style="background: #eee; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
                <p><strong>Referência:</strong> Capítulo {ch_num} do Livro</p>
                <p>Foco: {subtitle}</p>
            </div>
        </div>

        <!-- Slide 2: Conceitos Chave (Grid Layout - Estilo Aula 01) -->
        <div class="slide">
            <h2>Conceitos Fundamentais</h2>
            <div class="grid-layout">
                {grid_html}
            </div>
        </div>

        <!-- Slide 3: Detalhes Técnicos -->
        <div class="slide">
            <h2>Detalhes Técnicos</h2>
            <p>Para utilizar {subtitle}, lembre-se:</p>
            <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-top: 20px;">
                <ul style="line-height: 2; font-size: 1.1rem;">
                    <li>Importe sempre <code>javax.swing.*</code> e <code>java.awt.*</code>.</li>
                    <li>Adicione os componentes ao container (JFrame ou JPanel).</li>
                    <li>Configure propriedades como texto, ícone e tamanho.</li>
                    <li>Trate eventos se necessário (ActionListener).</li>
                </ul>
            </div>
        </div>

        <!-- Slide 4: Atividade Prática -->
        <div class="slide">
            <h2>Atividade Prática</h2>
            <p>Realize a tarefa abaixo:</p>
            
            <textarea id="activity-{filename[:2]}" class="code-input">
/*
 * ATIVIDADE PRÁTICA - AULA {filename[:2]}
 * 
 * Objetivo: Criar uma interface utilizando {subtitle}.
 * 
 * 1. Crie uma classe que estenda JFrame.
 * 2. No construtor, configure título e tamanho.
 * 3. Instancie e adicione: {subtitle}.
 * 4. Torne a janela visível no main.
 */

import javax.swing.*;
import java.awt.*;

public class Atividade{filename[:2]} {{
    public static void main(String[] args) {{
        // Seu código aqui...
    }}
}}
            </textarea>
            <button class="send-btn">Enviar Resposta</button>
        </div>

        <!-- Slide Final: Conclusão -->
        <div class="slide">
            <h2>Parabéns! Você concluiu esta aula.</h2>
            <p>Você praticou o uso de {subtitle}.</p>
            <div style="margin-top: 50px; text-align: center;">
                <button id="finishLessonBtn" class="btn-start" style="font-size: 1.5rem; padding: 15px 30px; background-color: #28a745;">✅ Finalizar Aula</button>
            </div>
        </div>

    </div>

    <!-- Controles de Navegação -->
    <div class="controls">
        <button id="btnPrev" disabled>Anterior</button>
        <span id="slideNumber">1 / 5</span>
        <button id="btnNext">Próximo</button>
    </div>

    <!-- Scripts -->
    <script src="assets/js/script.js"></script>
    <script>
        window.activityRules = {{
            'activity-{filename[:2]}': [
{rules_js}
            ]
        }};
    </script>
</body>
</html>
"""
    return html

try:
    reader = pypdf.PdfReader(pdf_path)
    
    for ch_num, (filename, title, subtitle) in lessons_map.items():
        print(f"Recriando Aula (Estilo Original): {filename}...")
        
        start_page = chapter_starts.get(ch_num)
        if not start_page: continue
        
        # Read just enough to get some context for the grid
        raw_text = ""
        end_page = min(start_page + 6, len(reader.pages))
        
        for i in range(start_page, end_page):
            raw_text += reader.pages[i].extract_text() + "\n\n"
            
        cleaned_text = clean_text(raw_text)
        
        html_content = generate_lesson_html(ch_num, filename, title, subtitle, cleaned_text)
        
        with open(os.path.join(output_dir, filename), "w", encoding="utf-8") as f:
            f.write(html_content)
            
    print("Sucesso! Aulas 04-15 recriadas com o template visual exato das aulas 01-03.")

except Exception as e:
    print(f"Erro Crítico: {e}")
