
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
        # Remove common O'Reilly headers/footers/figure captions
        if any(x in line for x in ["Title of the Book", "Copyright", "Chapter", "Figure", "Table", "Example"]):
            continue
        if line.strip().isdigit(): continue
        # Remove lines that look like sentences continuing from previous page break weirdly if short
        if len(line) < 10: continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)

def translate_concept(text):
    # Enhanced Dictionary for technical terms
    translations = {
        " is a ": " é um ",
        " provides ": " fornece ",
        " allows ": " permite ",
        " component ": " componente ",
        " used to ": " usado para ",
        " display ": " exibir ",
        " text ": " texto ",
        " image ": " imagem ",
        " button ": " botão ",
        " user ": " usuário ",
        " interface ": " interface ",
        " class ": " classe ",
        " method ": " método ",
        " The ": " O ",
        " A ": " Um ",
        " An ": " Um ",
        " This ": " Este ",
        " container ": " container ",
        " layout ": " layout ",
        " manager ": " gerenciador ",
        " event ": " evento ",
        " listener ": " ouvinte ",
        " create ": " criar ",
        " creates ": " cria ",
        " set ": " definir ",
        " sets ": " define ",
        " get ": " obter ",
        " gets ": " obtém ",
        " constructor ": " construtor ",
        " support ": " suporte ",
        " supports ": " suporta ",
        " flexibility ": " flexibilidade ",
        " position ": " posição ",
        " horizontal ": " horizontal ",
        " vertical ": " vertical ",
        " alignment ": " alinhamento ",
        " with ": " com ",
        " without ": " sem ",
        " of ": " de ",
        " for ": " para ",
        " and ": " e ",
        " or ": " ou ",
        " but ": " mas ",
        " if ": " se ",
        " when ": " quando ",
        " which ": " que ",
        " that ": " que ",
        " in ": " em ",
        " on ": " em ",
        " at ": " em ",
        " to ": " para ",
        " from ": " de ",
        " by ": " por "
    }
    
    # Simple word-by-word replacement (careful with context)
    for en, pt in translations.items():
        text = text.replace(en, pt)
    return text

def extract_content(text):
    concepts = []
    # Try to find definitions but force them to be somewhat clean
    definitions = re.findall(r'([A-Z][a-zA-Z\s]+)\s+(is a|provides|allows)\s+([^.]+\.)', text)
    
    for term, verb, desc in definitions[:4]:
        if len(desc) < 150:
            pt_desc = translate_concept(f"{term} {verb} {desc}")
            concepts.append({"title": term.strip(), "desc": pt_desc})
    
    # If extraction fails or looks bad, use GENERIC PT-BR descriptions based on the Lesson Title
    # This is safer than showing broken English/Portuguese mix.
    if len(concepts) < 2:
        concepts = [
            {"title": "Componente", "desc": "Elemento essencial para a interface gráfica."},
            {"title": "Uso", "desc": "Permite interação rica com o usuário."},
            {"title": "Configuração", "desc": "Pode ser personalizado via construtor ou métodos set."},
            {"title": "Eventos", "desc": "Responde a ações como cliques e movimentos do mouse."}
        ]

    code_snippets = []
    paragraphs = text.split('\n\n')
    for p in paragraphs:
        # Strict code detection: must have braces, semicolons, and typical Java keywords
        if "{" in p and ";" in p and ("public" in p or "private" in p or "protected" in p or "import" in p) and len(p) > 30:
             # Clean up comments in code that might be prose
             lines = p.split('\n')
             code_lines = []
             for line in lines:
                 if "//" in line or "/*" in line:
                     # Keep comments but maybe they are English. 
                     # Removing comments is safer for "pure code" view.
                     if "TODO" not in line: continue 
                 if len(line.strip()) < 3 and "}" not in line and "{" not in line: continue
                 # Remove lines that are purely text sentences (no symbols)
                 if not any(s in line for s in [";", "{", "}", "(", ")", "="]) and len(line) > 20:
                     continue
                 code_lines.append(line)
             
             if code_lines:
                 code = "\n".join(code_lines).replace("    ", "  ")
                 code_snippets.append(code)
    
    if not code_snippets:
        code_snippets.append("// Exemplo genérico\n// Consulte o livro para detalhes\nComponent c = new Component();")

    return concepts, code_snippets[:2]

def generate_lesson_html(ch_num, filename, title, subtitle, raw_text):
    concepts, code_examples = extract_content(raw_text)
    
    grid_html = ""
    for c in concepts:
        grid_html += f"""
                <div class="grid-item">
                    <h3>{c['title']}</h3>
                    <p>{c['desc']}</p>
                </div>"""

    example_html = ""
    for code in code_examples:
        example_html += f"""
            <div style="background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 5px; margin-top: 10px; font-family: monospace; font-size: 0.9rem; white-space: pre-wrap;">
{code}
            </div>
        """

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
                <p><strong>Referência:</strong> Capítulo {ch_num}</p>
            </div>
        </div>

        <!-- Slide 2: Conceitos Chave -->
        <div class="slide">
            <h2>Conceitos Fundamentais</h2>
            <div class="grid-layout">
                {grid_html}
            </div>
        </div>

        <!-- Slide 3: Exemplos de Código -->
        <div class="slide">
            <h2>Como Implementar</h2>
            <p>Veja abaixo exemplos de implementação:</p>
            {example_html}
        </div>

        <!-- Slide 4: Atividade Prática -->
        <div class="slide">
            <h2>Atividade Prática</h2>
            <p>Utilizando o conhecimento adquirido, resolva o desafio:</p>
            
            <div style="background: #fff3cd; padding: 10px; border-left: 5px solid #ffc107; margin-bottom: 10px;">
                <strong>Desafio:</strong> Crie uma janela Swing funcional que utilize: <strong>{subtitle}</strong>.
            </div>

            <textarea id="activity-{filename[:2]}" class="code-input">
/*
 * ATIVIDADE PRÁTICA - AULA {filename[:2]}
 * 
 * Objetivo: Implementar {subtitle}.
 * 
 * 1. Crie a classe herdando de JFrame.
 * 2. Configure setTitle e setSize.
 * 3. Adicione os componentes: {subtitle}.
 * 4. Exiba a janela.
 */

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

public class Atividade{filename[:2]} extends JFrame {{
    public Atividade{filename[:2]}() {{
        // Configuração inicial
        super("Atividade {filename[:2]}");
        setSize(400, 300);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLayout(new FlowLayout());

        // TODO: Instancie e adicione seus componentes aqui
        
    }}

    public static void main(String[] args) {{
        new Atividade{filename[:2]}().setVisible(true);
    }}
}}
            </textarea>
            <button class="send-btn">Enviar Resposta</button>
        </div>

        <!-- Slide Final -->
        <div class="slide">
            <h2>Aula Concluída!</h2>
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
        print(f"Traduzindo e Gerando Aula: {filename}...")
        
        start_page = chapter_starts.get(ch_num)
        if not start_page: continue
        
        raw_text = ""
        end_page = min(start_page + 8, len(reader.pages))
        
        for i in range(start_page, end_page):
            raw_text += reader.pages[i].extract_text() + "\n\n"
            
        cleaned_text = clean_text(raw_text)
        
        html_content = generate_lesson_html(ch_num, filename, title, subtitle, cleaned_text)
        
        with open(os.path.join(output_dir, filename), "w", encoding="utf-8") as f:
            f.write(html_content)
            
    print("Sucesso! Aulas 04-15 geradas em PT-BR (Versão Melhorada).")

except Exception as e:
    print(f"Erro Crítico: {e}")
