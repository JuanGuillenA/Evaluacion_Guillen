const http = require('http');
const WebSocket = require('ws');

const crypto = require('crypto');
function generateId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

function validarMensaje(obj) {
  if (!obj || typeof obj !== 'object') return false;
  const keys = Object.keys(obj).sort();
  const allowed = ['_id','audit_trail','power_level'].sort();
  if (JSON.stringify(keys) !== JSON.stringify(allowed)) return false;
  if (typeof obj._id !== 'string') return false;
  if (typeof obj.power_level !== 'number') return false;
  if (!Array.isArray(obj.audit_trail)) return false;
  return true;
}


const WebSocketClient = WebSocket;
let wsToB = null;
let wsToBReady = false;

function connectaB() {
  wsToB = new WebSocketClient('ws://nodo-b:3001');
  wsToB.on('open', () => {
    wsToBReady = true;
    console.log('Conectado a nodo-b');
  });
  wsToB.on('close', () => {
    wsToBReady = false;
    console.log('Desconectado de nodo-b, reintentando...');
    setTimeout(connectaB, 1000);
  });
  wsToB.on('error', (e) => {
    wsToBReady = false;
  });
}

connectaB();

// El mesnaje final de nodo C 
const wss = new WebSocket.Server({ port: 3000 });
wss.on('connection', function connection(ws) {
  //console.log('Nodo A: nueva conexión WS (posible nodo-c)');
  ws.on('message', function incoming(message) {
    let obj;
    try { obj = JSON.parse(message); } catch (e) {
      console.log('Nodo A: recibido mensaje no JSON');
      return;
    }
    //console.log('Nodo A: recibido mensaje WS:', JSON.stringify(obj));
    if (!validarMensaje(obj)) {
      console.log('Nodo A: Mensaje inválido');
      return;
    }
    console.log(`CICLO COMPLETADO: ${obj.power_level}`);
  });
});

// Es el mensaje HTTP que dispara el incio 
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/start') {
    const v = Number(url.searchParams.get('value'));
    if (Number.isNaN(v)) {
      res.writeHead(400, {'Content-Type':'text/plain'});
      res.end('Da un valor ?value=');
      return;
    }
    if (!wsToBReady) {
      res.writeHead(503, {'Content-Type':'text/plain'});
      res.end('Nodo B no está listo');
      return;
    }
    const msg = {
      _id: generateId(),
      power_level: v,
      audit_trail: []
    };
    wsToB.send(JSON.stringify(msg));
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({sent: msg}));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(8080, () => {
  console.log('Nodo A esta en: http://localhost:8080/start?value= (EL NUMERO QUE SE QUIERA PROBAR)');
});
