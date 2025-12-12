// Service Worker DESHABILITADO para modo demo
// No intercepta ninguna petición

console.log('🔧 Service Worker en modo demo - completamente deshabilitado');

// Instalación
self.addEventListener('install', () => {
  console.log('✅ SW instalado (modo demo - sin funcionalidad)');
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', (event) => {
  console.log('✅ SW activado (modo demo - sin funcionalidad)');
  event.waitUntil(self.clients.claim());
});

// NO interceptar ninguna petición
self.addEventListener('fetch', () => {
  // Dejar pasar todas las peticiones sin interceptar
  return;
});
