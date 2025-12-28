/**
 * Custom Next.js Server with Socket.io
 * Required for real-time WebSocket functionality
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './lib/socket/server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io
  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`
    ╔════════════════════════════════════════════╗
    ║                                            ║
    ║   🚀 BitPay Server Running                ║
    ║                                            ║
    ║   > Local:    http://${hostname}:${port}       ║
    ║   > Network:  Ready                        ║
    ║                                            ║
    ║   ⚡ Socket.io: Enabled                    ║
    ║   📡 Real-time: Active                     ║
    ║                                            ║
    ╚════════════════════════════════════════════╝
    `);
  });
});
