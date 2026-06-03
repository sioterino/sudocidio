## Extensões implementadas

As extensões implementadas foram:

### 1. Geração Procedural dos Mapa

Usando o `Rot.js` em `/mapa`, uma sequência de caracteres é hasheada e usada para gerar sempre uma mesma configuração de mansão para o mistério.

### 2. Notificações Push

Usando o `WebPush` em `/public/sw.js`, `/lib/pushNotification.ts` e `/server/server.ts`, o servidor envia uma notificação para o usuário a procura de uma partida que um oponente foi encontrado.