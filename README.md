# 🚨 Alerta Ilo

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)
![Firebase](https://img.shields.io/badge/Firebase-10.13-FFCA28.svg)

**Plataforma de reportes comunitarios y momentos sociales para la ciudad de Ilo, Perú**

## 📋 Descripción

Alerta Ilo es una aplicación web progresiva (PWA) diseñada para empoderar a los ciudadanos de Ilo, permitiéndoles:

- 📍 **Reportar problemas urbanos** georreferenciados (baches, luminarias, seguridad, etc.)
- 📸 **Compartir momentos** de la comunidad con fotos y ubicación
- 🗺️ **Visualizar en mapa** todos los reportes y momentos de la ciudad
- ❤️ **Interactuar** con likes y comentarios
- 👤 **Gestionar perfil** con historial de contribuciones

## 🛠️ Tecnologías

| Tecnología | Uso |
|------------|-----|
| **React 19** | Framework principal frontend |
| **TypeScript** | Tipado estático |
| **Firebase** | Autenticación, Firestore, Storage |
| **Leaflet** | Mapas interactivos |
| **CSS3** | Estilos con variables y gradientes |
| **i18next** | Internacionalización |

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Mokultrof/app_ilo_muni.git
   cd alerta-ilo
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Firebase**
   
   Crea un archivo `.env` en la raíz con tus credenciales de Firebase:
   ```env
   REACT_APP_FIREBASE_API_KEY=tu_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto
   REACT_APP_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

4. **Iniciar en desarrollo**
   ```bash
   npm start
   ```

5. **Construir para producción**
   ```bash
   npm run build
   ```

## 📁 Estructura del Proyecto

```
alerta-ilo/
├── public/                 # Assets estáticos
├── src/
│   ├── components/         # Componentes React
│   │   ├── auth/          # Autenticación
│   │   ├── feed/          # Posts y momentos
│   │   ├── map/           # Mapa y marcadores
│   │   ├── navigation/    # Navegación
│   │   ├── profile/       # Perfil de usuario
│   │   ├── reports/       # Reportes
│   │   └── ui/            # Componentes UI reutilizables
│   ├── contexts/          # Context API (Auth, Posts)
│   ├── services/          # Servicios (Firebase, Location)
│   ├── config/            # Configuraciones
│   ├── types/             # Tipos TypeScript
│   ├── utils/             # Utilidades
│   └── styles/            # Estilos globales
├── firebase.json          # Config Firebase Hosting
├── firestore.rules        # Reglas de seguridad Firestore
└── package.json
```

## 🔥 Configuración de Firebase

### Reglas de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /reports/{reportId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

### Índices Requeridos

- `reports`: userId (ASC) + createdAt (DESC)
- `posts`: userId (ASC) + createdAt (DESC)

## 📱 Capturas de Pantalla

| Dashboard | Mapa | Perfil |
|-----------|------|--------|
| Vista principal con estadísticas | Mapa interactivo de Ilo | Mis reportes y momentos |

## 🎯 Funcionalidades

### ✅ Implementadas

- [x] Autenticación con email/contraseña
- [x] Creación de reportes con categorías
- [x] Creación de momentos con fotos
- [x] Mapa interactivo con marcadores
- [x] Sistema de likes
- [x] Perfil de usuario
- [x] Estadísticas de la comunidad
- [x] Filtros por categoría
- [x] Búsqueda de reportes
- [x] Responsive design

### 🔮 Próximas mejoras

- [ ] Notificaciones push
- [ ] Modo offline (PWA)
- [ ] Chat entre usuarios
- [ ] Panel de administración
- [ ] Reportes en PDF

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Juan Diego** - Desarrollador Principal - [@Mokultrof](https://github.com/Mokultrof)

## 🙏 Agradecimientos

- Municipalidad Provincial de Ilo
- Comunidad de desarrolladores de React
- Firebase por su plataforma gratuita

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!

📍 Desarrollado con ❤️ para la comunidad de **Ilo, Moquegua - Perú**
