/**
 * Script para generar posts de prueba en Firebase
 * Ejecutar con: node scripts/seed-posts.js
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
// IMPORTANTE: Necesitas descargar tu serviceAccountKey.json desde Firebase Console
// y colocarlo en la raíz del proyecto
try {
  const serviceAccount = require('../serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ Error: No se encontró serviceAccountKey.json');
  console.log('\n📝 Para usar este script:');
  console.log('1. Ve a Firebase Console → Project Settings → Service Accounts');
  console.log('2. Click en "Generate new private key"');
  console.log('3. Guarda el archivo como "serviceAccountKey.json" en la raíz del proyecto');
  console.log('4. Ejecuta: node scripts/seed-posts.js\n');
  process.exit(1);
}

const db = admin.firestore();

// Ubicaciones en Ilo, Perú
const locations = [
  {
    lat: -17.6397,
    lng: -71.3378,
    address: 'Plaza de Armas, Ilo',
    placeName: 'Plaza de Armas'
  },
  {
    lat: -17.6450,
    lng: -71.3350,
    address: 'Malecón de Ilo',
    placeName: 'Malecón'
  },
  {
    lat: -17.6500,
    lng: -71.3400,
    address: 'Playa Boca del Río, Ilo',
    placeName: 'Playa Boca del Río'
  },
  {
    lat: -17.6300,
    lng: -71.3300,
    address: 'Mercado Central, Ilo',
    placeName: 'Mercado Central'
  },
  {
    lat: -17.6420,
    lng: -71.3390,
    address: 'Parque Kurt Beer, Ilo',
    placeName: 'Parque Kurt Beer'
  }
];

// Descripciones de ejemplo
const descriptions = [
  '¡Hermoso día en Ilo! ☀️',
  'Disfrutando de la vista 🌊',
  'Momento perfecto para compartir 📸',
  'La belleza de nuestra ciudad 🏖️',
  'Atardecer increíble 🌅',
  'Compartiendo momentos especiales ❤️',
  'Explorando lugares nuevos 🗺️',
  'Un día para recordar 🎉',
  'La magia de Ilo ✨',
  'Momentos que valen la pena compartir 💫'
];

// Imágenes de ejemplo (usando Unsplash)
const images = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=600&fit=crop'
];

// Usuarios de ejemplo
const users = [
  { id: 'user1', name: 'Juan Pérez', avatar: 'https://i.pravatar.cc/150?img=12' },
  { id: 'user2', name: 'María López', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: 'user3', name: 'Carlos Rodríguez', avatar: 'https://i.pravatar.cc/150?img=33' },
  { id: 'user4', name: 'Ana García', avatar: 'https://i.pravatar.cc/150?img=9' },
  { id: 'user5', name: 'Luis Martínez', avatar: 'https://i.pravatar.cc/150?img=15' }
];

// Función para generar un post aleatorio
function generateRandomPost() {
  const user = users[Math.floor(Math.random() * users.length)];
  const location = locations[Math.floor(Math.random() * locations.length)];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  const imageUrl = images[Math.floor(Math.random() * images.length)];
  
  // Fecha aleatoria en los últimos 7 días
  const daysAgo = Math.floor(Math.random() * 7);
  const hoursAgo = Math.floor(Math.random() * 24);
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);
  createdAt.setHours(createdAt.getHours() - hoursAgo);
  
  // Likes aleatorios
  const likesCount = Math.floor(Math.random() * 50);
  const likedBy = [];
  for (let i = 0; i < likesCount; i++) {
    likedBy.push(`user${Math.floor(Math.random() * 100)}`);
  }
  
  return {
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    location: location,
    content: {
      description: description,
      imageUrl: imageUrl,
      videoUrl: null
    },
    interactions: {
      likes: likesCount,
      comments: Math.floor(Math.random() * 10),
      shares: Math.floor(Math.random() * 5)
    },
    likedBy: likedBy,
    visibility: 'public',
    createdAt: admin.firestore.Timestamp.fromDate(createdAt),
    updatedAt: admin.firestore.Timestamp.fromDate(createdAt)
  };
}

// Función principal
async function seedPosts() {
  console.log('🌱 Iniciando seed de posts...\n');
  
  try {
    const postsRef = db.collection('posts');
    
    // Verificar si ya hay posts
    const existingPosts = await postsRef.limit(1).get();
    if (!existingPosts.empty) {
      console.log('⚠️  Ya existen posts en la base de datos.');
      console.log('¿Deseas continuar y agregar más posts? (Ctrl+C para cancelar)\n');
      
      // Esperar 3 segundos antes de continuar
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Generar 20 posts de prueba
    const numberOfPosts = 20;
    console.log(`📝 Generando ${numberOfPosts} posts de prueba...\n`);
    
    const batch = db.batch();
    const posts = [];
    
    for (let i = 0; i < numberOfPosts; i++) {
      const post = generateRandomPost();
      const docRef = postsRef.doc();
      batch.set(docRef, post);
      posts.push({ id: docRef.id, ...post });
      
      console.log(`✅ Post ${i + 1}/${numberOfPosts}: ${post.userName} en ${post.location.placeName}`);
    }
    
    // Commit batch
    await batch.commit();
    
    console.log('\n🎉 ¡Seed completado exitosamente!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Posts creados: ${numberOfPosts}`);
    console.log(`   - Ubicaciones: ${locations.length}`);
    console.log(`   - Usuarios: ${users.length}`);
    console.log('\n🚀 Ahora puedes ver los posts en tu aplicación!\n');
    
  } catch (error) {
    console.error('❌ Error al crear posts:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Ejecutar
seedPosts();
