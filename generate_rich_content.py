
import os
import pypdf
import re

pdf_path = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\java-swing-2nbsped-9780596004088_compress.pdf"
output_dir = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java"

chapter_starts = {4: 111, 5: 125, 6: 157, 7: 183, 8: 249, 9: 283, 10: 311, 11: 339, 12: 391, 13: 431, 14: 457, 15: 513}

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

def generate_lesson_html(ch_num, filename, title, subtitle, content_text):
    # Extract some key paragraphs for the "Introduction" slide
    lines = content_text.split('\n')
    intro_text = "<p>" + "</p><p>".join([line.strip() for line in lines[:6] if len(line.strip()) > 50]) + "</p>"
    
    # Generate generic validation rules based on keywords in subtitle
    keywords = subtitle.split(',')
    rules_js = ""
    for i, kw in enumerate(keywords):
        kw = kw.strip()
        rules_js += f"                {{ id: 'rule{i}', text: 'Utilizar {kw}', pattern: /{kw}/ }},\n"
    
    # Main method rule is always good
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
    <img src="logo_senai.png" alt="Logo SENAI" class="senai-logo">
    <div class="progress-bar" id="progressBar"></div>

    <div class="slide-container">
        
        <!-- Slide 1: Capa -->
        <div class="slide active">
            <h1>{title}</h1>
            <h2>{subtitle}</h2>
            <div style="width: 100%; height: 300px; background: #004587; display: flex; justify-content: center; align-items: center; color: white; border-radius: 10px; margin-top: 20px;">
                <h1 style="color: white;">Capítulo {ch_num}</h1>
            </div>
            <div style="background: #eee; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
                <p><strong>Conteúdo do Livro:</strong> Java Swing, 2nd Edition</p>
            </div>
        </div>

        <!-- Slide 2: Conceitos -->
        <div class="slide">
            <h2>Introdução Teórica</h2>
            <div class="content-box" style="max-height: 400px; overflow-y: auto; text-align: justify; padding-right: 10px;">
                {intro_text}
            </div>
        </div>

        <!-- Slide 3: Componentes -->
        <div class="slide">
            <h2>Componentes Principais</h2>
            <p>Neste capítulo, focamos em:</p>
            <ul>
                {"".join([f"<li><strong>{k.strip()}</strong></li>" for k in keywords])}
            </ul>
            <p>Consulte o livro (Capítulo {ch_num}) para detalhes de implementação de cada um.</p>
        </div>

        <!-- Slide 4: Atividade Prática -->
        <div class="slide">
            <h2>Atividade Prática</h2>
            <p>Implemente um exemplo funcional utilizando os componentes estudados.</p>
            
            <textarea id="activity-{filename[:2]}" class="code-input">
/*
 * Atividade Prática: {title}
 * 
 * Objetivo: Criar uma aplicação Swing que demonstre o uso de:
 * {subtitle}
 * 
 * Requisitos:
 * 1. Crie uma classe herdando de JFrame.
 * 2. Adicione os componentes citados acima.
 * 3. Configure o layout adequadamente.
 * 4. Torne a janela visível no método main.
 */

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

public class ExemploAula{filename[:2]} extends JFrame {{
    
    public ExemploAula{filename[:2]}() {{
        super("Exemplo {title}");
        setSize(400, 300);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        
        // Seu código de componentes aqui...
        
    }}

    public static void main(String[] args) {{
        new ExemploAula{filename[:2]}().setVisible(true);
    }}
}}
            </textarea>
            <button class="send-btn">Enviar Resposta</button>
        </div>

        <!-- Slide Final -->
        <div class="slide">
            <h2>Aula Concluída!</h2>
            <p>Parabéns! Você avançou mais um passo no domínio do Swing.</p>
            <div style="margin-top: 50px; text-align: center;">
                <button id="finishLessonBtn" class="btn-start" style="font-size: 1.5rem; padding: 15px 30px; background-color: #28a745;">✅ Finalizar Aula</button>
            </div>
        </div>

    </div>

    <div class="controls">
        <button id="btnPrev" disabled>Anterior</button>
        <span id="slideNumber">1 / 5</span>
        <button id="btnNext">Próximo</button>
    </div>

    <script src="assets/js/script.js"></script>
    <script>
        // Regras de validação dinâmicas
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
        print(f"Processing Chapter {ch_num} for {filename}...")
        
        # Get start page
        start_page = chapter_starts.get(ch_num)
        if not start_page:
            print(f"Skipping Ch {ch_num} (start page not found)")
            continue
            
        # Extract first 3 pages of text for the intro
        text_content = ""
        for i in range(start_page, min(start_page + 3, len(reader.pages))):
            text_content += reader.pages[i].extract_text() + "\n"
            
        # Clean text
        text_content = re.sub(r'This is the Title.*reserved\.', '', text_content)
        text_content = re.sub(r'\d+\s+\|\s+Chapter.*', '', text_content)
        
        # Generate HTML
        html_content = generate_lesson_html(ch_num, filename, title, subtitle, text_content)
        
        # Write file
        with open(os.path.join(output_dir, filename), "w", encoding="utf-8") as f:
            f.write(html_content)
            
    print("All lessons generated successfully!")

except Exception as e:
    print(f"Critical Error: {e}")
