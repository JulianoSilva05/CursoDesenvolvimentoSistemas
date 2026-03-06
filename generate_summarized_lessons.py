
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

def extract_topics(text):
    # Try to find headers and key paragraphs to create slide-like content
    # Heuristic: Uppercase lines or lines ending with colon are potential headers
    paragraphs = text.split('\n\n')
    slides_content = []
    
    current_slide = {"title": "Introdução", "content": []}
    
    for p in paragraphs:
        p = p.strip()
        if not p: continue
        
        # If it looks like a code block
        if (p.startswith("    ") or "public class" in p or "import " in p) and len(p) > 30:
            current_slide["content"].append(f'<div class="code-block">{p}</div>')
            continue

        # If it looks like a header (short, capitalized)
        if len(p) < 60 and not p.endswith('.') and p[0].isupper() and len(p) > 5:
            # Save previous slide if it has content
            if current_slide["content"]:
                slides_content.append(current_slide)
            
            # Start new slide topic
            current_slide = {"title": p, "content": []}
        else:
            # Regular text, split huge paragraphs
            if len(p) > 300:
                p = p[:300] + "..."
            current_slide["content"].append(f'<p>{p}</p>')
    
    if current_slide["content"]:
        slides_content.append(current_slide)
        
    return slides_content[:5] # Limit to 5 topic slides to keep it digestible

def generate_lesson_html(ch_num, filename, title, subtitle, raw_text):
    topics = extract_topics(raw_text)
    
    # Generate Topic Slides HTML
    slides_html = ""
    for topic in topics:
        slide_content = "\n".join(topic["content"])
        slides_html += f"""
        <div class="slide">
            <h2>{topic['title']}</h2>
            <div class="content-scroll">
                {slide_content}
            </div>
        </div>
        """

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
    <style>
        .content-scroll {{
            max-height: 60vh;
            overflow-y: auto;
            text-align: justify;
            padding-right: 10px;
        }}
        .code-block {{
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            white-space: pre-wrap;
            margin: 10px 0;
            font-size: 0.9rem;
        }}
    </style>
</head>
<body>
    <img src="logo_senai.png" alt="Logo SENAI" class="senai-logo">
    <div class="progress-bar" id="progressBar"></div>

    <div class="slide-container">
        
        <!-- Slide 1: Capa -->
        <div class="slide active">
            <h1>{title}</h1>
            <h2>{subtitle}</h2>
            <div style="width: 100%; height: 250px; background: #004587; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; border-radius: 10px; margin-top: 20px;">
                <h1 style="color: white; font-size: 4rem;">Capítulo {ch_num}</h1>
                <p style="font-size: 1.2rem; margin-top: 10px;">Java Swing 2nd Edition</p>
            </div>
        </div>

        {slides_html}

        <!-- Slide Final: Atividade -->
        <div class="slide">
            <h2>Atividade Prática</h2>
            <div style="background: #fff3cd; padding: 15px; border-left: 5px solid #ffc107; margin-bottom: 15px;">
                <strong>Desafio:</strong> Crie uma aplicação completa usando: <em>{subtitle}</em>.
            </div>

            <textarea id="activity-{filename[:2]}" class="code-input">
/*
 * ATIVIDADE PRÁTICA - AULA {filename[:2]}
 * 
 * Objetivo: Implementar uma janela usando {subtitle}.
 * 
 * Passos:
 * 1. Configure o JFrame.
 * 2. Instancie os componentes citados.
 * 3. Adicione-os à tela.
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

        <div class="slide">
            <h2>Aula Concluída!</h2>
            <div style="margin-top: 50px; text-align: center;">
                <button id="finishLessonBtn" class="btn-start" style="font-size: 1.5rem; padding: 15px 30px; background-color: #28a745;">✅ Finalizar Aula</button>
            </div>
        </div>

    </div>

    <div class="controls">
        <button id="btnPrev" disabled>Anterior</button>
        <span id="slideNumber">1 / {len(topics) + 3}</span>
        <button id="btnNext">Próximo</button>
    </div>

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
        print(f"Gerando Aula Didática: {filename}...")
        
        start_page = chapter_starts.get(ch_num)
        if not start_page: continue
        
        # Read 10 pages for content extraction
        raw_text = ""
        end_page = min(start_page + 10, len(reader.pages))
        
        for i in range(start_page, end_page):
            raw_text += reader.pages[i].extract_text() + "\n\n"
            
        cleaned_text = clean_text(raw_text)
        
        html_content = generate_lesson_html(ch_num, filename, title, subtitle, cleaned_text)
        
        with open(os.path.join(output_dir, filename), "w", encoding="utf-8") as f:
            f.write(html_content)
            
    print("Sucesso! Aulas geradas com formato de slides explicativos.")

except Exception as e:
    print(f"Erro Crítico: {e}")
