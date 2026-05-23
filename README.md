# 🔪 SUDOCÍDIO

> **Um jogo multiplayer competitivo de dedução lógica em tempo real.**

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Phaser](https://img.shields.io/badge/Phaser-20232A?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

## 📌 Sobre o Projeto

**SUDOCÍDIO** é um puzzle estratégico que combina a restrição espacial do *Sudoku* com a dedução investigativa de jogos como *Clue* e *Murdle*.

Dois jogadores competem simultaneamente em um tabuleiro gerado proceduralmente para descobrir: **quem é o assassino, qual foi a arma e em qual cômodo ocorreu o crime.** O jogo exige raciocínio rápido, organização espacial e permite o uso de mecânicas de sabotagem (bloqueios, embaralhamentos e ofuscamento de tela) para atrapalhar o adversário em tempo real.

O projeto foi desenvolvido como trabalho acadêmico (IFSC) e está integrado ao sistema de créditos e autenticação da Feira de Jogos.

---

## 🏗️ Arquitetura

O projeto utiliza uma arquitetura híbrida com dois servidores independentes:

- **Frontend:** Next.js (App Router) com renderização client-side. O mapa é gerado e renderizado via **Phaser 3**, com geração procedural baseada em seed — garantindo que ambos os jogadores recebam o mesmo tabuleiro.
- **Servidor WebSocket:** Node.js + **Socket.IO** dedicado ao matchmaking e comunicação em tempo real. Gerencia a fila de jogadores, cria salas, sincroniza a seed e transmite eventos (progresso, sabotagens, fim de jogo) entre os clientes.
- **Comunicação:** WebSocket bidirecional de baixa latência. Todos os eventos de jogo (peça colocada, sabotagem enviada, acusação, desistência) passam pelo servidor, que os redistribui apenas para os jogadores da mesma sala.
- **Geração Procedural:** A seed é gerada pelo servidor no momento em que os dois jogadores são emparelhados e enviada simultaneamente a ambos — garantindo mapas idênticos sem nenhuma sincronização extra.

---

## 🚀 Como Iniciar o Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) v18 ou superior
- `npm`, `yarn` ou `pnpm`

### Instalação

```bash
git clone https://github.com/sua-conta/sudocidio.git
cd sudocidio
npm install
```

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

Para jogar em rede local, substitua `localhost` pelo seu IP local (ex: `192.168.1.100`):

```env
NEXT_PUBLIC_WS_URL=http://192.168.1.100:3001
```

### Executando em Desenvolvimento

O projeto requer dois processos rodando simultaneamente:

```bash
# Terminal 1 — Frontend Next.js
npm run dev

# Terminal 2 — Servidor WebSocket
npx tsx watch server.ts
```

O frontend estará disponível em `http://localhost:3000`.  
O servidor WebSocket escuta na porta `3001`.

### Executando em Produção (recomendado para jogar em rede)

```bash
npm run build
npm run start
```

---

## 🎮 Como Jogar

1. Acesse `http://localhost:3000/game` (ou o IP da máquina host na rede local)
2. O jogo entra automaticamente na fila de matchmaking
3. Quando dois jogadores estiverem na fila, a partida começa com o mesmo mapa para os dois
4. Use as **dicas** para deduzir o assassino, a arma e o cômodo do crime
5. Arraste as **peças** para as posições corretas no mapa
6. Use **sabotagens** para dificultar a vida do adversário
7. Faça a **acusação** antes do tempo acabar — ou antes do oponente!

---

## 🌐 Jogar em Rede Local

1. Descubra seu IP local: `ipconfig` (Windows) ou `ip a` (Linux/Mac)
2. Atualize o `.env.local` com seu IP
3. Reinicie os servidores
4. O segundo jogador acessa `http://SEU_IP:3000/game` no navegador

---

## 📂 Estrutura de Diretórios

```text
sudocidio/
├── server-ws.ts            # Servidor WebSocket (Socket.IO) — matchmaking e tempo real
├── .env.local              # Variáveis de ambiente (não commitado)
├── src/
│   ├── app/
│   │   ├── game/           # page.tsx — tela principal de jogo
│   │   └── page.tsx        # Tela inicial / menu
│   ├── components/
│   │   └── gameplay/       # TopBar, CluesPanel, PiecesPanel, SabotagePanel, etc.
│   ├── contexts/
│   │   └── WebSocketContext.tsx  # Conexão e eventos Socket.IO
│   ├── hooks/
│   │   └── useMultiplayer.ts     # Hook de matchmaking e ações multiplayer
│   └── types/
└── mapa/
    └── src/
        ├── scenes/
        │   ├── game.scene.ts     # Cena principal do Phaser (lê seed do servidor)
        │   └── preload.scene.ts
        └── generators/
            └── map.generator.ts  # Geração procedural por seed
```

---

## 👩‍💻 Equipe Desenvolvedora

- **Júlia Manuela Turnes**
- **Sofia Alves Toreti**

---

*Projeto desenvolvido para apresentação acadêmica e demonstração na Feira de Jogos — 2026.*
