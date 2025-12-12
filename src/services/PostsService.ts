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
    // Verificar que db esté disponible
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
   * Crear un nuevo post
   */
  async createPost(userId: string, userName: string, data: CreatePostData, userAvatar?: string): Promise<Post> {
    try {
      logger.log('📝 Creando nuevo post...', { userId, location: data.location });

      const postData: any = {
        userId,
        userName,
        location: data.location,
        content: data.content,
        interactions: {
          likes: 0,
          comments: 0,
          shares: 0
        },
        likedBy: [],
        visibility: data.visibility || 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Solo agregar userAvatar si tiene un valor válido
      if (userAvatar) {
        postData.userAvatar = userAvatar;
      }

      const docRef = await addDoc(collection(db, this.POSTS_COLLECTION), postData);

      const newPost: Post = {
        id: docRef.id,
        userId,
        userName,
        userAvatar: userAvatar || undefined,
        location: data.location,
        content: data.content,
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
   * Obtener posts cercanos a una ubicación
   */
  async getNearbyPosts(location: Location, radiusKm: number = 10, limitCount: number = 50): Promise<Post[]> {
    try {
      logger.log('📍 Buscando posts cercanos...', { location, radiusKm });

      // Primero intentar obtener todos los posts sin filtro de visibilidad
      // para verificar si hay posts en la base de datos
      let postsQuery = query(
        collection(db, this.POSTS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      let snapshot = await getDocs(postsQuery);

      // Si no hay posts, retornar array vacío
      if (snapshot.empty) {
        logger.log('ℹ️ No hay posts en la base de datos');
        return [];
      }

      const posts: Post[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Validar que el post tenga los campos necesarios
        if (!data.location || typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number') {
          logger.log('⚠️ Post sin ubicación válida:', doc.id);
          return;
        }

        // Solo incluir posts públicos
        if (data.visibility && data.visibility !== 'public') {
          return;
        }

        try {
          // Calcular distancia
          const distance = this.calculateDistance(
            location.lat,
            location.lng,
            data.location.lat,
            data.location.lng
          );

          // Solo incluir posts dentro del radio
          if (distance <= radiusKm) {
            const post: Post = {
              id: doc.id,
              userId: data.userId || 'unknown',
              userName: data.userName || 'Usuario',
              userAvatar: data.userAvatar || undefined,
              location: data.location,
              content: data.content || { description: '', imageUrl: undefined, videoUrl: undefined },
              interactions: data.interactions || { likes: 0, comments: 0, shares: 0 },
              likedBy: data.likedBy || [],
              visibility: data.visibility || 'public',
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date()
            };

            // Agregar distancia temporalmente para ordenar
            (post as any).distance = distance;
            posts.push(post);
          }
        } catch (err) {
          logger.error('Error procesando post:', doc.id, err);
        }
      });

      // Ordenar por distancia (más cercanos primero) y luego por fecha
      posts.sort((a, b) => {
        const distDiff = (a as any).distance - (b as any).distance;
        if (distDiff !== 0) return distDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      // Limitar resultados
      const limitedPosts = posts.slice(0, limitCount);

      logger.log(`✅ Encontrados ${limitedPosts.length} posts cercanos de ${snapshot.size} totales`);
      return limitedPosts;
    } catch (error: any) {
      // Si es error de permisos, solo loguear warning y re-lanzar
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        logger.log('⚠️ Permisos insuficientes para ver posts cercanos (esperado en modo público)');
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
      const postsQuery = query(
        collection(db, this.POSTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(postsQuery);
      const posts: Post[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Post);
      });

      return posts;
    } catch (error: any) {
      // Si es error de permisos, solo loguear warning y re-lanzar para que el componente lo maneje
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        logger.log('⚠️ Permisos insuficientes para ver posts del usuario (esperado si no es admin/amigo)');
        throw error;
      }

      logger.error('❌ Error al obtener posts del usuario:', error);
      throw new Error('No se pudieron cargar los posts del usuario.');
    }
  }

  /**
   * Dar like a un post
   */
  async likePost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(db, this.POSTS_COLLECTION, postId);

      await updateDoc(postRef, {
        'interactions.likes': increment(1),
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
   * Quitar like de un post
   */
  async unlikePost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(db, this.POSTS_COLLECTION, postId);

      await updateDoc(postRef, {
        'interactions.likes': increment(-1),
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
   * Agregar comentario a un post
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

      // Solo agregar userAvatar si tiene un valor válido
      if (userAvatar) {
        commentData.userAvatar = userAvatar;
      }

      const docRef = await addDoc(collection(db, this.COMMENTS_COLLECTION), commentData);

      // Incrementar contador de comentarios en el post
      const postRef = doc(db, this.POSTS_COLLECTION, data.postId);
      await updateDoc(postRef, {
        'interactions.comments': increment(1),
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

      logger.log('💬 Comentario agregado', { postId: data.postId, commentId: newComment.id });
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

  /**
   * Calcular distancia entre dos puntos (fórmula de Haversine)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default PostsService;
