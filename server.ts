import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// inicializa a aplicação Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// este Map vai segurar o estado das partidas do sudocidio.
const activeMatches = new Map();

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