const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const db = require('./db/database');
const registerSocketHandlers = require('./socket/socketHandler');

const usersRouter = require('./routes/users');
const campaignsRouter = require('./routes/campaigns');
const charactersRouter = require('./routes/characters');
const mobsRouter = require('./routes/mobs');
const messagesRouter = require('./routes/messages');

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_ORIGIN 
  ? process.env.CLIENT_ORIGIN.split(',').map(s => s.trim()) 
  : '*';

const corsOptions = {
  origin: allowedOrigins === '*' ? '*' : allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins === '*' ? '*' : allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

registerSocketHandlers(io);

// Mount API routes
app.use('/api/users', usersRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/characters', charactersRouter);
app.use('/api/mobs', mobsRouter);
app.use('/api/messages', messagesRouter);

// Health check endpoint (for Render / Railway liveness probes)
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'online',
    system: 'Warhammer 40,000: Wrath & Glory VTT Engine',
    version: '2.5',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`⚔️  WRATH & GLORY VTT SERVER OPERACIONAL`);
  console.log(`   Localhost: http://localhost:${PORT}`);
  console.log(`   LAN/Tunneling: http://${HOST}:${PORT}`);
  console.log(`====================================================`);
});
