
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

def extract_structured_content(text):
    # This function aims to extract structured blocks: Header -> Paragraphs -> Code
    # It tries to find the most relevant sections to avoid just dumping text.
    
    blocks = []
    current_block = {"title": "Conceitos Básicos", "text": [], "code": []}
    
    paragraphs = text.split('\n\n')
    
    for p in paragraphs:
        p = p.strip()
        if not p: continue
        
        # Detect Code
        if (p.startswith("    ") or "public class" in p or "import " in p or "new " in p) and len(p) > 40:
             # If we have text but no code yet, add this code to current block
             current_block["code"].append(p)
        
        # Detect Header (Uppercased or short CamelCase)
        elif len(p) < 60 and not p.endswith('.') and (p[0].isupper() or p.istitle()):
             # Save previous block if it has content
             if current_block["text"] or current_block["code"]:
                 blocks.append(current_block)
             
             current_block = {"title": p, "text": [], "code": []}
        
        # Regular Text
        else:
             # Filter out very short lines that look like garbage
             if len(p) > 30:
                 current_block["text"].append(p)

    if current_block["text"] or current_block["code"]:
        blocks.append(current_block)
        
    # Filter blocks that are too empty
    valid_blocks = [b for b in blocks if b["text"] or b["code"]]
    
    # Return top 4 most relevant blocks (usually intro + 3 main topics)
    return valid_blocks[:4]

def generate_lesson_html(ch_num, filename, title, subtitle, raw_text):
    blocks = extract_structured_content(raw_text)
    
    slides_html = ""
    for block in blocks:
        content_html = ""
        
        # Add paragraphs
        for p in block["text"][:2]: # Limit to 2 paragraphs per slide for brevity
            content_html += f"<p>{p}</p>"
            
        # Add code if exists
        if block["code"]:
            code_snippet = block["code"][0] # Take first code snippet
            content_html += f'<div class="code-block">{code_snippet}</div>'
            
        slides_html += f"""
        <div class="slide">
            <h2>{block['title']}</h2>
            <div class="content-scroll">
                {content_html}
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
            max-height: 55vh;
            overflow-y: auto;
            text-align: justify;
            padding-right: 15px;
        }}
        .content-scroll p {{
            margin-bottom: 15px;
            font-size: 1.15rem;
            line-height: 1.6;
            color: #333;
        }}
        .code-block {{
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 15px;
            border-radius: 6px;
            font-family: 'Consolas', 'Monaco', monospace;
            white-space: pre-wrap;
            margin: 20px 0;
            font-size: 0.95rem;
            border-left: 4px solid #007acc;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
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
            <div style="width: 100%; height: 250px; background: #004587; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; border-radius: 10px; margin-top: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                <h1 style="color: white; font-size: 3.5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">Aula {filename[:2]}</h1>
                <p style="font-size: 1.3rem; margin-top: 15px; opacity: 0.9;">Referência: Capítulo {ch_num}</p>
            </div>
        </div>

        {slides_html}

        <!-- Slide Final: Atividade -->
        <div class="slide">
            <h2>Atividade Prática</h2>
            <div style="background: #e3f2fd; padding: 20px; border-left: 6px solid #2196f3; margin-bottom: 20px; border-radius: 4px;">
                <h3 style="margin-bottom: 10px; color: #0d47a1;">🎯 Desafio de Código</h3>
                <p>Implemente uma aplicação funcional utilizando: <strong>{subtitle}</strong>.</p>
                <p style="font-size: 0.9rem; margin-top: 5px;">Utilize os exemplos vistos nos slides anteriores como base.</p>
            </div>

            <textarea id="activity-{filename[:2]}" class="code-input">
/*
 * ==========================================
 * DESAFIO PRÁTICO - AULA {filename[:2]}
 * ==========================================
 * 
 * Requisitos:
 * 1. Criar uma classe Swing completa (JFrame).
 * 2. Implementar os componentes: {subtitle}.
 * 3. Garantir que a janela abra corretamente.
 */

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

public class DesafioAula{filename[:2]} extends JFrame {{

    public DesafioAula{filename[:2]}() {{
        // Configuração da Janela
        setTitle("Desafio {title}");
        setSize(500, 400);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null); // Centralizar
        
        initUI();
    }}

    private void initUI() {{
        // TODO: Adicione seus componentes aqui
        
    }}

    public static void main(String[] args) {{
        SwingUtilities.invokeLater(() -> {{
            new DesafioAula{filename[:2]}().setVisible(true);
        }});
    }}
}}
            </textarea>
            <button class="send-btn">Enviar Resposta</button>
        </div>

        <div class="slide">
            <h2>Aula Concluída!</h2>
            <div style="margin-top: 50px; text-align: center;">
                <button id="finishLessonBtn" class="btn-start" style="font-size: 1.5rem; padding: 15px 30px; background-color: #28a745; border: none; box-shadow: 0 4px 6px rgba(0,0,0,0.2); cursor: pointer; transition: transform 0.2s;">✅ Finalizar Aula</button>
            </div>
        </div>

    </div>

    <div class="controls">
        <button id="btnPrev" disabled>Anterior</button>
        <span id="slideNumber">1 / {len(blocks) + 3}</span>
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
        print(f"Gerando Aula Estruturada: {filename}...")
        
        start_page = chapter_starts.get(ch_num)
        if not start_page: continue
        
        raw_text = ""
        # Read enough pages to find structure
        end_page = min(start_page + 8, len(reader.pages))
        
        for i in range(start_page, end_page):
            raw_text += reader.pages[i].extract_text() + "\n\n"
            
        cleaned_text = clean_text(raw_text)
        
        html_content = generate_lesson_html(ch_num, filename, title, subtitle, cleaned_text)
        
        with open(os.path.join(output_dir, filename), "w", encoding="utf-8") as f:
            f.write(html_content)
            
    print("Sucesso! Aulas geradas com estrutura Tópico-Explicação-Exemplo.")

except Exception as e:
    print(f"Erro Crítico: {e}")
