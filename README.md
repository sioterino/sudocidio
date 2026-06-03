# SUDOCÍDIO

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Phaser](https://img.shields.io/badge/Phaser-20232A?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![WebPush](https://img.shields.io/badge/WebPush-010101?style=for-the-badge&logo=javascript&logoColor=F7DF1E)

**SUDOCÍDIO** é um puzzle estratégico que combina a restrição espacial do *Sudoku* com a dedução investigativa de jogos como *Clue* e *Murdle*.

Dois jogadores competem simultaneamente em um tabuleiro gerado proceduralmente para descobrir: **quem é o assassino, qual foi a arma e em qual cômodo ocorreu o crime.** O jogo exige raciocínio rápido, organização espacial e permite o uso de mecânicas de sabotagem (bloqueios, embaralhamentos e ofuscamento de tela) para atrapalhar o adversário em tempo real.

O projeto foi desenvolvido como trabalho acadêmico (IFSC) e está integrado ao sistema de créditos e autenticação da Feira de Jogos.

---

## Como Jogar

1. Acesse `http://localhost:3000/game` (ou o IP da máquina host na rede local)
2. O jogo entra automaticamente na fila de matchmaking
3. Quando dois jogadores estiverem na fila, a partida começa com o mesmo mapa para os dois
4. Use as **dicas** para deduzir o assassino, a arma e o cômodo do crime
5. Arraste as **peças** para as posições corretas no mapa
6. Use **sabotagens** para dificultar a vida do adversário
7. Faça a **acusação** antes do tempo acabar — ou antes do oponente!

---

## Visão Geral

O jogo foi construído como um projeto híbrido utilizando **Next.js**, **Phaser** e **Socket.IO**. O jogo combina um quebra-cabeça espacial semelhante ao Sudoku com um mistério de assassinato: cada jogador recebe a mesma mansão gerada proceduralmente e precisa deduzir o assassino, a arma e o cômodo do crime antes do adversário.

O repositório possui três partes principais:

* O aplicativo Next.js na raiz, servido pelo arquivo `server.ts`.
* O serviço de tempo real com Socket.IO e Web Push em `server/server.ts`.
* O motor de mapas em Phaser dentro de `mapa/`, que funciona tanto como um projeto Webpack independente quanto como código-fonte importado diretamente pelo aplicativo Next.js.

Os dois arquivos `server.ts` são importantes:

* O `server.ts` da raiz inicia o servidor HTTP personalizado do Next.js na porta **3000**.
* O `server/server.ts` inicia o serviço multiplayer Socket.IO na porta **3001**.

---

## Estrutura do Projeto

```text
sudocidio/
|-- README.md
|-- package.json                 # Scripts e dependências do app Next.js
|-- server.ts                    # Servidor HTTP customizado do Next.js
|-- .env.example                 # Exemplo da chave pública VAPID exposta ao navegador
|-- next.config.ts
|-- tsconfig.json
|-- lib/
|   `-- pushNotification.ts      # Auxiliar de inscrição para notificações push
|-- public/
|   |-- sw.js                    # Service Worker para exibir notificações push
|   |-- assets/                  # Recursos gráficos copiados de mapa/assets
|   `-- audio/music/             # Faixas musicais
|-- src/
|   |-- app/
|   |   |-- page.tsx             # Menu principal
|   |   |-- game/page.tsx        # Tela principal do jogo
|   |   |-- layout.tsx           # Layout global e provedor de música
|   |   `-- globals.css
|   |-- components/
|   |   |-- menu/                # Componentes do menu em pixel art
|   |   `-- gameplay/            # Painéis, wrapper Phaser e modais
|   |-- contexts/
|   |   |-- WebSocketContext.tsx # Cliente Socket.IO e matchmaking
|   |   `-- MusicPlayerContext.tsx
|   |-- hooks/
|   |   |-- useMultiplayer.ts
|   |   `-- useMusicPlayer.ts
|   `-- types/
|       `-- game.ts              # Tipos compartilhados do estado da partida
|-- server/
|   |-- README.md
|   |-- package.json             # Dependências do serviço em tempo real
|   |-- server.ts                # Matchmaking, eventos e Web Push
|   |-- .example.env
|   `-- tsconfig.json
|-- mapa/
|   |-- README.md
|   |-- package.json             # Projeto Phaser/Webpack independente
|   |-- webpack.config.js
|   |-- index.html
|   |-- style.css
|   |-- assets/
|   `-- src/
|       |-- app.ts
|       |-- scenes/
|       |-- generators/
|       |-- core/
|       |-- components/
|       |-- ui/
|       |-- types/
|       `-- utils/
`-- docs/
    |-- extensoes.md             # Lista as extensões implementadas no jogo
    |-- gdd.pdf
    |-- mensagens.md             # Documenta as mensagens enviadas entre servidor e cliente via websocket
    `-- ost.md                   # Lista as músicas usadas no jogo
```

---

## Arquitetura em Execução

### Aplicação Next.js

O projeto principal utiliza **Next.js App Router**, **React 19** e **TypeScript**. Ele é responsável por:

* Menu principal
* Rota `/game`
* Interface React do jogo
* Reprodutor de música
* Contexto do cliente Socket.IO
* Fluxo de inscrição em notificações push

Arquivos importantes:

* `src/app/page.tsx` → menu principal
* `src/app/game/page.tsx` → tela do jogo
* `src/components/gameplay/PhaserMapWrapper.tsx` → integração Phaser
* `src/contexts/WebSocketContext.tsx` → comunicação com o servidor
* `lib/pushNotification.ts` → registro do service worker
* `public/sw.js` → exibição de notificações
* `server.ts` → servidor HTTP do Next.js

> [!IMPORTANT]
> O comando:
> 
> ```bash
> npm run dev
> ```
> 
> não executa `next dev`, mas sim:
> 
> ```bash
> tsx server.ts
> ```

---

## Servidor Next.js (`/server.ts`)

O servidor raiz:

* Inicia na porta `PORT` ou `3000`
* Também exporta utilitários simples para partidas:

```ts
createMatch()
joinMatch(matchId, playerId)
removeMatch(matchId)
```

Esses utilitários são independentes do sistema principal de matchmaking.

---

## Serviço em Tempo Real (`server/server.ts`)

Executado separadamente na porta **3001**.

Responsabilidades:

* Conexões Socket.IO
* Armazenamento de inscrições push
* Fila de matchmaking
* Criação de salas
* Geração de seed compartilhada
* Eventos de jogo
* Limpeza de partidas
* Notificações push

Eventos principais:

* `JOIN_ROOM`
* `ROOM_JOINED`
* `GAME_START`
* `PIECE_PLACED`
* `OPPONENT_PROGRESS`
* `SEND_SABOTAGE`
* `RECEIVE_SABOTAGE`
* `MAKE_ACCUSATION`
* `SURRENDER`
* `GAME_OVER`

---

## Pacote Phaser (`mapa/`)

Responsável por:

* Carregar texturas
* Gerar mapas proceduralmente
* Definir tipos de cômodos
* Posicionar suspeitos
* Posicionar armas
* Gerar pistas
* Renderizar o mapa
* Controlar câmera
* Sabotagens
* Acusações
* Comunicação com React

---

## Dependências Importantes

### Aplicação principal

* `next`
* `react`
* `react-dom`
* `tsx`
* `typescript`
* `tailwindcss`
* `lucide-react`
* `phaser`
* `rot-js`
* `socket.io-client`
* `web-push`

### Servidor

* `socket.io`
* `web-push`
* `dotenv`
* `cors`
* `express`

### Mapa

* `phaser`
* `webpack`
* `ts-loader`
* `typescript`
* `http-server`
* `concurrently`
* `rot-js`
* `qs`

---

## Arquivos de Ambiente

Existem dois arquivos de exemplo:

```text
.example.env
server/.example.env
```

### Ambiente da raiz

Crie:

```bash
cp .example.env .env
```

Configure:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_publica
```

Opcionalmente:

```env
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

Para testes em rede local:

```env
NEXT_PUBLIC_WS_URL=http://192.168.0.10:3001
```

---

### Ambiente do servidor

Crie:

```bash
cd server
cp .example.env .env
```

Configure:

```env
VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada
VAPID_MAILTO=mailto:voce@exemplo.com
```

---

## Configuração Web Push

Gerar chaves VAPID:

```bash
npx web-push generate-vapid-keys
```

Utilize o mesmo par de chaves:

### `.env`

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_publica
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### `server/.env`

```env
VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada
VAPID_MAILTO=mailto:voce@exemplo.com
```

Fluxo:

1. Navegador conecta ao Socket.IO.
2. Solicita permissão de notificação.
3. Registra o Service Worker.
4. Cria uma assinatura push.
5. Envia a assinatura ao servidor.
6. O servidor envia notificações quando encontra um oponente.

---

## Pré-requisitos

* Node.js 18+
* npm
* Navegador compatível com Service Workers
* Duas sessões do navegador para testes multiplayer

---

## Instalação

```bash
npm install

cd server
npm install

cd ../mapa
npm install

cd ..
```

---

## Executando em Desenvolvimento

### Terminal 1

Aplicação Next.js:

```bash
npm run dev
```

Acesso:

```text
http://localhost:3000
```

### Terminal 2

Servidor Socket.IO:

```bash
cd server
npx tsx server.ts
```

Acesso:

```text
http://localhost:3001
```

Abra:

```text
http://localhost:3000/game
```

Para testar matchmaking:

* Abra duas abas ou janelas.
* Ou utilize dois dispositivos na mesma rede.

---

## Scripts Úteis

### Projeto principal

```json
{
  "dev": "tsx server.ts",
  "clean": "npx rimraf .next && tsx server.ts",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

### Projeto Phaser

```json
{
  "build": "webpack",
  "watch": "webpack --watch",
  "serve": "http-server --port=8085 -c-1"
}
```

---

## Executando Apenas o Mapa

```bash
cd mapa
npm run build
npm run serve
```

Acesse:

```text
http://localhost:8085
```

Para desenvolvimento contínuo:

```bash
npm run watch
```

e em outro terminal:

```bash
npm run serve
```

---

## Fluxo de Jogo

1. Jogador abre `/game`
2. Socket.IO conecta ao servidor
3. Registro de notificações push
4. `JOIN_ROOM`
5. Matchmaking e geração da seed
6. `GAME_START`
7. Phaser recebe a seed
8. Gera o mesmo mapa para ambos os jogadores
9. Phaser dispara eventos para React
10. React envia eventos de volta ao Phaser
11. Socket.IO sincroniza progresso, sabotagens e resultados

---

## Pontos de Atenção

* Existem **dois arquivos `server.ts`**:

  * `server.ts` → servidor Next.js (porta 3000)
  * `server/server.ts` → servidor multiplayer (porta 3001)

* Ambos precisam estar executando para o multiplayer funcionar.

* As dependências devem ser instaladas em:

  * raiz
  * `server/`
  * `mapa/` (opicional)

* O arquivo `server/.example.env` possui um nome diferente do padrão.

* `public/assets` contém os recursos usados pelo jogo em execução.

* `mapa/assets` contém os recursos-fonte.

* O pacote `mapa/` usa Phaser 3, enquanto o projeto principal lista Phaser 4.

* Atualmente `src/app/game/page.tsx` chama `findMatch()` duas vezes durante a montagem, podendo causar entradas duplicadas na fila durante o desenvolvimento. 

---

## Equipe de Desenvolvimento

- **Júlia Manuela Turnes**
- **Sofia Alves Toreti**

---

*Projeto desenvolvido para apresentação acadêmica e demonstração na Feira de Jogos — 2026.*