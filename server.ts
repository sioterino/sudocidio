import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { randomUUID } from 'crypto';
import { MatchState, BoardState } from './src/types/game';


const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// inicializa a aplicação Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// este Map vai segurar o estado das partidas do sudocidio.
const activeMatches = new Map<String, MatchState>()

// função para inicializar uma sala nova
export function createMatch(): MatchState{
  const matchId= randomUUID();

  const initialBoard: BoardState = {
    cells: [],
    availablePieces:[]
  }

  const newMatch: MatchState = {
    matchId,
    players: [],
    board: initialBoard,
    hiddenAnswer: {
      killerId: 'suspect_a',
      weaponId: 'weapon_knife',
      roomId: 'kitchen'
    }
  };
  
  activeMatches.set(matchId, newMatch);
  console.log(`[Servidor] Nova partida criada: ${matchId}`);
  
  return newMatch;
}

//função para o jogador entrar na sala
export function joinMatch(matchId: string, playerId: string): boolean{
  const match = activeMatches.get(matchId);

  if(!match){
    console.error(`[Servidor] Erro: Partida ${matchId} não encontrada.`);  
    return false;
  }

  if (match.players.length >= 2) {
    console.error(`[Servidor] Erro: Partida ${matchId} já está cheia.`);
    return false; 
  }

  match.players.push(playerId);
  console.log(`[Servidor] Jogador ${playerId} entrou na partida ${matchId}`);
  return true;
}
  
// função para limpar a memória quando o jogo acabar
export function removeMatch(matchId: string): void {
  if (activeMatches.has(matchId)) {
    activeMatches.delete(matchId);
    console.log(`[Servidor] Partida ${matchId} encerrada e removida da memória.`);
  }
}

// inicialização do servidor
app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // passa a URL para o next lidar com as rotas do frontend
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Erro interno no servidor:', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      console.error('Erro fatal ao iniciar o servidor:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> 🔪 SUDOCÍDIO Server rodando em http://${hostname}:${port}`);
    });
});