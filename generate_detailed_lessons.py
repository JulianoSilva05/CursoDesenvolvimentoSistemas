
import os
import pypdf
import re

pdf_path = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\java-swing-2nbsped-9780596004088_compress.pdf"
output_dir = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java"

# Map chapters to start pages (approximate based on previous scan)
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
    # Remove header/footer noise common in O'Reilly PDFs
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        if "Title of the Book" in line or "Copyright" in line or "Chapter" in line and len(line) < 20:
            continue
        # Remove standalone numbers (page numbers)
        if line.strip().isdigit():
            continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)

def format_content_to_html(text):
    # Split into paragraphs based on double newlines
    paragraphs = text.split('\n\n')
    html_parts = []
    
    in_code_block = False
    
    for p in paragraphs:
        p = p.strip()
        if not p: continue
        
        # Heuristic for Code Blocks: Indentation, semicolons, brackets
        if (p.startswith("    ") or "public class" in p or "import " in p or "void " in p) and len(p) > 20:
            html_parts.append(f'<div class="code-block">{p}</div>')
        # Heuristic for Headers: Short, no punctuation at end, CamelCase
        elif len(p) < 60 and not p.endswith('.') and p[0].isupper():
            html_parts.append(f'<h3>{p}</h3>')
        # Standard Paragraph
        else:
            html_parts.append(f'<p>{p}</p>')
            
    return "\n".join(html_parts)

def generate_lesson_html(ch_num, filename, title, subtitle, raw_text):
    formatted_content = format_content_to_html(raw_text)
    
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
        /* Estilos específicos para conteúdo rico */
        .content-scroll {{
            max-height: 50vh;
            overflow-y: auto;
            padding: 20px;
            background: #fff;
            border-radius: 8px;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
            text-align: justify;
            line-height: 1.6;
        }}
        .content-scroll h3 {{ color: #004587; margin-top: 20px; border-bottom: 2px solid #eee; padding-bottom: 5px; }}
        .content-scroll p {{ margin-bottom: 15px; font-size: 1.1rem; }}
        .content-scroll .code-block {{
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 5px;
            font-family: 'Consolas', monospace;
            white-space: pre-wrap;
            margin: 15px 0;
            font-size: 0.95rem;
        }}
        .highlight-box {{
            background: #e3f2fd;
            border-left: 5px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
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
                <h1 style="color: white; font-size: 4rem;">Aula {filename[:2]}</h1>
                <p style="font-size: 1.2rem; margin-top: 10px;">Baseado no Capítulo {ch_num} do livro oficial</p>
            </div>
        </div>

        <!-- Slide 2: Conteúdo Teórico Detalhado -->
        <div class="slide">
            <h2>Material de Estudo</h2>
            <p>Leia atentamente o conteúdo abaixo antes de realizar a atividade.</p>
            <div class="content-scroll">
                <div class="highlight-box">
                    <strong>Resumo do Capítulo:</strong>
                    Este material foi extraído e adaptado para fornecer todo o conhecimento necessário para a atividade prática.
                </div>
                {formatted_content}
            </div>
        </div>

        <!-- Slide 3: Atividade Prática -->
        <div class="slide">
            <h2>Atividade Prática</h2>
            <p>Com base no texto lido, implemente o seguinte desafio:</p>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 10px; border: 1px solid #ffeeba;">
                <strong>Desafio:</strong> Crie uma aplicação completa usando os componentes <em>{subtitle}</em>.
                Seu código deve compilar e rodar mostrando uma interface funcional.
            </div>

            <textarea id="activity-{filename[:2]}" class="code-input">
/*
 * ==========================================
 * ATIVIDADE PRÁTICA AULA {filename[:2]}
 * ==========================================
 * 
 * Objetivo: Demonstrar domínio de {subtitle}.
 * 
 * Instruções:
 * 1. Leia o material no slide anterior se tiver dúvidas.
 * 2. Implemente a classe abaixo.
 * 3. Use os componentes: {subtitle}.
 */

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

public class Aula{filename[:2]}Exemplo extends JFrame {{
    
    public Aula{filename[:2]}Exemplo() {{
        super("Aplicação Aula {filename[:2]}");
        setSize(500, 400);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLayout(new FlowLayout());
        
        // TODO: Inicialize e adicione seus componentes aqui
        // Exemplo: JButton btn = new JButton("Clique");
        // add(btn);
        
    }}

    public static void main(String[] args) {{
        // Thread-safety recomendada para Swing
        SwingUtilities.invokeLater(() -> {{
            new Aula{filename[:2]}Exemplo().setVisible(true);
        }});
    }}
}}
            </textarea>
            <button class="send-btn">Enviar Resposta</button>
        </div>

        <!-- Slide Final -->
        <div class="slide">
            <h2>Parabéns!</h2>
            <p>Você concluiu o estudo detalhado deste tópico.</p>
            <div style="margin-top: 50px; text-align: center;">
                <button id="finishLessonBtn" class="btn-start" style="font-size: 1.5rem; padding: 15px 30px; background-color: #28a745;">✅ Finalizar Aula</button>
            </div>
        </div>

    </div>

    <div class="controls">
        <button id="btnPrev" disabled>Anterior</button>
        <span id="slideNumber">1 / 4</span>
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
        print(f"Gerando Conteúdo Rico para {filename} (Capítulo {ch_num})...")
        
        start_page = chapter_starts.get(ch_num)
        if not start_page: continue
        
        # Read more pages (15 pages) to get deep content
        raw_text = ""
        # Adjust range to stay within bounds
        end_page = min(start_page + 12, len(reader.pages))
        
        for i in range(start_page, end_page):
            raw_text += reader.pages[i].extract_text() + "\n\n"
            
        cleaned_text = clean_text(raw_text)
        
        html_content = generate_lesson_html(ch_num, filename, title, subtitle, cleaned_text)
        
        with open(os.path.join(output_dir, filename), "w", encoding="utf-8") as f:
            f.write(html_content)
            
    print("Sucesso! Todas as aulas foram atualizadas com conteúdo detalhado do livro.")

except Exception as e:
    print(f"Erro Crítico: {e}")
