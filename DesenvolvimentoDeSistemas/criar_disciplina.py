import os
import shutil

# Configurações
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "_Templates")

def create_discipline():
    print("="*60)
    print("   GERADOR DE DISCIPLINAS - SISTEMA DE ENSINO SENAI")
    print("="*60)
    
    # 1. Solicitar Nome da Disciplina
    while True:
        course_name = input("\nDigite o nome da Nova Disciplina (ex: CSharp, Nodejs): ").strip()
        if course_name and " " not in course_name:
            break
        print("❌ Nome inválido! Use apenas uma palavra ou CamelCase, sem espaços.")

    course_dir = os.path.join(BASE_DIR, course_name)
    
    if os.path.exists(course_dir):
        print(f"❌ A pasta '{course_name}' já existe em: {course_dir}")
        return

    print(f"\n📂 Criando estrutura em: {course_dir}...")
    
    # 2. Criar Pastas
    try:
        os.makedirs(course_dir)
        os.makedirs(os.path.join(course_dir, "assets", "css"))
        os.makedirs(os.path.join(course_dir, "assets", "js"))
        os.makedirs(os.path.join(course_dir, "assets", "img"))
    except Exception as e:
        print(f"❌ Erro ao criar pastas: {e}")
        return

    # 3. Copiar Assets do Template (Golden Standard)
    print("📦 Copiando arquivos de modelo (CSS, JS, Imagens)...")
    try:
        shutil.copy(os.path.join(TEMPLATES_DIR, "assets", "css", "style.css"), 
                    os.path.join(course_dir, "assets", "css", "style.css"))
        
        shutil.copy(os.path.join(TEMPLATES_DIR, "assets", "js", "script.js"), 
                    os.path.join(course_dir, "assets", "js", "script.js"))
        
        shutil.copy(os.path.join(TEMPLATES_DIR, "assets", "img", "slide_bg.png"), 
                    os.path.join(course_dir, "assets", "img", "slide_bg.png"))
        
        shutil.copy(os.path.join(TEMPLATES_DIR, "logo_senai.png"), 
                    os.path.join(course_dir, "logo_senai.png"))
    except FileNotFoundError:
        print("❌ ERRO CRÍTICO: Pasta '_Templates' não encontrada ou incompleta!")
        print(f"Certifique-se de que {TEMPLATES_DIR} existe e contém 'assets/css/style.css', etc.")
        return

    # 4. Criar index.html (Menu do Curso)
    print("📄 Gerando menu principal (index.html)...")
    index_content = f"""<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Curso de {course_name}</title>
    <style>
        :root {{ --senai-blue: #004587; --senai-red: #E32119; --bg-color: #f4f4f4; --text-color: #333; }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{ font-family: 'Segoe UI', sans-serif; background: var(--bg-color); color: var(--text-color); display: flex; flex-direction: column; min-height: 100vh; }}
        header {{ background: var(--senai-blue); color: white; padding: 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        h1 {{ margin: 0; }}
        main {{ flex: 1; padding: 40px 20px; max-width: 800px; margin: 0 auto; width: 100%; }}
        .lesson-list {{ display: grid; gap: 15px; }}
        .lesson-item {{ background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-decoration: none; color: var(--text-color); font-weight: bold; display: flex; justify-content: space-between; transition: transform 0.2s; }}
        .lesson-item:hover {{ transform: translateY(-2px); border-left: 5px solid var(--senai-red); }}
        footer {{ text-align: center; padding: 20px; color: #666; font-size: 0.9rem; }}
    </style>
</head>
<body>
    <header>
        <h1>Curso de {course_name}</h1>
        <p>Desenvolvimento de Sistemas</p>
    </header>
    <main>
        <div class="lesson-list">
            <a href="01_introducao.html" class="lesson-item">
                <span>Aula 01 - Introdução</span>
                <span>➜</span>
            </a>
            <!-- Adicione novas aulas aqui -->
        </div>
    </main>
    <footer>
        &copy; 2024 SENAI - Todos os direitos reservados
    </footer>
</body>
</html>"""
    
    with open(os.path.join(course_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(index_content)

    # 5. Criar Aula 01 de Exemplo (Template Golden Standard)
    print("📝 Gerando Aula 01 de exemplo...")
    lesson_01_content = f"""<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aula 01: Introdução ao {course_name}</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .code-block {{ background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre-wrap; margin: 10px 0; }}
    </style>
</head>
<body>
    <img src="logo_senai.png" alt="Logo SENAI" class="senai-logo">
    <div class="progress-bar" id="progressBar"></div>

    <div class="slide-container">
        
        <!-- Slide 1: Capa -->
        <div class="slide active">
            <h1>Aula 01: Introdução</h1>
            <h2>Bem-vindo ao curso de {course_name}</h2>
            <div style="width: 100%; height: 300px; background: #004587; display: flex; justify-content: center; align-items: center; color: white; border-radius: 10px; margin-top: 20px;">
                <h1 style="color: white;">{course_name}</h1>
            </div>
            <div style="background: #eee; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
                <p><strong>Duração: 3 Horas</strong></p>
                <p>Conceitos Iniciais e Configuração de Ambiente</p>
            </div>
        </div>

        <!-- Slide 2: Conceitos -->
        <div class="slide">
            <h2>O que é {course_name}?</h2>
            <div class="grid-layout">
                <div class="grid-item">
                    <h3>Definição</h3>
                    <p>Substitua este texto pela definição técnica da tecnologia.</p>
                </div>
                <div class="grid-item">
                    <h3>Características</h3>
                    <p>Liste aqui as principais vantagens e usos.</p>
                </div>
            </div>
        </div>

        <!-- Slide 3: Aprofundamento -->
        <div class="slide">
            <h2>Aprofundamento Técnico</h2>
            <p>Detalhes técnicos importantes sobre o funcionamento interno.</p>
            <div class="code-block">
// Exemplo de código inicial
console.log("Olá Mundo!");
            </div>
        </div>

        <!-- Slide 4: Atividade -->
        <div class="slide">
            <h2>Atividade Prática</h2>
            <div style="background: #e3f2fd; padding: 15px; border-left: 5px solid #2196f3; margin-bottom: 15px;">
                <strong>Desafio:</strong> Crie seu primeiro programa.
            </div>
            
            <div id="validation-feedback" style="background: #f8f9fa; padding: 10px; border: 1px dashed #ccc; border-radius: 5px; margin-bottom: 10px; font-size: 0.9rem; color: #555;">
                🌡️ <strong>Termômetro:</strong> Use os comandos abaixo.
            </div>

            <textarea id="activity-01" class="code-input">
// Digite seu código aqui
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
        // Regras de validação para o Termômetro
        window.activityRules = {{
            'activity-01': [
                {{ id: 'hello', text: 'Imprimir Olá', pattern: /Ola/i }},
                {{ id: 'cmd', text: 'Usar comando print/log', pattern: /(print|console\.log)/ }}
            ]
        }};
    </script>
</body>
</html>"""

    with open(os.path.join(course_dir, "01_introducao.html"), "w", encoding="utf-8") as f:
        f.write(lesson_01_content)

    print("\n✅ Disciplina criada com SUCESSO!")
    print(f"📍 Local: {course_dir}")
    print("🚀 Agora você pode usar o 'Prompt Mestre' para gerar mais aulas!")

if __name__ == "__main__":
    create_discipline()
