const WebSocket = require('ws');

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

let wsaC = null;
let wsaCReady = false;
const queueaC = [];

function connectToC() {
  wsaC = new WebSocket('ws://nodo-c:3002');
  wsaC.on('open', () => {
    wsaCReady = true;
    console.log('Conectando a nodo-c');
    while (queueaC.length > 0) {
      const m = queueaC.shift();
      wsaC.send(JSON.stringify(m));
    }
  });
  wsaC.on('close', () => {
    wsaCReady = false;
    console.log('Desconectado de nodo-c, reintentando...');
    setTimeout(connectToC, 1000);
  });
  wsaC.on('error', () => {});
}

connectToC();

// Mensaje que viene del nodoA
const wss = new WebSocket.Server({ port: 3001 });
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    let obj;
    try { obj = JSON.parse(message); } catch (e) {
      console.log('Nodo B: recibido mensaje no JSON');
      return;
    }
    if (!validarMensaje(obj)) {
      console.log('Nodo B: Mensaje no apto');
      return;
    }
    // Parte que calcula si es par o impar
    if (obj.power_level % 2 === 0) {
      obj.power_level = obj.power_level * 2;
    } else {
      obj.power_level = obj.power_level + 1;
    }
    obj.audit_trail.push('B_processed');
    console.log('Nodo B: con B_processed en audit_trail ->', JSON.stringify(obj));
    if (wsaCReady) {
      wsaC.send(JSON.stringify(obj));
    } else {
      queueaC.push(obj);
    }
  });
});

console.log('Nodo B esta escuchando en el puerto 3001');
