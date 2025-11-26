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

let wsaA = null;
let wsaAReady = false;
const queueaA = [];

function connectaA() {
  wsaA = new WebSocket('ws://nodo-a:3000');
  wsaA.on('open', () => {
    wsaAReady = true;
    console.log('Conectado al nodo-a');
    while (queueaA.length > 0) {
      const m = queueaA.shift();
      wsaA.send(JSON.stringify(m));
    }
  });
  wsaA.on('close', () => {
    wsaAReady = false;
    console.log('Desconectado de nodo-a, reintentando...');
    setTimeout(connectaA, 1000);
  });
  wsaA.on('error', () => {});
}

connectaA();

// Mnesaje que viene del nodoB
const wss = new WebSocket.Server({ port: 3002 });
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    let obj;
    try { obj = JSON.parse(message); } catch (e) {
      console.log('Nodo C: recibido mensaje no JSON');
      return;
    }
    if (!validarMensaje(obj)) {
      console.log('Nodo C: Mensaje invalido');
      return;
    }
    obj.power_level = obj.power_level - 5;
    obj.audit_trail.push('C_verified');
    console.log('Nodo C: con C_verified en audit_trail ->', JSON.stringify(obj));
    if (wsaAReady) {
      wsaA.send(JSON.stringify(obj));
    } else {
      console.log('Nodo C: nodo-a no listo');
      queueaA.push(obj);
    }
  });
});

console.log('Nodo C esta en el puerto 3002');
