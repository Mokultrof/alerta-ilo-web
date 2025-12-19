/**
 * PostsService - Servicio para gestionar posts en SpotShare
 * Maneja CRUD de posts, likes, comentarios y queries geolocalizadas
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Post, CreatePostData, Comment, CreateCommentData, Location } from '../types';
import logger from '../utils/logger';

class PostsService {
  private static instance: PostsService;
  private readonly POSTS_COLLECTION = 'posts';
  private readonly COMMENTS_COLLECTION = 'comments';

  private constructor() {
    if (!db) {
      logger.error('❌ Firestore (db) no está inicializado');
      throw new Error('Firestore no está disponible');
    }
    logger.log('✅ PostsService inicializado con Firestore');
  }

  static getInstance(): PostsService {
    if (!PostsService.instance) {
      PostsService.instance = new PostsService();
    }
    return PostsService.instance;
  }

  /**
   * Crear un nuevo post (Estructura plana similar a Reportes)
   */
  async createPost(userId: string, userName: string, data: CreatePostData, userAvatar?: string): Promise<Post> {
    try {
      logger.log('📝 Creando nuevo post...', { userId, description: data.content.description });

      const postData: any = {
        userId,
        userName,
        userAvatar: userAvatar || null,
        location: data.location,
        // Contenido plano (Flat)
        description: data.content.description,
        imageUrl: data.content.imageUrl || null,
        videoUrl: data.content.videoUrl || null,
        // Interacciones planas (Flat)
        likes: 0,
        comments: 0,
        shares: 0,
        // Relaciones
        likedBy: [],
        visibility: data.visibility || 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      logger.log('📦 Data a enviar a Firestore (FLAT):', JSON.stringify(postData, null, 2));

      const docRef = await addDoc(collection(db, this.POSTS_COLLECTION), postData);

      const newPost: Post = {
        id: docRef.id,
        userId,
        userName,
        userAvatar: userAvatar || undefined,
        location: data.location,
        content: {
          description: data.content.description,
          imageUrl: data.content.imageUrl || null,
          videoUrl: data.content.videoUrl || null
        },
        interactions: {
          likes: 0,
          comments: 0,
          shares: 0
        },
        likedBy: [],
        visibility: data.visibility || 'public',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      logger.log('✅ Post creado exitosamente', { postId: newPost.id });
      return newPost;
    } catch (error) {
      logger.error('❌ Error al crear post:', error);
      throw new Error('No se pudo crear el post. Intenta nuevamente.');
    }
  }

  /**
   * Helper para mapear datos de Firestore a objeto Post estructurado
   * Soporta tanto estructura plana (nueva) como anidada (legado)
   */
  private firestoreToPost(docId: string, data: any): Post {
    // Determinar si es estructura plana o anidada
    const hasNestedContent = data.content && typeof data.content === 'object';

    // Extraer description
    let description = '';
    if (hasNestedContent && data.content.description) {
      description = data.content.description;
    } else if (data.description) {
      description = data.description;
    }

    // Extraer imageUrl
    let imageUrl = undefined;
    if (hasNestedContent && data.content.imageUrl) {
      imageUrl = data.content.imageUrl;
    } else if (data.imageUrl) {
      imageUrl = data.imageUrl;
    }

    // Extraer videoUrl
    let videoUrl = undefined;
    if (hasNestedContent && data.content.videoUrl) {
      videoUrl = data.content.videoUrl;
    } else if (data.videoUrl) {
      videoUrl = data.videoUrl;
    }

    // Extraer interactions (puede ser objeto anidado o campos planos)
    const hasNestedInteractions = data.interactions && typeof data.interactions === 'object';
    const likes = hasNestedInteractions ? (data.interactions.likes || 0) : (data.likes || 0);
    const comments = hasNestedInteractions ? (data.interactions.comments || 0) : (data.comments || 0);
    const shares = hasNestedInteractions ? (data.interactions.shares || 0) : (data.shares || 0);

    return {
      id: docId,
      userId: data.userId || 'unknown',
      userName: data.userName || 'Usuario',
      userAvatar: data.userAvatar || undefined,
      location: data.location || { lat: 0, lng: 0, address: 'Ubicación desconocida' },
      content: {
        description: description,
        imageUrl: imageUrl,
        videoUrl: videoUrl
      },
      interactions: {
        likes,
        comments,
        shares
      },
      likedBy: data.likedBy || [],
      visibility: data.visibility || 'public',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
    };
  }

  /**
   * Obtener posts cercanos a una ubicación
   */
  async getNearbyPosts(location: Location, radiusKm: number = 10, limitCount: number = 50): Promise<Post[]> {
    try {
      // Primero intentar obtener todos los posts
      let postsQuery = query(
        collection(db, this.POSTS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      let snapshot = await getDocs(postsQuery);

      if (snapshot.empty) {
        return [];
      }

      const posts: Post[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.location || typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number') {
          return;
        }

        // Solo incluir posts públicos
        if (data.visibility && data.visibility !== 'public') {
          return;
        }

        try {
          const distance = this.calculateDistance(
            location.lat,
            location.lng,
            data.location.lat,
            data.location.lng
          );

          if (distance <= radiusKm) {
            const post = this.firestoreToPost(doc.id, data);
            (post as any).distance = distance;
            posts.push(post);
          }
        } catch (err) {
          logger.error('Error procesando post:', doc.id, err);
        }
      });

      // Ordenar por distancia y fecha
      posts.sort((a, b) => {
        const distDiff = (a as any).distance - (b as any).distance;
        if (distDiff !== 0) return distDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      return posts.slice(0, limitCount);
    } catch (error: any) {
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        logger.log('⚠️ Permisos insuficientes para ver posts cercanos');
        throw error;
      }
      logger.error('❌ Error al buscar posts cercanos:', error);
      throw new Error('No se pudieron cargar los posts cercanos.');
    }
  }

  /**
   * Obtener posts de un usuario
   */
  async getUserPosts(userId: string, limitCount: number = 20): Promise<Post[]> {
    try {
      logger.log('🔍 Buscando posts del usuario:', userId);

      // Primero, intentar obtener TODOS los posts para debug
      const allPostsQuery = query(
        collection(db, this.POSTS_COLLECTION),
        limit(50)
      );

      const allSnapshot = await getDocs(allPostsQuery);
      logger.log(`📊 Total de posts en la colección: ${allSnapshot.size}`);

      // Mostrar todos los userIds para comparar
      allSnapshot.forEach((doc) => {
        const data = doc.data();
        logger.log(`  - Post ${doc.id}: userId="${data.userId}" (match: ${data.userId === userId})`);
      });

      // Ahora hacer la consulta filtrada por usuario
      const postsQuery = query(
        collection(db, this.POSTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(postsQuery);
      logger.log(`📸 Posts encontrados para usuario ${userId}: ${snapshot.size}`);

      const posts: Post[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        logger.log(`  ✅ Post válido: ${doc.id}`, data);
        posts.push(this.firestoreToPost(doc.id, data));
      });

      return posts;
    } catch (error: any) {
      logger.error('❌ Error en getUserPosts:', error);

      // Si es error de índice, mostrar mensaje específico
      if (error?.message?.includes('index')) {
        logger.error('⚠️ Se requiere crear un índice en Firebase. Revisa la consola.');
      }

      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        logger.log('⚠️ Permisos insuficientes para ver posts del usuario');
        throw error;
      }
      throw new Error('No se pudieron cargar los posts del usuario.');
    }
  }

  /**
   * Dar like a un post (Atributo 'likes' plano)
   */
  async likePost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(db, this.POSTS_COLLECTION, postId);

      await updateDoc(postRef, {
        likes: increment(1), // Actualizar campo plano
        likedBy: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });

      logger.log('❤️ Like agregado al post', { postId, userId });
    } catch (error) {
      logger.error('❌ Error al dar like:', error);
      throw new Error('No se pudo dar like al post.');
    }
  }

  /**
   * Quitar like de un post (Atributo 'likes' plano)
   */
  async unlikePost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(db, this.POSTS_COLLECTION, postId);

      await updateDoc(postRef, {
        likes: increment(-1), // Actualizar campo plano
        likedBy: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });

      logger.log('💔 Like removido del post', { postId, userId });
    } catch (error) {
      logger.error('❌ Error al quitar like:', error);
      throw new Error('No se pudo quitar el like del post.');
    }
  }

  /**
   * Agregar comentario a un post (Atributo 'comments' plano)
   */
  async addComment(userId: string, userName: string, data: CreateCommentData, userAvatar?: string): Promise<Comment> {
    try {
      const commentData: any = {
        postId: data.postId,
        userId,
        userName,
        text: data.text,
        createdAt: serverTimestamp()
      };

      if (userAvatar) {
        commentData.userAvatar = userAvatar;
      }

      const docRef = await addDoc(collection(db, this.COMMENTS_COLLECTION), commentData);

      // Incrementar contador de comentarios en el post (campo plano)
      const postRef = doc(db, this.POSTS_COLLECTION, data.postId);
      await updateDoc(postRef, {
        comments: increment(1), // Actualizar campo plano
        updatedAt: serverTimestamp()
      });

      const newComment: Comment = {
        id: docRef.id,
        postId: data.postId,
        userId,
        userName,
        userAvatar: userAvatar || undefined,
        text: data.text,
        createdAt: new Date()
      };

      return newComment;
    } catch (error) {
      logger.error('❌ Error al agregar comentario:', error);
      throw new Error('No se pudo agregar el comentario.');
    }
  }

  /**
   * Obtener comentarios de un post
   */
  async getPostComments(postId: string): Promise<Comment[]> {
    try {
      const commentsQuery = query(
        collection(db, this.COMMENTS_COLLECTION),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(commentsQuery);
      const comments: Comment[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Comment);
      });

      return comments;
    } catch (error) {
      logger.error('❌ Error al obtener comentarios:', error);
      throw new Error('No se pudieron cargar los comentarios.');
    }
  }

  /**
   * Eliminar un post
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(db, this.POSTS_COLLECTION, postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        throw new Error('El post no existe.');
      }

      const postData = postDoc.data();
      if (postData.userId !== userId) {
        throw new Error('No tienes permiso para eliminar este post.');
      }

      // Eliminar comentarios asociados
      const commentsQuery = query(
        collection(db, this.COMMENTS_COLLECTION),
        where('postId', '==', postId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);

      const deletePromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Eliminar el post
      await deleteDoc(postRef);

      logger.log('🗑️ Post eliminado', { postId });
    } catch (error) {
      logger.error('❌ Error al eliminar post:', error);
      throw error;
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default PostsService;
