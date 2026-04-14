# 🔪 SUDOCÍDIO

> **Um jogo multiplayer competitivo de dedução lógica em tempo real.**

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

## 📌 Sobre o Projeto

**SUDOCÍDIO** é um puzzle estratégico que combina a restrição espacial do *Sudoku* com a dedução investigativa de jogos como *Clue* e *Murdle*. 

Dois jogadores competem simultaneamente em um tabuleiro gerado proceduralmente para descobrir: **Quem é o assassino, qual foi a arma e em qual cômodo ocorreu o crime.** O jogo exige raciocínio rápido, organização espacial e permite o uso de mecânicas de sabotagem (como bloqueios e pistas falsas) para atrapalhar o adversário em tempo real.

O projeto foi desenvolvido como trabalho acadêmico (IFSC) e está integrado ao sistema de créditos e autenticação da Feira de Jogos.

## 🏗️ Arquitetura

Para garantir uma latência baixíssima no modo multijogador competitivo, o projeto utiliza uma arquitetura híbrida focada em performance:
* **Frontend:** React via Next.js (App Router), gerenciamento de estado global com `Zustand` e mecânicas de *drag-and-drop* com `@dnd-kit/core`.
* **Backend (Custom Server):** Um servidor Node.js injetado na raiz do Next.js. Ele gerencia o estado das partidas ativas diretamente na **memória RAM** (dispensando banco de dados relacional durante o *gameplay*) e processa o algoritmo de geração procedural de puzzles (matrizes com solução única).
* **Comunicação de Baixa Latência:** WebTransport (HTTP/3 / QUIC) para broadcast de eventos em tempo real.
* **Autenticação:** Integração OAuth 2.0 (via provedor da Feira de Jogos).

---

## 🚀 Como Iniciar o Projeto

### Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:
* [Node.js](https://nodejs.org/en/) (Versão 18 ou superior)
* Um gerenciador de pacotes (`npm`, `yarn` ou `pnpm`)

### Instalação

1. Clone o repositório para a sua máquina:
```bash
git clone [https://github.com/sua-conta/sudocidio.git](https://github.com/sua-conta/sudocidio.git)
```

2. Acesse a pasta do projeto:
```bash
cd sudocidio
```

3. Instale as dependências:
```bash
npm install
```

### Executando Localmente (Desenvolvimento)

Como o projeto utiliza um *Custom Server* para segurar a partida na memória, o comando de desenvolvimento inicializa tanto o servidor Node quanto a compilação do Next.js simultaneamente.

Inicie a aplicação com o comando:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

---

## 📂 Estrutura de Diretórios

```text
sudocidio/
├── server.ts               # Custom Server (Node.js) - O motor real-time na RAM
├── src/
│   ├── app/                # As rotas e páginas da sua aplicação
│   │   ├── api/            # rotas do OAuth da Feira
│   │   ├── jogo/           # page.tsx -> carrega o tabuleiro
│   │   └── page.tsx        # Tela inicial do site
│   │
│   ├── components/         
│   │   ├── ui/             
│   │   └── game/           
│   │       ├── Board.tsx        
│   │       ├── Cell.tsx          
│   │       ├── DraggablePiece.tsx
│   │       ├── SkillPanel.tsx    
│   │       └── AccusationForm.tsx
│   │
│   ├── lib/                # Geração Procedural e Validador Lógico
│   ├── store/              # useGameStore.ts (Zustand)
│   └── types/       
└── public/                 # Assets estáticos
```

---

## 👩‍💻 Equipe Desenvolvedora

* **Júlia Manuela Turnes** 
* **Sofia Alves Toreti**

---
*Projeto desenvolvido para apresentação acadêmica e demonstração na Feira de Jogos - 2026.*
