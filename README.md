# SUDOCÍDIO


## Overview

### The elevator Pitch
Um jogo multiplayer competitivo de dedução lógica em tempo real, onde dois jogadores disputam para organizar suspeitos e armas em uma mansão estruturada como um sudoku espacial e descobrir quem é o assassino antes do adversário.

### Project Description (Detailed)
O projeto é um jogo multiplayer competitivo inspirado em lógica dedutiva e no conceito estrutural do sudoku, substituindo números por suspeitos e armas em um cenário investigativo. A grade representa uma casa ou mansão dividida em cômodos de formatos variados. Cada quadrado da grade (3x3 do sudoku original) corresponde a um espaço físico da casa, e os grupos de células formam salas. O objetivo é posicionar corretamente todos os suspeitos e armas respeitando as regras de linha e coluna, até que reste apenas um único quadrado vazio, que será o local onde a vítima foi encontrada.

Cada suspeito e cada arma devem aparecer apenas uma vez por linha e por coluna, mas podem compartilhar a mesma sala com outros elementos. Além disso, cada suspeito está logicamente associado a uma arma específica. O assassino é determinado pela interseção de três fatores: o suspeito deve estar na mesma sala que a vítima, e sua arma associada também deve estar nessa mesma sala. O jogador deve deduzir corretamente o posicionamento de todos os elementos para identificar o culpado, o local do crime e a arma utilizada.

As partidas são disputadas em tempo real entre dois jogadores que recebem o mesmo mapa gerado proceduralmente. Os jogadores ganham pontos ao posicionar corretamente suspeitos e armas, e perdem pontos por erros. Ao final, ambos realizam uma acusação formal indicando o assassino, o local do crime e a arma. Acusações corretas garantem pontuação adicional, enquanto erros geram penalidades significativas.

Para intensificar a competição, o jogo inclui mecânicas estratégicas de interferência e manipulação de informação. Os jogadores podem utilizar habilidades limitadas, como revelar parcialmente uma pista, bloquear temporariamente uma linha ou sala, inserir uma pista falsa momentânea na interface do adversário ou embaralhar visualmente dois elementos do tabuleiro inimigo por alguns segundos. Essas ações não alteram a solução lógica real, mas criam pressão, confusão e decisões estratégicas sob limite de tempo.

O foco principal do projeto é combinar raciocínio lógico, leitura espacial e tomada de decisão competitiva em um ambiente de alta tensão. O sistema é estruturado para garantir solução única a cada partida, mantendo equilíbrio entre desafio intelectual e dinamismo multiplayer.

---

### Theme / Setting / Genre
* **Tema:** investigação de assassinato e dedução lógica;
Tipo de jogo: multiplayer competitivo em tempo real com mecânicas estratégicas de interferência;
* **Ambientação:** o jogo se passa em uma mansão ou prédio fictício representado por uma grade modular. Cada partida gera uma nova configuração espacial de salas e objetos, garantindo variedade e rejogabilidade. Os ambientes incluem cômodos como quartos, cozinhas, banheiros e salas de estar, que funcionam como agrupamentos lógicos dentro da estrutura do tabuleiro;
* **Gênero:** puzzle estratégico multiplayer com foco em dedução lógica, organização espacial e competição sob pressão de tempo.

---

### Core Gameplay Mechanics Brief
O jogador irá organizar suspeitos e armas dentro de uma grade que representa uma mansão, seguindo regras de restrição por linha e coluna, analisando pistas lógicas e competindo em tempo real contra outro jogador para descobrir o assassino, o local do crime e a arma utilizada antes do adversário.

* **Posicionamento Lógico Espacial:** o jogador posiciona suspeitos e armas na grade respeitando as regras principais: cada elemento deve aparecer apenas uma vez por linha e por coluna. As células são agrupadas em salas, que funcionam como unidades espaciais relevantes para a dedução final. O jogador deve analisar pistas para determinar as posições corretas.
* **Associação Suspeito e Arma:** cada suspeito possui uma arma associada. O jogador deve deduzir não apenas onde cada elemento está na grade, mas também como essas associações se relacionam espacialmente. O assassino é determinado pela interseção entre suspeito, arma e sala onde a vítima foi encontrada.
* Competição em Tempo Real: dois jogadores resolvem o mesmo tabuleiro simultaneamente. Pontos são concedidos por posicionamentos corretos e penalidades aplicadas por erros. Ao final, os jogadores realizam uma acusação formal (suspeito, sala e arma). A dinâmica em tempo real gera pressão e recompensa decisões rápidas e precisas.
* **Interferência Estratégica:** Os jogadores possuem habilidades limitadas que permitem manipular informação ou gerar pressão no adversário sem alterar a solução lógica real, apenas criando tensão e decisões estratégicas, como:
    *  Inserir pista falsa temporária;
    *  Bloquear linha ou sala por alguns segundos;
    *  Revelar informação parcial;
    *  Embaralhar visualmente dois elementos no tabuleiro inimigo.

---

### Targeted platforms
* Web Browse (primária)
* Mobile Web
* Mobile Application (possibilidade)

A plataforma principal será Web, pois permite fácil acesso, testes rápidos, implementação simplificada de multiplayer em tempo real e distribuição sem necessidade de instalação. Além disso, facilita a avaliação acadêmica e a demonstração do projeto.

A estrutura baseada em grade e interface limpa também é altamente compatível com dispositivos móveis, possibilitando futura adaptação para Mobile Web ou aplicativo nativo. O design modular da interface favorece a responsividade e escalabilidade entre diferentes tamanhos de tela.

---

### Monetization model
Por se tratar de um projeto acadêmico, o jogo será desenvolvido como um protótipo funcional sem monetização ativa. Em um cenário comercial futuro, o modelo mais adequado seria através da compra única ou modelo com microtransações cosméticas de personalização, mantendo a integridade competitiva e evitando mecânicas pay-to-win.

---

### Project Scope 
* **Cost:** R$ 0,00 (Projeto acadêmico utilizando licenças educacionais gratuitas).
* **Time Scale:** Aproximadamente 3 a 4 meses.
* **Team Size:** 2 Desenvolvedoras.
* **Core Team — Júlia Manuela Turnes:** Programação de interface e lógica do jogo.
* **Core Team — Sofia Alves Toreti:** Criação visual de mapas e personagens, programação de interface e lógica do jogo.
* **Licenses / Hardware:** Adobe Photoshop (Creative Cloud) e  repositório no GitHub para controle de versão.

---
	
### Influences
#### SUDOKU — Jogo (Puzzle Lógico)
Sudoku influencia diretamente a estrutura central do jogo. A mecânica de restrição por linha e coluna, bem como a organização espacial em subgrupos (salas), deriva do sistema clássico do sudoku. No entanto, em vez de números, o projeto utiliza suspeitos e armas como elementos lógicos. A influência principal está na clareza estrutural, na lógica dedutiva baseada em exclusão e na garantia de solução única para cada puzzle.

### MURDOKU — Jogo/Literatura (Livro de Puzzle Lógico)
Murdoku influencia o projeto ao substituir números por personagens dentro de uma narrativa de assassinato. Essa ideia de transformar um sudoku em um cenário investigativo é a base conceitual do jogo. O projeto expande esse conceito ao adicionar armas, múltiplos suspeitos por sala e uma camada competitiva multiplayer.

#### MURDLE — Jogo (Puzzle de Dedução)
Murdle influencia o sistema de pistas e a lógica de dedução cruzada entre suspeito, arma e local do crime. Diferentemente do sudoku, Murdle trabalha com tabelas de associação e eliminação lógica, o que inspira o sistema de vínculos entre suspeitos e armas no projeto.

---

### What sets this project apart from other games?
1. **Multiplayer competitivo em tempo real:** Diferente de Sudoku, Murdoku ou Murdle, o foco principal é a competição simultânea entre dois jogadores, introduzindo pressão e tomada de decisão estratégica.
2. **Integração de armas ao modelo de Murdoku:** O projeto expande o conceito original ao adicionar uma segunda camada lógica (armas associadas aos suspeitos), aumentando a complexidade dedutiva.
3. **Permissão de múltiplos suspeitos por sala:** Ao contrário do sudoku tradicional, as salas funcionam como agrupamentos espaciais e não como restrições exclusivas, criando uma nova dinâmica investigativa.
4. **Narrativa integrada ao puzzle:** A ausência de números e a substituição por uma estrutura investigativa transformam o exercício lógico em uma experiência temática.
5. **Sistema de interferência estratégica:** Mecânicas como pistas falsas temporárias e bloqueios criam uma camada de meta-jogo inexistente nos puzzles tradicionais.

---

## Story and Gameplay

### Story (Brief)
Um assassinato ocorreu em uma casa, e a cena do crime foi traduzida para uma grade espacial lógica. Dois investigadores rivais chegam ao local simultaneamente. O objetivo é cruzar as pistas para organizar corretamente a cena, identificar o assassino, a arma e o local do crime, e fazer a acusação correta antes do adversário.

### Story (Detailed)
O jogo se passa em um cenário investigativo que representa uma casa ou mansão dividida em cômodos de formatos variados. Ocorreu um assassinato, e o ambiente é estruturado como um quebra-cabeça espacial. O jogador assume o papel de um investigador que precisa analisar as pistas lógicas para deduzir a posição exata de cada suspeito e arma dentro do local, sabendo que a vítima se encontra em um quadrado específico. A narrativa se desenvolve através da competição e do limite de tempo: enquanto o jogador tenta organizar e solucionar o caso, um adversário em tempo real disputa para resolver o mesmo mistério, podendo utilizar táticas de interferência e manipulação de informações para atrapalhar a investigação rival.

---

### Gameplay (Brief)
Os jogadores recebem o mesmo mapa procedural e organizam suspeitos e armas na grade, respeitando regras de restrição por linha, coluna e sala. A partida ocorre em tempo real. Acertos de posicionamento geram pontos que podem ser usados para ativar habilidades de interferência no tabuleiro do oponente. Vence quem fizer a acusação formal correta (assassino, arma e sala) primeiro.

### Gameplay (Detailed)
O mapa do jogo é uma grade onde células adjacentes formam salas específicas. O jogador deve arrastar e posicionar suspeitos e armas, garantindo que cada elemento apareça apenas uma vez por linha e por coluna. Diferente do Sudoku clássico, múltiplos elementos podem compartilhar a mesma sala. Cada suspeito está logicamente associado a uma arma. Para vencer, o jogador precisa identificar a interseção correta: o suspeito e sua respectiva arma devem estar na mesma sala em que a vítima foi encontrada. Durante a partida simultânea, posicionamentos corretos concedem pontos. O jogador pode usar esses pontos estrategicamente para prejudicar o adversário, ativando bloqueios, inserindo pistas falsas ou embaralhando elementos visuais da tela inimiga. No fim, o jogador deve submeter uma acusação formal. Acertos garantem a vitória ou pontuação adicional, enquanto erros geram penalidades significativas, dando vantagem ao oponente.

---

### Core Gameplay Mechanics (Detailed)
1. **Posicionamento Lógico Espacial **
   * **Details** A fundação mecânica baseada no cruzamento de regras de linha, coluna e áreas (salas).
   * **How it works:** O jogador move as peças (suspeitos e armas) pelo tabuleiro. O sistema valida se as peças desrespeitam a regra principal (não repetir na mesma linha/coluna). A formação das salas dita a relação de proximidade necessária para cruzar pistas.

2. **Associação e Dedução**
    * **Details** A mecânica de resolução do mistério, onde o jogador conecta os elementos para encontrar o culpado.
    * **How it works:** O jogador não precisa apenas alocar peças, mas deduzir ligações (Ex: "Suspeito A tem a Arma B"). O assassino é determinado exclusivamente quando um suspeito e sua arma associada são colocados na mesma sala onde a vítima está.

3. **Interferência Estratégica**
    * **Details** Mecânicas ativas para criar pressão, confusão e manipular a informação na tela do adversário, sem alterar a solução matemática do puzzle.
    * **How it works:** Habilidades acionadas por botões. Incluem: revelar informação parcial de uma pista, bloquear temporariamente uma linha/sala para impedir jogadas, inserir uma pista falsa momentânea na tela do outro, ou embaralhar visualmente dois elementos no tabuleiro inimigo por alguns segundos.

4. **Acusação Formal e Penalidades**
    * **Details** O momento de encerramento da partida e condição de vitória/derrota.
    * **How it works:** O jogador seleciona o trio final (Suspeito, Sala e Arma). O sistema valida a resposta. Se estiver exata, o jogador recebe bônus ou vence a partida. Se errar, sofre uma penalidade significativa (ex: bloqueio temporário de ações), penalizando "chutes" e recompensando a precisão lógica.

---

### Graphic style
O jogo adotará um estilo visual 2D Pixel Art Top-Down. A interface será modular e limpa para facilitar a leitura espacial da grade sob pressão de tempo. Os ambientes da mansão (quartos, cozinhas, etc.) serão diferenciados visualmente por texturas de piso e adereços na grade. Os suspeitos e a vítima serão representados por sprites claros, complementados por balões ou indicadores tipográficos, garantindo que as informações lógicas se destaquem rapidamente para o jogador.

---

## Assets Needed

### 2D
1. **Textures:** Tilemap base da grade; texturas de chão/parede para os cômodos (ex: Garagem, Sala, Cozinha). Sprites de móveis para contextualizar os ambientes.
2. **Sprites:** Spritesheet dos Suspeitos, sprite da Vítima e ícones das Armas.

### Logos
Logo do jogo ("SUDOCÍDIO") em arte pixelada.

### HUD
1. Painel de status do oponente (barra de progresso).
2. Botões de Habilidades de Interferência.
3. Interface de Acusação Formal.

### Sound
1. **Ambient:** Trilha sonora de investigação, que acelera conforme o tempo passa ou a tensão aumenta.
2. **Player:** Som de clique ao arrastar/soltar peças na grade, feedback sonoro de acerto/erro, e efeitos de alerta ao receber uma interferência do adversário.

### Code
1. **Core Scripts:** Algoritmo gerador procedural do mapa e pistas lógicas (garantindo solução única). Validador lógico do tabuleiro.
2. **Network Scripts:** Lógica de sincronização em tempo real para o multiplayer.
3. **UI Scripts:** Gerenciador do Drag & Drop e das habilidades de interferência.

---

## Schedule and Milestones
1. **Objective #1: Core Logic Engine**
> Time Scale: Meses 1
* **Milestone 1:** Algoritmo de geração procedural do tabuleiro e validação lógica.
* **Milestone 2:** Sistema capaz de gerar puzzles com solução única e cruzar suspeito, arma e sala.

3. **Objective #2: Minimum Viable Product (MVP)**
> Time Scale: Mês 2
* **Milestone 1:** Interface básica implementada (arrastar e soltar funcionando no grid).
* **Milestone 2:** Partida local completa jogável do início ao fim com mecânica de acusação.

4. **Objective #3: Alpha version**
> Time Scale: Mês 3
* **Milestone 1:** Conexão multiplayer funcional; dois jogadores no mesmo puzzle.
* **Milestone 2:** Sincronização de progresso entre as telas.

5. **Objective #4: Beta version**
> Time Scale: Mês 4
* **Milestone 1:** Sistema de Habilidades/Interferência Estratégica funcionando via rede.
* **Milestone 2:** Assets finais integrados (Pixel art, HUD e sons).

6. **Objective #5: Complete**
> Time Scale: Final do semestre
* **Milestone 1:** Playtest de balanceamento, ajuste de penalidades e bugs de rede.

---
