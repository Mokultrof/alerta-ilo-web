/**
 * Feed - Componente principal del feed de posts
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '../../contexts/PostsContext';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from './PostCard';
import CommentsModal from './CommentsModal';
import Button from '../ui/Button';
import './Feed.css';

interface FeedProps {
  onCreatePost?: () => void;
}

const Feed: React.FC<FeedProps> = ({ onCreatePost }) => {
  const navigate = useNavigate();
  const { posts, loading, error, likePost, unlikePost, fetchNearbyPosts } = usePosts();
  const { user } = useAuth();
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [commentsModal, setCommentsModal] = useState<{ isOpen: boolean; postId: string }>({
    isOpen: false,
    postId: ''
  });

  useEffect(() => {
    // Cargar posts cercanos al montar
    loadNearbyPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNearbyPosts = async () => {
    setLoadingLocation(true);
    try {
      // Obtener ubicación actual
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Tu ubicación'
            };
            await fetchNearbyPosts(location, 10); // 10km de radio
            setLoadingLocation(false);
          },
          (error) => {
            console.error('Error obteniendo ubicación:', error);
            // Usar ubicación por defecto (Ilo, Perú)
            const defaultLocation = {
              lat: -17.6397,
              lng: -71.3378,
              address: 'Ilo, Perú'
            };
            fetchNearbyPosts(defaultLocation, 50);
            setLoadingLocation(false);
          }
        );
      } else {
        // Usar ubicación por defecto
        const defaultLocation = {
          lat: -17.6397,
          lng: -71.3378,
          address: 'Ilo, Perú'
        };
        await fetchNearbyPosts(defaultLocation, 50);
        setLoadingLocation(false);
      }
    } catch (err) {
      console.error('Error cargando posts:', err);
      setLoadingLocation(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await likePost(postId);
    } catch (err) {
      console.error('Error al dar like:', err);
    }
  };

  const handleUnlike = async (postId: string) => {
    try {
      await unlikePost(postId);
    } catch (err) {
      console.error('Error al quitar like:', err);
    }
  };

  const handleComment = (postId: string) => {
    setCommentsModal({ isOpen: true, postId });
  };

  const handleShare = (postId: string) => {
    console.log('Compartir post:', postId);
    // TODO: Implementar funcionalidad de compartir
  };

  const handleUserClick = (userId: string) => {
    console.log('Ver perfil de usuario:', userId);
    // TODO: Navegar al perfil del usuario
  };

  const handleLocationClick = (location: any) => {
    navigate('/map');
  };

  if (loadingLocation || loading) {
    return (
      <div className="feed">
        <div className="feed__loading">
          <div className="feed__spinner">
            <svg className="ss-spinner" viewBox="0 0 24 24">
              <circle
                className="ss-spinner__circle"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="3"
              />
            </svg>
          </div>
          <p>Cargando posts cercanos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed">
        <div className="feed__error">
          <p>{error}</p>
          <Button onClick={loadNearbyPosts}>Reintentar</Button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="feed">
        <div className="feed__empty">
          <div className="feed__empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <h3>No hay posts cercanos</h3>
          <p>Sé el primero en compartir algo en esta área</p>
          {onCreatePost && (
            <Button onClick={onCreatePost} variant="primary">
              Crear Post
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="feed">
      <div className="feed__header">
        <h2 className="feed__title gradient-text">SpotShare</h2>
        {onCreatePost && (
          <Button onClick={onCreatePost} size="sm" variant="primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Button>
        )}
      </div>

      <div className="feed__posts">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.uid}
            onLike={handleLike}
            onUnlike={handleUnlike}
            onComment={handleComment}
            onShare={handleShare}
            onUserClick={handleUserClick}
            onLocationClick={handleLocationClick}
          />
        ))}
      </div>

      {/* Botón flotante para crear post */}
      {onCreatePost && (
        <button
          className="feed__fab"
          onClick={onCreatePost}
          aria-label="Crear nuevo post"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* Modal de comentarios */}
      <CommentsModal
        isOpen={commentsModal.isOpen}
        postId={commentsModal.postId}
        onClose={() => setCommentsModal({ isOpen: false, postId: '' })}
      />
    </div>
  );
};

export default Feed;
