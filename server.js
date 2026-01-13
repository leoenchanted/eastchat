import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';

const app = express();
app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const rooms = new Map();

wss.on('connection', ws => {
  ws.on('message', raw => {
    const msg = JSON.parse(raw);
    const { roomId } = msg;

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    rooms.get(roomId).add(ws);

    rooms.get(roomId).forEach(client => {
      if (client !== ws && client.readyState === 1) {
        client.send(raw);
      }
    });
  });

  ws.on('close', () => {
    for (const [room, clients] of rooms) {
      clients.delete(ws);
      if (clients.size === 0) rooms.delete(room);
    }
  });
});

server.listen(process.env.PORT || 3000);
