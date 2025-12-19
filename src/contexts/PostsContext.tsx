/**
 * PostsContext - Contexto global para gestión de posts en SpotShare
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Post, CreatePostData, Comment, CreateCommentData, Location, PostsContextType } from '../types';
import PostsService from '../services/PostsService';
import { useAuth } from './AuthContext';
import logger from '../utils/logger';

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postsService = PostsService.getInstance();

  /**
   * Crear un nuevo post
   */
  const createPost = useCallback(async (data: CreatePostData): Promise<Post> => {
    if (!user) {
      throw new Error('Debes iniciar sesión para crear un post');
    }

    try {
      setError(null);
      const newPost = await postsService.createPost(
        user.uid,
        user.displayName || 'Usuario Alerta Ilo',
        data,
        user.photoURL || undefined
      );

      // Agregar al inicio de la lista
      setPosts(prev => [newPost, ...prev]);

      return newPost;
    } catch (err: any) {
      const errorMsg = err.message || 'Error al crear el post';
      setError(errorMsg);
      logger.error('Error en createPost:', err);
      throw err;
    }
  }, [user, postsService]);

  /**
   * Actualizar un post
   */
  const updatePost = useCallback(async (postId: string, updates: Partial<Post>): Promise<void> => {
    try {
      setError(null);
      // Actualizar localmente
      setPosts(prev => prev.map(post =>
        post.id === postId ? { ...post, ...updates, updatedAt: new Date() } : post
      ));
    } catch (err: any) {
      const errorMsg = err.message || 'Error al actualizar el post';
      setError(errorMsg);
      logger.error('Error en updatePost:', err);
      throw err;
    }
  }, []);

  /**
   * Eliminar un post
   */
  const deletePost = useCallback(async (postId: string): Promise<void> => {
    if (!user) {
      throw new Error('Debes iniciar sesión para eliminar un post');
    }

    try {
      setError(null);
      await postsService.deletePost(postId, user.uid);

      // Remover de la lista
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err: any) {
      const errorMsg = err.message || 'Error al eliminar el post';
      setError(errorMsg);
      logger.error('Error en deletePost:', err);
      throw err;
    }
  }, [user, postsService]);

  /**
   * Dar like a un post
   */
  const likePost = useCallback(async (postId: string): Promise<void> => {
    if (!user) {
      throw new Error('Debes iniciar sesión para dar like');
    }

    try {
      setError(null);

      // Actualizar optimistamente
      setPosts(prev => prev.map(post => {
        if (post.id === postId && !post.likedBy.includes(user.uid)) {
          return {
            ...post,
            interactions: {
              ...post.interactions,
              likes: post.interactions.likes + 1
            },
            likedBy: [...post.likedBy, user.uid]
          };
        }
        return post;
      }));

      // Actualizar en Firebase
      await postsService.likePost(postId, user.uid);
    } catch (err: any) {
      const errorMsg = err.message || 'Error al dar like';
      setError(errorMsg);
      logger.error('Error en likePost:', err);

      // Revertir cambio optimista
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            interactions: {
              ...post.interactions,
              likes: Math.max(0, post.interactions.likes - 1)
            },
            likedBy: post.likedBy.filter(id => id !== user.uid)
          };
        }
        return post;
      }));

      throw err;
    }
  }, [user, postsService]);

  /**
   * Quitar like de un post
   */
  const unlikePost = useCallback(async (postId: string): Promise<void> => {
    if (!user) {
      throw new Error('Debes iniciar sesión para quitar like');
    }

    try {
      setError(null);

      // Actualizar optimistamente
      setPosts(prev => prev.map(post => {
        if (post.id === postId && post.likedBy.includes(user.uid)) {
          return {
            ...post,
            interactions: {
              ...post.interactions,
              likes: Math.max(0, post.interactions.likes - 1)
            },
            likedBy: post.likedBy.filter(id => id !== user.uid)
          };
        }
        return post;
      }));

      // Actualizar en Firebase
      await postsService.unlikePost(postId, user.uid);
    } catch (err: any) {
      const errorMsg = err.message || 'Error al quitar like';
      setError(errorMsg);
      logger.error('Error en unlikePost:', err);

      // Revertir cambio optimista
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            interactions: {
              ...post.interactions,
              likes: post.interactions.likes + 1
            },
            likedBy: [...post.likedBy, user.uid]
          };
        }
        return post;
      }));

      throw err;
    }
  }, [user, postsService]);

  /**
   * Agregar comentario
   */
  const addComment = useCallback(async (data: CreateCommentData): Promise<Comment> => {
    if (!user) {
      throw new Error('Debes iniciar sesión para comentar');
    }

    try {
      setError(null);
      const newComment = await postsService.addComment(
        user.uid,
        user.displayName,
        data,
        user.photoURL
      );

      // Actualizar contador de comentarios
      setPosts(prev => prev.map(post => {
        if (post.id === data.postId) {
          return {
            ...post,
            interactions: {
              ...post.interactions,
              comments: post.interactions.comments + 1
            }
          };
        }
        return post;
      }));

      return newComment;
    } catch (err: any) {
      const errorMsg = err.message || 'Error al agregar comentario';
      setError(errorMsg);
      logger.error('Error en addComment:', err);
      throw err;
    }
  }, [user, postsService]);

  /**
   * Obtener comentarios de un post
   */
  const getPostComments = useCallback(async (postId: string): Promise<Comment[]> => {
    try {
      setError(null);
      return await postsService.getPostComments(postId);
    } catch (err: any) {
      const errorMsg = err.message || 'Error al cargar comentarios';
      setError(errorMsg);
      logger.error('Error en getPostComments:', err);
      throw err;
    }
  }, [postsService]);

  /**
   * Obtener posts cercanos
   */
  const fetchNearbyPosts = useCallback(async (location: Location, radius: number): Promise<Post[]> => {
    try {
      setLoading(true);
      setError(null);

      const nearbyPosts = await postsService.getNearbyPosts(location, radius);
      setPosts(nearbyPosts);

      return nearbyPosts;
    } catch (err: any) {
      const errorMsg = err.message || 'Error al cargar posts cercanos';
      setError(errorMsg);
      logger.error('Error en fetchNearbyPosts:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [postsService]);

  /**
   * Refrescar posts
   */
  const refreshPosts = useCallback(async (): Promise<void> => {
    // Por ahora, simplemente limpia los posts
    // En el futuro, podría recargar basado en la última ubicación conocida
    setPosts([]);
    setError(null);
  }, []);

  const value: PostsContextType = {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    addComment,
    getPostComments,
    fetchNearbyPosts,
    refreshPosts
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = (): PostsContextType => {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error('usePosts debe ser usado dentro de un PostsProvider');
  }
  return context;
};
