# 🌍 SpotShare

**"Comparte tu mundo, descubre el de otros"**

Una red social geolocalizada moderna donde los usuarios comparten momentos, fotos y experiencias vinculadas a ubicaciones específicas.

---

## 🚀 Inicio Rápido

> 📖 **¿Primera vez?** Lee **[EMPEZAR-AQUI.md](./EMPEZAR-AQUI.md)** para una guía completa paso a paso.

```bash
# Instalar dependencias
npm install

# Verificar configuración de Firebase
npm run test:firebase

# Iniciar servidor de desarrollo
npm start
```

La aplicación se abrirá en `http://localhost:3000`

> ⚠️ **¿Errores?** Lee [FIX-DEFINITIVO.md](./FIX-DEFINITIVO.md) - Solución final aplicada ✅

---

## ✨ Características

### ✅ Implementado
- 🎨 **Diseño moderno** tipo Instagram/TikTok
- 📱 **Feed de posts** geolocalizados
- ❤️ **Sistema de likes** con animación
- 📍 **Geolocalización** automática
- 💬 **Comentarios** (backend listo)
- 🎯 **Responsive** mobile-first
- 🌙 **Modo oscuro** automático
- ♿ **Accesible** (WCAG AA)

### ⏳ Próximamente
- Crear posts con foto + ubicación
- Sistema de comentarios completo
- Perfil de usuario mejorado
- Sistema de seguimiento
- Explorar con mapa interactivo
- Notificaciones en tiempo real

---

## 🎨 Diseño

### Paleta de Colores
- 🔵 **Azul Primario** (#2563EB) - Confianza y tecnología
- 🟢 **Verde Secundario** (#10B981) - Naturaleza y comunidad
- 🟠 **Naranja Acento** (#F59E0B) - Energía y acción

### Inspiración
- Instagram: Cards y sistema de interacciones
- TikTok: Feed vertical y animaciones fluidas
- Foursquare: Geolocalización y check-ins

---

## 📚 Documentación

### 🎯 Empieza aquí
- **[SPOTSHARE-INDEX.md](./SPOTSHARE-INDEX.md)** - Índice completo de documentación
- **[SPOTSHARE-SUMMARY.md](./SPOTSHARE-SUMMARY.md)** - Resumen ejecutivo
- **[SPOTSHARE-QUICKSTART.md](./SPOTSHARE-QUICKSTART.md)** - Guía de inicio rápido

### 📖 Documentación Completa
- **[SPOTSHARE-README.md](./SPOTSHARE-README.md)** - Documentación técnica completa
- **[SPOTSHARE-TRANSFORMATION.md](./SPOTSHARE-TRANSFORMATION.md)** - Plan de transformación
- **[SPOTSHARE-VISUAL-GUIDE.md](./SPOTSHARE-VISUAL-GUIDE.md)** - Guía visual de diseño
- **[SPOTSHARE-CHANGELOG.md](./SPOTSHARE-CHANGELOG.md)** - Registro de cambios

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript
- **Autenticación**: Firebase Authentication
- **Base de Datos**: Cloud Firestore
- **Mapas**: Leaflet.js + OpenStreetMap
- **Hosting**: Firebase Hosting
- **Estilos**: CSS3 con variables personalizadas

---

## 📂 Estructura del Proyecto

```
src/
├── components/
│   ├── ui/              # Componentes reutilizables (Button, Card)
│   ├── feed/            # Sistema de feed (Feed, PostCard)
│   ├── auth/            # Autenticación
│   └── Dashboard.tsx    # Dashboard principal
├── contexts/
│   ├── AuthContext.tsx
│   └── PostsContext.tsx # Estado global de posts
├── services/
│   └── PostsService.ts  # Lógica de posts y geolocalización
├── types/
│   └── index.ts         # Tipos TypeScript
└── styles/
    └── spotshare-theme.css  # Sistema de diseño
```

---

## 🔥 Firebase Setup

### 1. Crear proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita Authentication (Email/Password y Google)
4. Crea una base de datos Firestore

### 2. Configurar credenciales
Edita `src/firebase/config.ts` con tus credenciales:

```typescript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};
```

### 3. Configurar reglas de Firestore
Copia las reglas de `firestore.rules` a Firebase Console.

---

## 🎯 Cómo Usar

### 1. Iniciar Sesión
- Crea una cuenta o inicia sesión
- Permite el acceso a tu ubicación

### 2. Explorar el Feed
- Verás posts cercanos a tu ubicación
- Scroll para ver más posts
- Doble tap en imagen para dar like

### 3. Interactuar
- ❤️ Like: Click en el corazón o doble tap
- 💬 Comentar: Click en el ícono de comentario
- 📤 Compartir: Click en el ícono de compartir

### 4. Crear Posts (Próximamente)
- Click en el botón flotante (+)
- Selecciona ubicación
- Sube foto y agrega descripción

---

## 🧪 Testing

```bash
# Tests unitarios
npm test

# Tests E2E con Cypress
npm run e2e

# Abrir Cypress UI
npm run e2e:open
```

---

## 🚀 Deployment

```bash
# Build de producción
npm run build:prod

# Deploy a Firebase Hosting
npm run deploy
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📝 Licencia

MIT License - Ver archivo [LICENSE](LICENSE)

---

## 🙏 Créditos

**Desarrollado para la comunidad de Ilo, Perú 🇵🇪**

Inspirado en:
- Instagram (diseño de cards)
- TikTok (animaciones)
- Foursquare (geolocalización)

---

## 📞 Soporte

- 📚 **Documentación**: Ver [SPOTSHARE-INDEX.md](./SPOTSHARE-INDEX.md)
- 🐛 **Problemas**: Ver [SPOTSHARE-QUICKSTART.md](./SPOTSHARE-QUICKSTART.md)
- 💡 **Ideas**: Abre un issue en GitHub

---

**Versión**: 1.0.0  
**Última actualización**: 2025-11-14  
**Estado**: ✅ Funcional - En desarrollo activo

---

## 🎉 ¡Bienvenido a SpotShare!

Empieza explorando la [documentación completa](./SPOTSHARE-INDEX.md) o sigue la [guía de inicio rápido](./SPOTSHARE-QUICKSTART.md).

**¡Feliz desarrollo! 🚀**
