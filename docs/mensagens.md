## 1. Conexão e Lobby (Preparação da Partida)

### `JOIN_ROOM`
- **Direção:** Cliente -> Servidor
- **Descrição:** O jogador solicita entrada em uma fila de matchmaking ou sala.
- **Payload:**
```json
{
  "playerId": "string",
  "playerName": "string"
}
````

### `ROOM_JOINED`

* **Direção:** Servidor -> Cliente
* **Descrição:** Confirma que o jogador entrou na sala com sucesso e deve aguardar o oponente.
* **Payload:**

```json
{
  "roomId": "string",
  "status": "WAITING_FOR_OPPONENT"
}
```

### `GAME_START`

* **Direção:** Servidor -> Clientes
* **Descrição:** Disparado quando a sala atinge 2 jogadores. Inicia a partida em ambos os clientes.
* **Payload (Crucial):** A `seed` garante que ambos os jogadores gerem exatamente o mesmo mapa no Phaser.

```json
{
  "roomId": "string",
  "seed": "string"
}
```

---

## 2. Gameplay (Durante a Partida)

### `PIECE_PLACED`

* **Direção:** Cliente -> Servidor
* **Descrição:** O jogador avisa que posicionou uma peça/entidade corretamente no mapa.
* **Payload:**

```json
{
  "playerId": "string",
  "progress": "number"
}
```

### `OPPONENT_PROGRESS`

* **Direção:** Servidor -> Cliente (Alvo)
* **Descrição:** O servidor repassa o progresso do adversário para atualizar a barra de tensão.
* **Payload:**

```json
{
  "opponentProgress": "number"
}
```

### `SEND_SABOTAGE`

* **Direção:** Cliente -> Servidor
* **Descrição:** O jogador gastou recursos para enviar uma sabotagem ao adversário.
* **Payload:**

```json
{
  "playerId": "string",
  "sabotageType": "BLIND" | "SHUFFLE" | "LOCK"
}
```

### `RECEIVE_SABOTAGE`

* **Direção:** Servidor -> Cliente (Alvo)
* **Descrição:** O servidor aplica a sabotagem enviada pelo oponente na tela da vítima.
* **Payload:**

```json
{
  "sabotageType": "BLIND" | "SHUFFLE" | "LOCK"
}
```

---

## 3. Encerramento e Desconexão (Fim de Jogo)

### `MAKE_ACCUSATION`

* **Direção:** Cliente -> Servidor
* **Descrição:** O jogador enviou o Relatório Final. O cliente valida no Phaser e avisa o servidor se a acusação estava totalmente correta.
* **Payload:**

```json
{
  "playerId": "string",
  "isCorrect": true
}
```

### `SURRENDER`

* **Direção:** Cliente -> Servidor
* **Descrição:** O jogador clicou ativamente no botão "Desistir do Caso".
* **Payload:**

```json
{
  "playerId": "string"
}
```

### `disconnect` (Evento Nativo do Socket.IO)

* **Direção:** Cliente ✖️ Servidor
* **Descrição:** A conexão caiu (aba fechada, internet caiu). O servidor detecta isso automaticamente e aciona a vitória do oponente.

### `GAME_OVER`

* **Direção:** Servidor -> Clientes
* **Descrição:** Decreta o fim da partida, congela os mapas e exibe o Modal Final.
* **Payload:**

```json
{
  "winnerId": "string",
  "reason": "ACCUSATION_CORRECT" | "OPPONENT_SURRENDERED" | "OPPONENT_DISCONNECTED" | "TIME_OUT"
}
```
