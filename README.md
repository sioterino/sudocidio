# SUDOCÍDIO

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Phaser](https://img.shields.io/badge/Phaser-20232A?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![WebPush](https://img.shields.io/badge/WebPush-010101?style=for-the-badge&logo=javascript&logoColor=F7DF1E)

**SUDOCÍDIO** é um puzzle estratégico que combina a restrição espacial do *Sudoku* com a dedução investigativa de jogos como *Clue* e *Murdle*.

Dois jogadores competem simultaneamente em um tabuleiro gerado proceduralmente para descobrir: **quem é o assassino, qual foi a arma e em qual cômodo ocorreu o crime.** O jogo exige raciocínio rápido, organização espacial e permite o uso de mecânicas de sabotagem para atrapalhar o adversário em tempo real.

O projeto foi desenvolvido como trabalho acadêmico (IFSC) e está integrado ao sistema de créditos e autenticação da **Feira de Jogos** via Google OAuth 2.0.

---

## Como Jogar

1. Acesse a página inicial e faça login com sua conta Google
2. Clique em **Entrar no Caso** — o jogo entra automaticamente na fila de matchmaking
3. Quando dois jogadores estiverem na fila, a partida começa com o mesmo mapa para os dois
4. Use as **dicas** para deduzir o assassino, a arma e o cômodo do crime
5. Arraste as **peças** para as posições corretas no mapa
6. Use **sabotagens** para dificultar a vida do adversário
7. Faça a **acusação** antes do tempo acabar — ou antes do oponente!
8. Ao vencer, tijolinhos são creditados automaticamente na sua conta da Feira de Jogos

---

## Visão Geral

O jogo foi construído como um projeto híbrido utilizando **Next.js**, **Phaser** e **Socket.IO**. O repositório possui três partes principais:

- O aplicativo Next.js na raiz, servido pelo arquivo `server.ts`
- O serviço de tempo real com Socket.IO e Web Push em `server/server.ts`
- O motor de mapas em Phaser dentro de `mapa/`

Os dois arquivos `server.ts` são importantes:

- `server.ts` — inicia o servidor HTTP customizado do Next.js na porta **3000**
- `server/server.ts` — inicia o serviço multiplayer Socket.IO na porta **3001**

---

## Estrutura do Projeto

```text
sudocidio/
├── README.md
├── package.json                 # Scripts e dependências do app Next.js
├── server.ts                    # Servidor HTTP customizado do Next.js
├── .env.example
├── next.config.ts
├── tsconfig.json
├── lib/
│   └── pushNotification.ts
├── public/
│   ├── sw.js                    # Service Worker para notificações push
│   └── assets/                  # Recursos gráficos
├── src/
│   ├── app/
│   │   ├── page.tsx             # Menu principal (login Google + matchmaking)
│   │   ├── game/page.tsx        # Tela principal do jogo
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── menu/                # Componentes do menu em pixel art
│   │   └── gameplay/            # Painéis, wrapper Phaser e modais
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Google OAuth + token para Feira de Jogos
│   │   ├── WebSocketContext.tsx # Cliente Socket.IO e matchmaking
│   │   └── MusicPlayerContext.tsx
│   ├── hooks/
│   │   ├── useMultiplayer.ts
│   │   └── useMusicPlayer.ts
│   └── types/
│       └── game.ts
├── server/
│   ├── package.json
│   ├── server.ts                # Matchmaking, eventos e Web Push
│   ├── .example.env
│   └── tsconfig.json
├── mapa/
│   ├── package.json
│   ├── webpack.config.js
│   ├── assets/
│   └── src/
└── docs/
    ├── extensoes.md
    ├── gdd.pdf
    ├── mensagens.md
    └── ost.md
```

---

## Pré-requisitos

- Node.js 18+
- npm
- Navegador compatível com Service Workers
- Duas sessões do navegador para testes multiplayer

---

## Instalação

```bash
# Raiz
npm install

# Servidor multiplayer
cd server && npm install && cd ..

# Motor de mapas (opcional)
cd mapa && npm install && cd ..
```

---

## Arquivos de Ambiente

### Raiz (`.env`)

```bash
cp .example.env .env
```

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_publica
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

Para testes em rede local, substitua `localhost` pelo IP da máquina host:

```env
NEXT_PUBLIC_WS_URL=http://192.168.0.10:3001
```

### Servidor (`server/.env`)

```bash
cd server && cp .example.env .env
```

```env
VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada
VAPID_MAILTO=mailto:voce@exemplo.com
```

Para gerar as chaves VAPID:

```bash
npx web-push generate-vapid-keys
```

---

## Desenvolvimento

### Terminal 1 — Aplicação Next.js

```bash
npm run dev
```

> [!IMPORTANT]
> `npm run dev` executa `tsx server.ts`, não `next dev`.

Acesse: `http://localhost:3000`

### Terminal 2 — Servidor Socket.IO

```bash
cd server
npx tsx server.ts
```

Acesse: `http://localhost:3001`

---

## Produção

### Terminal 1 — Aplicação Next.js

```bash
# Gera o build otimizado
npm run build

# Inicia o servidor de produção
npm run start
```

Acesse: `http://localhost:3000`

### Terminal 2 — Servidor Socket.IO

O servidor multiplayer não precisa de build — rode diretamente:

```bash
cd server
npx tsx server.ts
```

Acesse: `http://localhost:3001`

> [!NOTE]
>  Em produção, configure `NEXT_PUBLIC_WS_URL` com o endereço público do servidor Socket.IO antes de rodar o build.

---

## Scripts

### Projeto principal

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `tsx server.ts` | Inicia em desenvolvimento |
| `build` | `next build` | Gera build de produção |
| `start` | `next start` | Inicia build de produção |
| `clean` | `npx rimraf .next && tsx server.ts` | Limpa cache e reinicia |
| `lint` | `next lint` | Verifica o código |

### Motor de mapas (`mapa/`)

| Script | Descrição |
|--------|-----------|
| `npm run build` | Compila com Webpack |
| `npm run watch` | Compila em modo watch |
| `npm run serve` | Serve em `http://localhost:8085` |

---

## Fluxo de Autenticação (Feira de Jogos)

1. Jogador acessa a página inicial
2. Clica em **Entrar com Google** → popup OAuth do Google
3. Token JWT armazenado no `AuthContext`
4. Botão **Entrar no Caso** é liberado
5. Ao vencer uma partida, o `GameOverModal` usa o token para creditar tijolinhos via `POST /api/v2/credit`

---

## Fluxo de Jogo

1. Jogador acessa `/` e faz login com Google
2. Clica em **Entrar no Caso** → roteado para `/game`
3. Socket.IO conecta ao servidor na porta 3001
4. Notificações push registradas
5. `JOIN_ROOM` enviado ao servidor
6. Matchmaking: dois jogadores na fila → seed gerada
7. `GAME_START` recebido → Phaser inicializa o mapa
8. Phaser e React se comunicam via `CustomEvent`
9. Socket.IO sincroniza progresso, sabotagens e resultado
10. Vitória → tijolinhos creditados na Feira de Jogos

---

## Eventos Socket.IO

| Evento | Direção | Descrição |
|--------|---------|-----------|
| `JOIN_ROOM` | Cliente → Servidor | Entra na fila de matchmaking |
| `ROOM_JOINED` | Servidor → Cliente | Confirmação de entrada na sala |
| `GAME_START` | Servidor → Cliente | Partida iniciada com seed |
| `PIECE_PLACED` | Cliente → Servidor | Peça posicionada |
| `OPPONENT_PROGRESS` | Servidor → Cliente | Progresso do adversário |
| `SEND_SABOTAGE` | Cliente → Servidor | Envia sabotagem |
| `RECEIVE_SABOTAGE` | Servidor → Cliente | Recebe sabotagem |
| `MAKE_ACCUSATION` | Cliente → Servidor | Faz acusação |
| `SURRENDER` | Cliente → Servidor | Desiste da partida |
| `GAME_OVER` | Servidor → Cliente | Fim de jogo |

---

## Pontos de Atenção

- Existem **dois arquivos `server.ts`** — ambos precisam estar rodando para o multiplayer funcionar
- Dependências precisam ser instaladas na raiz, em `server/` e em `mapa/` separadamente
- `public/assets/` contém os recursos usados em execução; `mapa/assets/` contém os recursos-fonte
- O pacote `mapa/` usa Phaser 3; o projeto principal lista Phaser 4
- Em desenvolvimento, `game/page.tsx` pode chamar `findMatch()` duas vezes durante a montagem — comportamento esperado no React StrictMode

---

## Equipe de Desenvolvimento

- **Júlia Manuela Turnes**
- **Sofia Alves Toreti**

---

*Projeto desenvolvido para apresentação acadêmica e demonstração na Feira de Jogos — 2026.*
