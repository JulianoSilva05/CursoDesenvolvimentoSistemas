
import os

output_dir = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java"

# EXPANDED CONTENT - 3 Hours Duration per Lesson
# Structure:
# 1. Intro & Concepts (30 min)
# 2. Deep Dive & Advanced Features (45 min)
# 3. Practical Examples Walkthrough (45 min)
# 4. Hands-on Activity (60 min)

lessons_data = {
    "04": {
        "title": "Aula 04: Labels e Ícones Avançados",
        "subtitle": "JLabel, Icon, ImageIcon, HTML",
        "duration": "Duração: 3 Horas (2h Teoria + 1h Prática)",
        "intro": "Dominando a Exibição de Dados Estáticos",
        "concepts": [
            ("JLabel Básico", "Exibição de texto simples e imagens. Componente não editável."),
            ("HTML Rendering", "O Swing permite usar tags HTML (<b>, <i>, <table>) dentro de Labels."),
            ("Posicionamento", "Controle fino de alinhamento vertical e horizontal (ícone vs texto)."),
            ("Acessibilidade", "Uso de setLabelFor() para vincular labels a campos de texto (mnemônicos).")
        ],
        "deep_dive": """
            <h3>1. Renderização HTML</h3>
            <p>O JLabel é capaz de renderizar HTML 3.2. Isso permite criar layouts complexos dentro de um único componente, como listas coloridas ou textos multilinhas.</p>
            <div class="code-block">new JLabel("&lt;html&gt;&lt;h1&gt;Título&lt;/h1&gt;&lt;p&gt;Parágrafo&lt;/p&gt;&lt;/html&gt;");</div>
            
            <h3>2. Mnemônicos e Acessibilidade</h3>
            <p>Atalhos de teclado (Alt+Letra) podem focar campos relacionados.</p>
            <div class="code-block">
            JLabel lblNome = new JLabel("Nome:");
            lblNome.setDisplayedMnemonic('N'); // Alt+N foca o campo
            lblNome.setLabelFor(txtNome);
            </div>
        """,
        "code_example": """// Exemplo Completo: Label Rico
ImageIcon icon = new ImageIcon("user.png");
JLabel label = new JLabel("<html><b>Usuário:</b> Admin<br><i>Online</i></html>", icon, JLabel.LEFT);

// Configuração Visual
label.setIconTextGap(15); // Espaço entre ícone e texto
label.setVerticalTextPosition(JLabel.CENTER);
label.setHorizontalTextPosition(JLabel.RIGHT);
label.setBorder(BorderFactory.createEtchedBorder());
label.setToolTipText("Status do usuário atual");""",
        "activity_desc": "Crie um 'Perfil de Usuário' completo. Use um JLabel para a foto, outro para o Nome (em Negrito/HTML) e outro para a Bio (multilinha com HTML). Configure Tooltips e Bordas.",
        "activity_code": """public class PerfilUsuario extends JFrame {
    public PerfilUsuario() {
        super("Perfil Completo");
        setSize(400, 500);
        setLayout(new FlowLayout());
        
        // 1. Carregue uma imagem de perfil
        // 2. Crie um Label com HTML para Nome e Cargo
        // 3. Adicione uma borda decorativa ao Label
        // 4. Use setToolTipText para mostrar detalhes ao passar o mouse
        
    }
    public static void main(String[] args) { new PerfilUsuario().setVisible(true); }
}""",
        "rules": [
            "{ id: 'html', text: 'Usar HTML no texto', pattern: /<html>/i }",
            "{ id: 'tooltip', text: 'Configurar ToolTip', pattern: /setToolTipText/ }",
            "{ id: 'gap', text: 'Ajustar espaçamento (Gap)', pattern: /setIconTextGap/ }"
        ]
    },
    "05": {
        "title": "Aula 05: Botões e Eventos Complexos",
        "subtitle": "JButton, Toggle, Radio, CheckBox",
        "duration": "Duração: 3 Horas (2h Teoria + 1h Prática)",
        "intro": "Interação Avançada com o Usuário",
        "concepts": [
            ("ButtonGroup", "Agrupa RadioButtons para permitir apenas uma seleção por vez."),
            ("ItemListener", "Evento específico para detectar mudança de estado (selecionado/não)."),
            ("Mnemônicos", "Teclas de atalho (Alt+X) para acionar botões via teclado."),
            ("Ícones de Estado", "Botões podem ter ícones diferentes para 'passar o mouse' ou 'pressionado'.")
        ],
        "deep_dive": """
            <h3>1. ButtonGroup (Exclusividade)</h3>
            <p>Para criar opções mutuamente exclusivas (como Gênero ou Pagamento), você deve adicionar os RadioButtons a um ButtonGroup lógico.</p>
            
            <h3>2. Customização de Ícones</h3>
            <p>Um botão pode mudar de aparência dinamicamente.</p>
            <div class="code-block">
            btn.setRolloverIcon(new ImageIcon("hover.png"));
            btn.setPressedIcon(new ImageIcon("click.png"));
            </div>
        """,
        "code_example": """// Grupo de Opções
JRadioButton r1 = new JRadioButton("Crédito");
JRadioButton r2 = new JRadioButton("Débito");
ButtonGroup grupo = new ButtonGroup();
grupo.add(r1);
grupo.add(r2); // Agora só um pode ser marcado

// CheckBox com Evento de Item
JCheckBox chk = new JCheckBox("Habilitar Notificações");
chk.addItemListener(e -> {
    if(e.getStateChange() == ItemEvent.SELECTED) {
        System.out.println("Ligado");
    }
});""",
        "activity_desc": "Crie um formulário de pedido de Pizza. Use CheckBoxes para ingredientes (múltiplos) e RadioButtons para o tamanho (P/M/G - exclusivo). Adicione um botão 'Pedir' que lista o que foi escolhido.",
        "activity_code": """public class PedidoPizza extends JFrame {
    public PedidoPizza() {
        super("Pizzaria");
        setSize(400, 400);
        setLayout(new FlowLayout());
        
        // 1. Crie 3 JCheckBox (Queijo, Bacon, Milho)
        // 2. Crie 3 JRadioButton (Pequena, Média, Grande) e um ButtonGroup
        // 3. Botão Finalizar que imprime as escolhas no console (System.out)
    }
    public static void main(String[] args) { new PedidoPizza().setVisible(true); }
}""",
        "rules": [
            "{ id: 'group', text: 'Usar ButtonGroup', pattern: /ButtonGroup/ }",
            "{ id: 'radio', text: 'Usar RadioButton', pattern: /JRadioButton/ }",
            "{ id: 'check', text: 'Usar CheckBox', pattern: /JCheckBox/ }"
        ]
    },
    "06": {
        "title": "Aula 06: Controles de Valor e Progresso",
        "subtitle": "JSlider, JProgressBar, BoundedRangeModel",
        "duration": "Duração: 3 Horas (2h Teoria + 1h Prática)",
        "intro": "Manipulação de Dados Numéricos",
        "concepts": [
            ("ChangeListener", "Evento disparado continuamente enquanto o usuário arrasta o slider."),
            ("JProgressBar Indeterminado", "Modo de 'carregando' quando não se sabe o tempo total."),
            ("Labels no Slider", "Exibição de rótulos personalizados (ex: Baixo, Médio, Alto) na régua."),
            ("Orientação", "Sliders e Barras podem ser Verticais ou Horizontais.")
        ],
        "deep_dive": """
            <h3>1. Customizando a Régua (Ticks)</h3>
            <p>O JSlider permite configuração detalhada de espaçamento maior (Major) e menor (Minor), além de 'Snap' (imã) para valores inteiros.</p>
            
            <h3>2. Barra de Progresso Real</h3>
            <p>Para atualizar uma barra de progresso em uma aplicação real, você precisará usar Threads ou SwingWorker, pois loops normais travam a interface.</p>
        """,
        "code_example": """// Slider Vertical com Labels
JSlider slider = new JSlider(JSlider.VERTICAL, 0, 100, 50);
slider.setMajorTickSpacing(20);
slider.setMinorTickSpacing(5);
slider.setPaintTicks(true);
slider.setPaintLabels(true);

// Detectando movimento em tempo real
slider.addChangeListener(e -> {
    JSlider source = (JSlider)e.getSource();
    if (!source.getValueIsAdjusting()) {
        System.out.println("Valor final: " + source.getValue());
    }
});""",
        "activity_desc": "Simule um 'Instalador'. Use um Slider para o usuário definir a velocidade de instalação e um botão 'Instalar' que inicia uma ProgressBar (use um Timer para simular o progresso).",
        "activity_code": """public class Instalador extends JFrame {
    JProgressBar barra;
    public Instalador() {
        super("Setup");
        setSize(400, 200);
        setLayout(new FlowLayout());
        
        barra = new JProgressBar(0, 100);
        barra.setStringPainted(true);
        
        // Crie Slider de velocidade
        // Botão que inicia um javax.swing.Timer
        // O Timer deve incrementar a barra.setValue(barra.getValue() + 1)
        
        add(barra);
    }
    public static void main(String[] args) { new Instalador().setVisible(true); }
}""",
        "rules": [
            "{ id: 'timer', text: 'Usar Timer (Simulação)', pattern: /Timer/ }",
            "{ id: 'paint', text: 'Pintar Texto na Barra', pattern: /setStringPainted/ }",
            "{ id: 'slider', text: 'Configurar Ticks do Slider', pattern: /setPaintTicks/ }"
        ]
    },
    "07": {
        "title": "Aula 07: Seleção de Dados Complexos",
        "subtitle": "JList, JComboBox, ListModel",
        "duration": "Duração: 3 Horas (2h Teoria + 1h Prática)",
        "intro": "Listas Dinâmicas e Modelos de Dados",
        "concepts": [
            ("DefaultListModel", "Permite adicionar, remover e alterar itens da lista em tempo de execução."),
            ("SelectionMode", "Define se o usuário pode escolher um item (SINGLE) ou vários (MULTIPLE)."),
            ("ListCellRenderer", "Permite customizar visualmente cada item da lista (cores, ícones)."),
            ("JSpinner", "Alternativa ao ComboBox para números ou datas sequenciais.")
        ],
        "deep_dive": """
            <h3>1. Manipulação Dinâmica</h3>
            <p>Diferente de arrays estáticos, o <code>DefaultListModel</code> funciona como um <code>ArrayList</code>. Você pode usar <code>model.addElement()</code> ou <code>model.remove()</code> a qualquer momento.</p>
            
            <h3>2. Renderizadores (Avançado)</h3>
            <p>Você pode fazer uma JList exibir painéis inteiros em vez de apenas strings, implementando a interface <code>ListCellRenderer</code>.</p>
        """,
        "code_example": """// Modelo Dinâmico
DefaultListModel<String> modelo = new DefaultListModel<>();
modelo.addElement("Tarefa 1");
modelo.addElement("Tarefa 2");

JList<String> lista = new JList<>(modelo);
lista.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);

// Botão para remover selecionado
btnDeletar.addActionListener(e -> {
    int index = lista.getSelectedIndex();
    if(index != -1) modelo.remove(index);
});""",
        "activity_desc": "Crie um gerenciador de 'Lista de Compras'. Tenha um campo de texto e um botão 'Adicionar' que insere itens na JList. Adicione também um botão 'Remover' que apaga o item selecionado.",
        "activity_code": """public class ListaCompras extends JFrame {
    DefaultListModel<String> modelo;
    public ListaCompras() {
        super("Mercado");
        setSize(400, 400);
        setLayout(new FlowLayout());
        
        modelo = new DefaultListModel<>();
        JList<String> lista = new JList<>(modelo);
        
        // 1. Campo de Texto + Botão Add -> modelo.addElement()
        // 2. Botão Del -> lista.getSelectedIndex() -> modelo.remove()
        // 3. Não esqueça do JScrollPane na lista!
        
        add(new JScrollPane(lista));
    }
    public static void main(String[] args) { new ListaCompras().setVisible(true); }
}""",
        "rules": [
            "{ id: 'model', text: 'Usar DefaultListModel', pattern: /DefaultListModel/ }",
            "{ id: 'add', text: 'Adicionar Elemento', pattern: /addElement/ }",
            "{ id: 'remove', text: 'Remover Elemento', pattern: /remove/ }"
        ]
    },
    "08": {
        "title": "Aula 08: Layouts e Containers Avançados",
        "subtitle": "JPanel, JTabbedPane, JSplitPane, CardLayout",
        "duration": "Duração: 3 Horas (2h Teoria + 1h Prática)",
        "intro": "Arquitetura de Interfaces Profissionais",
        "concepts": [
            ("Ninhamento", "Colocar painéis dentro de painéis para criar layouts complexos."),
            ("CardLayout", "Permite empilhar painéis e mostrar apenas um por vez (estilo Wizard/Passo-a-passo)."),
            ("JTabbedPane", "Abas com ícones, tooltips e posicionamento (Topo, Base, Esquerda)."),
            ("JSplitPane", "Divisores arrastáveis. Útil para exploradores de arquivos ou editores de código.")
        ],
        "deep_dive": """
            <h3>1. CardLayout (Wizard)</h3>
            <p>Muito usado em instaladores. Você cria um painel 'pai' e adiciona vários 'filhos' (passos). Depois navega com <code>layout.next(pai)</code> ou <code>layout.show(pai, "nome")</code>.</p>
            
            <h3>2. Estratégia de Layout</h3>
            <p>Não tente fazer tudo com um único LayoutManager. Use BorderLayout para a estrutura principal, e JPanels com FlowLayout ou GridLayout nas regiões (Norte, Centro, Sul).</p>
        """,
        "code_example": """// Criando Abas com Ícones
JTabbedPane abas = new JTabbedPane(JTabbedPane.TOP);
abas.addTab("Home", new ImageIcon("home.png"), panelHome, "Tela Inicial");
abas.addTab("Config", new ImageIcon("gear.png"), panelConfig, "Ajustes");

// Divisor Vertical
JSplitPane split = new JSplitPane(JSplitPane.VERTICAL_SPLIT, painelCima, painelBaixo);
split.setDividerLocation(150); // Posição inicial
split.setOneTouchExpandable(true); // Botõezinhos de colapso""",
        "activity_desc": "Crie um sistema de 'Cadastro em Etapas' (Wizard) usando CardLayout ou JTabbedPane. Passo 1: Dados Pessoais. Passo 2: Endereço. Passo 3: Resumo.",
        "activity_code": """public class WizardCadastro extends JFrame {
    public WizardCadastro() {
        super("Cadastro");
        setSize(500, 400);
        
        // Opção A: JTabbedPane (Mais fácil)
        // Opção B: CardLayout + Botões 'Próximo' (Mais profissional)
        
        // Crie 3 JPanels com cores de fundo diferentes para distinguir
        // Adicione componentes (Labels/Texts) em cada um
    }
    public static void main(String[] args) { new WizardCadastro().setVisible(true); }
}""",
        "rules": [
            "{ id: 'container', text: 'Usar Tabbed ou Split Pane', pattern: /(JTabbedPane|JSplitPane)/ }",
            "{ id: 'panels', text: 'Criar múltiplos Painéis', pattern: /JPanel/ }",
            "{ id: 'color', text: 'Mudar cores de fundo', pattern: /setBackground/ }"
        ]
    },
    "09": {
        "title": "Aula 09: Aplicações MDI",
        "subtitle": "JDesktopPane, JInternalFrame",
        "duration": "Duração: 3 Horas (2h Teoria + 1h Prática)",
        "intro": "Múltiplas Janelas Internas",
        "concepts": [
            ("DesktopManager", "Gerencia o comportamento das janelas internas (minimizar, arrastar)."),
            ("JInternalFrame", "Propriedades: Resizable, Closable, Maximizable, Iconifiable."),
            ("Foco", "Como lidar com qual janela interna está ativa (setSelected)."),
            ("Cascata/Lado a Lado", "Algoritmos para organizar as janelas automaticamente (precisa ser implementado manualmente).")
        ],
        "deep_dive": """
            <h3>1. O Conceito MDI</h3>
            <p>Popularizado pelo Windows 3.1/95 (Excel, Word antigos), onde tudo roda dentro de uma janela mãe. Útil para softwares de gestão (ERP) que precisam de várias telas abertas simultaneamente.</p>
            
            <h3>2. Configuração da Janela Interna</h3>
            <p>O construtor é chave: <code>new JInternalFrame(Titulo, Resizable?, Closable?, Max?, Icon?)</code>. Se você passar 'false' em closable, o usuário não consegue fechar a janela!</p>
        """,
        "code_example": """JDesktopPane desktop = new JDesktopPane();
this.setContentPane(desktop);

// Criando janela filha
JInternalFrame relatorio = new JInternalFrame("Relatório", true, true, true, true);
relatorio.setSize(300, 300);
relatorio.setLocation(50, 50);
relatorio.add(new JLabel("Dados aqui..."));
relatorio.setVisible(true); // Essencial!

desktop.add(relatorio);""",
        "activity_desc": "Crie um 'Mini Sistema Operacional'. Tenha um Menu 'Abrir'. Ao clicar, crie uma nova JInternalFrame. Permita abrir várias janelas e movê-las pela tela.",
        "activity_code": """public class MiniOS extends JFrame {
    JDesktopPane desktop;
    public MiniOS() {
        super("Sistema MDI");
        setSize(800, 600);
        
        desktop = new JDesktopPane();
        setContentPane(desktop);
        
        // Crie um JMenuBar com "Nova Janela"
        // No ActionListener:
        // JInternalFrame frame = new JInternalFrame("Janela " + contador++, ...);
        // desktop.add(frame);
    }
    public static void main(String[] args) { new MiniOS().setVisible(true); }
}""",
        "rules": [
            "{ id: 'desk', text: 'Usar JDesktopPane', pattern: /JDesktopPane/ }",
            "{ id: 'frame', text: 'Configurar InternalFrame (True)', pattern: /true, true/ }",
            "{ id: 'menu', text: 'Acionar via Menu/Botão', pattern: /ActionListener/ }"
        ]
    },
    "10": {
        "title": "Aula 10: Diálogos e Interação Modal",
        "subtitle": "JOptionPane, JDialog",
        "duration": "Duração: 3 Horas (2h Teoria + 1h Prática)",
        "intro": "Comunicação Direta e Bloqueante",
        "concepts": [
            ("Modalidade", "Um diálogo 'Modal' bloqueia a janela principal até ser fechado. 'Não-Modal' permite interação paralela."),
            ("Tipos de Ícone", "ERROR_MESSAGE, WARNING_MESSAGE, QUESTION_MESSAGE, INFORMATION_MESSAGE."),
            ("JDialog Customizado", "Quando o JOptionPane não é suficiente, criamos um JDialog estendendo a classe."),
            ("Opções Customizadas", "Passar um array de Objects para definir botões personalizados (ex: 'Salvar', 'Descartar').")
        ],
        "deep_dive": """
            <h3>1. Input Dialogs</h3>
            <p>Além de texto, o <code>showInputDialog</code> pode receber um array (combobox) para o usuário escolher de uma lista.</p>
            
            <h3>2. JDialog Personalizado</h3>
            <p>Para formulários complexos que devem bloquear o sistema (ex: Tela de Login ou Configurações), herdamos de JDialog em vez de JFrame.</p>
        """,
        "code_example": """// Botões Personalizados
Object[] options = {"Sim, com certeza", "Talvez mais tarde", "Nunca"};
int n = JOptionPane.showOptionDialog(this,
    "Gostaria de doar?",
    "Doação",
    JOptionPane.YES_NO_CANCEL_OPTION,
    JOptionPane.QUESTION_MESSAGE,
    null,
    options,
    options[2]); // Default

// Criando Dialog Manual
JDialog d = new JDialog(this, "Aviso", true); // true = Modal
d.add(new JLabel("Aguarde..."));
d.setSize(200, 100);
d.setVisible(true); // O código para aqui até fechar""",
        "activity_desc": "Implemente um sistema de 'Quiz'. Use JOptionPanes sequenciais para fazer 3 perguntas. Conte os acertos e mostre o resultado final em um MessageDialog.",
        "activity_code": """public class Quiz extends JFrame {
    public Quiz() {
        super("Quiz");
        setSize(300, 200);
        JButton start = new JButton("Iniciar Quiz");
        
        start.addActionListener(e -> {
            int pontos = 0;
            // Pergunta 1 (showInputDialog ou OptionDialog)
            // if(resposta.equals("Certa")) pontos++;
            
            // Pergunta 2...
            
            // Resultado Final
            JOptionPane.showMessageDialog(this, "Pontos: " + pontos);
        });
        
        add(start);
        setLayout(new FlowLayout());
    }
    public static void main(String[] args) { new Quiz().setVisible(true); }
}""",
        "rules": [
            "{ id: 'msg', text: 'ShowMessageDialog', pattern: /showMessageDialog/ }",
            "{ id: 'input', text: 'ShowInputDialog/Confirm', pattern: /show(Input|Confirm|Option)Dialog/ }",
            "{ id: 'logic', text: 'Lógica de Pontuação', pattern: /pontos/ }"
        ]
    },
    "11": {
        "title": "Aula 11: Scroll e Viewports",
        "subtitle": "JScrollPane, ScrollBarPolicy",
        "duration": "Duração: 3 Horas (2h Teoria + 1h Prática)",
        "intro": "Navegando em Grandes Conteúdos",
        "concepts": [
            ("Policies", "Configurar quando as barras aparecem: ALWAYS, NEVER, AS_NEEDED."),
            ("Corner Components", "Adicionar botões ou labels nos cantos de encontro das barras de rolagem."),
            ("Scroll Speed", "Ajustar a velocidade de rolagem (UnitIncrement)."),
            ("Programmatic Scroll", "Mover a rolagem via código (ex: ir para o final do log).")
        ],
        "deep_dive": """
            <h3>1. Viewport</h3>
            <p>O JScrollPane na verdade é uma 'janela' (Viewport) sobre um componente maior. Você pode manipular essa view diretamente.</p>
            
            <h3>2. Imagens Grandes</h3>
            <p>ScrollPanes são perfeitos para visualizar imagens maiores que a tela. Basta colocar o ImageIcon em um JLabel e o JLabel no ScrollPane.</p>
        """,
        "code_example": """JTextArea area = new JTextArea(50, 50); // Área muito grande
JScrollPane scroll = new JScrollPane(area);

// Configuração Fina
scroll.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_ALWAYS);
scroll.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);

// Aumentar velocidade (padrão é muito lento)
scroll.getVerticalScrollBar().setUnitIncrement(16);""",
        "activity_desc": "Crie um visualizador de termos de uso ('EULA'). Um JTextArea com um texto muito longo (gere via código) dentro de um ScrollPane. O botão 'Aceitar' só habilita se o usuário rolar até o final (Dica: AdjustmentListener).",
        "activity_code": """public class TermosUso extends JFrame {
    public TermosUso() {
        super("Contrato");
        setSize(400, 300);
        
        JTextArea texto = new JTextArea();
        // Encha o texto com um loop for para ficar grande
        
        JScrollPane scroll = new JScrollPane(texto);
        
        JButton aceitar = new JButton("Aceitar");
        aceitar.setEnabled(false);
        
        // Desafio: Habilitar botão ao rolar
        // scroll.getVerticalScrollBar().addAdjustmentListener(...)
        
        add(scroll, BorderLayout.CENTER);
        add(aceitar, BorderLayout.SOUTH);
    }
    public static void main(String[] args) { new TermosUso().setVisible(true); }
}""",
        "rules": [
            "{ id: 'policy', text: 'Configurar Policy', pattern: /ScrollBarPolicy/ }",
            "{ id: 'speed', text: 'Ajustar Velocidade', pattern: /setUnitIncrement/ }",
            "{ id: 'text', text: 'Texto Longo', pattern: /for/ }"
        ]
    },
    "12": {
        "title": "Aula 12: Gerenciadores de Layout",
        "subtitle": "Flow, Border, Grid, Box, Null",
        "duration": "Duração: 3 Horas (2h Teoria + 1h Prática)",
        "intro": "Design Responsivo e Flexível",
        "concepts": [
            ("Null Layout", "Posicionamento absoluto (setBounds). NÃO recomendado, pois quebra ao redimensionar."),
            ("BoxLayout", "Organiza componentes em uma única coluna ou linha (mais flexível que Flow)."),
            ("Espaçamento", "Hgap e Vgap em BorderLayout e FlowLayout."),
            ("Combinação", "O segredo do Swing é misturar layouts: Um BorderLayout contendo JPanels com GridLayouts.")
        ],
        "deep_dive": """
            <h3>1. BoxLayout e Box</h3>
            <p>Útil para barras de ferramentas ou formulários verticais. A classe <code>Box</code> fornece espaçadores invisíveis (Struts e Glues) para empurrar componentes.</p>
            
            <h3>2. Layout Nulo (Perigo!)</h3>
            <p>Usar <code>setLayout(null)</code> parece fácil, mas sua janela ficará quebrada em telas com DPI diferente ou se o usuário mudar a fonte do sistema.</p>
        """,
        "code_example": """// Painel Vertical com BoxLayout
JPanel painel = new JPanel();
painel.setLayout(new BoxLayout(painel, BoxLayout.Y_AXIS));

painel.add(new JButton("Um"));
painel.add(Box.createVerticalStrut(10)); // Espaço fixo de 10px
painel.add(new JButton("Dois"));
painel.add(Box.createVerticalGlue()); // Empurra o resto para baixo
painel.add(new JButton("Fim"));""",
        "activity_desc": "Reproduza o layout de uma 'Calculadora'. Use BorderLayout para o visor (Norte) e GridLayout para os botões numéricos (Centro).",
        "activity_code": """public class CalculadoraLayout extends JFrame {
    public CalculadoraLayout() {
        super("Calc");
        setSize(300, 400);
        
        JTextField visor = new JTextField("0");
        visor.setFont(new Font("Arial", Font.BOLD, 30));
        add(visor, BorderLayout.NORTH);
        
        JPanel botoes = new JPanel(new GridLayout(4, 3, 5, 5));
        // Adicione botões de 0-9 e operações (+, -, =)
        
        add(botoes, BorderLayout.CENTER);
    }
    public static void main(String[] args) { new CalculadoraLayout().setVisible(true); }
}""",
        "rules": [
            "{ id: 'grid', text: 'Usar GridLayout', pattern: /GridLayout/ }",
            "{ id: 'border', text: 'Usar BorderLayout', pattern: /BorderLayout/ }",
            "{ id: 'gap', text: 'Configurar Gaps', pattern: /,\s*5,\s*5/ }"
        ]
    },
    "13": {
        "title": "Aula 13: Seletor de Arquivos e Cores",
        "subtitle": "JFileChooser, FileFilter, JColorChooser",
        "duration": "Duração: 3 Horas (2h Teoria + 1h Prática)",
        "intro": "Acesso ao Sistema de Arquivos",
        "concepts": [
            ("FileFilter", "Restringe os arquivos visíveis (ex: apenas .txt)."),
            ("SelectionMode", "Arquivos apenas, Diretórios apenas, ou ambos."),
            ("Preview", "Adicionar um painel de pré-visualização ao FileChooser (Avançado)."),
            ("ColorChooser", "Recuperar a cor selecionada (Color) para aplicar em componentes.")
        ],
        "deep_dive": """
            <h3>1. Filtrando Arquivos</h3>
            <p>Para melhorar a experiência do usuário, use <code>FileNameExtensionFilter</code>.</p>
            <div class="code-block">
            chooser.setFileFilter(new FileNameExtensionFilter("Imagens JPG e PNG", "jpg", "png"));
            </div>
            
            <h3>2. Salvando vs Abrindo</h3>
            <p>Use <code>showSaveDialog()</code> para salvar. A lógica é a mesma, mas o botão muda para 'Salvar' e o comportamento de sobrescrever arquivo pode ser tratado.</p>
        """,
        "code_example": """JButton btnCor = new JButton("Mudar Cor de Fundo");
btnCor.addActionListener(e -> {
    Color cor = JColorChooser.showDialog(this, "Escolha", Color.WHITE);
    if (cor != null) {
        getContentPane().setBackground(cor);
    }
});""",
        "activity_desc": "Crie um 'Mini Editor de Texto'. Um TextArea, um botão 'Abrir' (carrega texto do arquivo) e um botão 'Cor' (muda a cor da fonte).",
        "activity_code": """public class MiniEditor extends JFrame {
    JTextArea area;
    public MiniEditor() {
        super("Editor");
        setSize(500, 400);
        area = new JTextArea();
        
        // Crie Toolbar ou Botões
        // FileChooser para ler arquivo (Use Scanner ou Files.readString)
        // ColorChooser para area.setForeground(cor)
        
        add(new JScrollPane(area));
        add(painelBotoes, BorderLayout.NORTH);
    }
    public static void main(String[] args) { new MiniEditor().setVisible(true); }
}""",
        "rules": [
            "{ id: 'filter', text: 'Usar Filtro de Arquivo', pattern: /FileFilter/ }",
            "{ id: 'color', text: 'Usar ColorChooser', pattern: /JColorChooser/ }",
            "{ id: 'read', text: 'Ler Arquivo', pattern: /File/ }"
        ]
    },
    "14": {
        "title": "Aula 14: Bordas e Estilização",
        "subtitle": "BorderFactory, CompoundBorder",
        "duration": "Duração: 3 Horas (2h Teoria + 1h Prática)",
        "intro": "Refinando o Visual da Interface",
        "concepts": [
            ("CompoundBorder", "Combina duas bordas (ex: uma Borda Externa decorativa + uma Borda Interna vazia para margem)."),
            ("MatteBorder", "Borda sólida ou com ícones repetidos."),
            ("LineBorder", "Borda simples de cor e espessura definidas."),
            ("SoftBevelBorder", "Versão mais suave do BevelBorder (relevo).")
        ],
        "deep_dive": """
            <h3>1. Margens com Bordas</h3>
            <p>No Swing, não existe 'margin' como no CSS. Para dar espaço interno, usamos <code>EmptyBorder</code>.</p>
            
            <h3>2. Bordas Compostas</h3>
            <p>Para ter uma borda visual E um espaço, usamos CompoundBorder.</p>
            <div class="code-block">
            Border linha = BorderFactory.createLineBorder(Color.BLACK);
            Border espaco = BorderFactory.createEmptyBorder(10, 10, 10, 10);
            painel.setBorder(BorderFactory.createCompoundBorder(linha, espaco));
            </div>
        """,
        "code_example": """JPanel p = new JPanel();
// Borda com Título e alinhamento
TitledBorder titulo = BorderFactory.createTitledBorder("Dados Pessoais");
titulo.setTitleJustification(TitledBorder.CENTER);
p.setBorder(titulo);""",
        "activity_desc": "Crie um painel de 'Login' bonito. Use CompoundBorder para dar margem interna aos campos e uma TitledBorder externa. Use cores nas bordas.",
        "activity_code": """public class LoginEstiloso extends JFrame {
    public LoginEstiloso() {
        super("Login");
        setSize(300, 250);
        setLayout(new FlowLayout()); // Ou GridBagLayout
        
        JPanel p = new JPanel(new GridLayout(2, 2, 5, 5));
        // Adicione campos User/Pass
        
        // Crie uma borda composta (Linha Azul + Espaço de 20px)
        // Aplique ao painel
        
        add(p);
    }
    public static void main(String[] args) { new LoginEstiloso().setVisible(true); }
}""",
        "rules": [
            "{ id: 'compound', text: 'Usar Borda Composta', pattern: /CompoundBorder/ }",
            "{ id: 'empty', text: 'Usar EmptyBorder (Margem)', pattern: /EmptyBorder/ }",
            "{ id: 'color', text: 'Borda Colorida', pattern: /Color/ }"
        ]
    },
    "15": {
        "title": "Aula 15: Menus e Barras de Ferramentas",
        "subtitle": "JMenuBar, JToolBar, KeyStroke",
        "duration": "Duração: 3 Horas (2h Teoria + 1h Prática)",
        "intro": "Acesso Rápido e Atalhos",
        "concepts": [
            ("JToolBar", "Barra de botões com ícones (arrastável por padrão)."),
            ("Aceleradores", "Atalhos globais (Ctrl+S) configurados via <code>setAccelerator</code>."),
            ("Separadores", "Linhas visuais para agrupar itens de menu."),
            ("JCheckBoxMenuItem", "Item de menu que funciona como toggle (ligar/desligar).")
        ],
        "deep_dive": """
            <h3>1. Aceleradores de Teclado</h3>
            <p>Diferente de mnemônicos (navegação visual), aceleradores disparam a ação diretamente.</p>
            <div class="code-block">
            sair.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_F4, ActionEvent.ALT_MASK));
            </div>
            
            <h3>2. Barra de Ferramentas</h3>
            <p>Geralmente duplicam as ações mais comuns do menu. Devem usar ícones claros.</p>
        """,
        "code_example": """// ToolBar
JToolBar tools = new JToolBar();
JButton btnSave = new JButton(new ImageIcon("save.png"));
tools.add(btnSave);
add(tools, BorderLayout.NORTH);

// Menu com Checkbox
JCheckBoxMenuItem grade = new JCheckBoxMenuItem("Exibir Grade");
grade.addActionListener(e -> toggleGrade(grade.isSelected()));
menuExibir.add(grade);""",
        "activity_desc": "Crie um 'Editor de Texto Completo'. Menu (Arquivo -> Sair, Editar -> Copiar/Colar). Toolbar com botões de ícone. Área de texto no centro.",
        "activity_code": """public class EditorFinal extends JFrame {
    public EditorFinal() {
        super("Super Editor");
        setSize(600, 500);
        
        // 1. JMenuBar com Arquivo e Editar
        // 2. Atalhos (Ctrl+C, Ctrl+V)
        // 3. JToolBar com botões equivalentes
        // 4. JTextArea no Center
    }
    public static void main(String[] args) { new EditorFinal().setVisible(true); }
}""",
        "rules": [
            "{ id: 'tool', text: 'Criar JToolBar', pattern: /JToolBar/ }",
            "{ id: 'key', text: 'Definir Acelerador (KeyStroke)', pattern: /KeyStroke/ }",
            "{ id: 'check', text: 'Menu Checkbox', pattern: /JCheckBoxMenuItem/ }"
        ]
    }
}

def generate_html(lesson_id, data):
    # Generate Grid HTML
    grid_html = ""
    for title, desc in data["concepts"]:
        grid_html += f"""
                <div class="grid-item">
                    <h3>{title}</h3>
                    <p>{desc}</p>
                </div>"""

    # Generate Rules JS
    rules_js = ",\n".join(data["rules"])

    html = f"""<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{data['title']}</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .code-block {{
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 0.9rem;
            white-space: pre-wrap;
            margin: 10px 0;
        }}
    </style>
</head>
<body>
    <img src="logo_senai.png" alt="Logo SENAI" class="senai-logo">
    <div class="progress-bar" id="progressBar"></div>

    <div class="slide-container">
        
        <!-- Slide 1: Capa -->
        <div class="slide active">
            <h1>{data['title']}</h1>
            <h2>{data['subtitle']}</h2>
            <div style="width: 100%; height: 300px; background: #004587; display: flex; justify-content: center; align-items: center; color: white; border-radius: 10px; margin-top: 20px;">
                <h1 style="color: white;">Aula {lesson_id}</h1>
            </div>
            <div style="background: #eee; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
                <p><strong>{data['duration']}</strong></p>
                <p>{data['intro']}</p>
            </div>
        </div>

        <!-- Slide 2: Conceitos Fundamentais -->
        <div class="slide">
            <h2>Conceitos Fundamentais (Teoria)</h2>
            <div class="grid-layout">
                {grid_html}
            </div>
        </div>

        <!-- Slide 3: Aprofundamento -->
        <div class="slide">
            <h2>Aprofundamento Técnico</h2>
            <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                {data['deep_dive']}
            </div>
        </div>

        <!-- Slide 4: Exemplos Práticos -->
        <div class="slide">
            <h2>Exemplos de Implementação</h2>
            <p>Analise o código abaixo para entender a aplicação:</p>
            
            <div class="code-block">
{data['code_example']}
            </div>
        </div>

        <!-- Slide 5: Atividade Prática -->
        <div class="slide">
            <h2>Atividade Prática (1 Hora)</h2>
            <div style="background: #e3f2fd; padding: 15px; border-left: 5px solid #2196f3; margin-bottom: 15px;">
                <strong>Desafio:</strong> {data['activity_desc']}
            </div>
            
            <!-- Feedback Visual (Termômetro) -->
            <div id="validation-feedback" style="background: #f8f9fa; padding: 10px; border: 1px dashed #ccc; border-radius: 5px; margin-bottom: 10px; font-size: 0.9rem; color: #555;">
                🌡️ <strong>Termômetro de Código:</strong> As marcas abaixo (✅) indicam o uso correto dos componentes exigidos.
            </div>

            <textarea id="activity-{lesson_id}" class="code-input">
/*
 * ATIVIDADE PRÁTICA - AULA {lesson_id}
 * Tempo estimado: 60 minutos
 */

import javax.swing.*;
import javax.swing.border.*; // Para bordas
import javax.swing.filechooser.*; // Para filtros
import java.awt.*;
import java.awt.event.*;
import java.io.File; 

{data['activity_code']}
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
        <span id="slideNumber">1 / 6</span>
        <button id="btnNext">Próximo</button>
    </div>

    <script src="assets/js/script.js"></script>
    <script>
        window.activityRules = {{
            'activity-{lesson_id}': [
                {rules_js}
            ]
        }};
    </script>
</body>
</html>
"""
    return html

# Generate all files
for lid, data in lessons_data.items():
    filename = f"{lid}_{data['title'].split(':')[1].strip().lower().replace(' ', '_').replace('á','a').replace('ç','c').replace('õ','o').replace('ê','e')}.html"
    # Mapping filename manual fix to match existing files to overwrite them correctly
    if lid == "04": filename = "04_labels_icons.html"
    if lid == "05": filename = "05_botoes.html"
    if lid == "06": filename = "06_bounded_range.html"
    if lid == "07": filename = "07_listas_combos.html"
    if lid == "08": filename = "08_containers.html"
    if lid == "09": filename = "09_internal_frames.html"
    if lid == "10": filename = "10_dialogos.html"
    if lid == "11": filename = "11_paineis_especiais.html"
    if lid == "12": filename = "12_layouts.html"
    if lid == "13": filename = "13_choosers.html"
    if lid == "14": filename = "14_bordas.html"
    if lid == "15": filename = "15_menus.html"

    print(f"Gerando {filename} Expandido...")
    content = generate_html(lid, data)
    with open(os.path.join(output_dir, filename), "w", encoding="utf-8") as f:
        f.write(content)

print("Todas as aulas foram expandidas para 3 horas de duração!")
