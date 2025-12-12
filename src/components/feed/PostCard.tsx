/**
 * PostCard - Tarjeta de post estilo Instagram/TikTok
 */

import React, { useState } from 'react';
import { Post } from '../../types';
import Card from '../ui/Card';
import './PostCard.css';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onUserClick: (userId: string) => void;
  onLocationClick: (location: any) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onUnlike,
  onComment,
  onShare,
  onUserClick,
  onLocationClick
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const isLiked = currentUserId ? post.likedBy.includes(currentUserId) : false;

  const handleLikeClick = () => {
    if (isLiked) {
      onUnlike(post.id);
    } else {
      onLike(post.id);
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      onLike(post.id);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Ahora';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <Card className="post-card" padding="none">
      {/* Header */}
      <div className="post-card__header">
        <div 
          className="post-card__user"
          onClick={() => onUserClick(post.userId)}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && onUserClick(post.userId)}
          aria-label={`Ver perfil de ${post.userName}`}
        >
          <div className="post-card__avatar">
            {post.userAvatar ? (
              <img src={post.userAvatar} alt={post.userName} />
            ) : (
              <div className="post-card__avatar-placeholder">
                {post.userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="post-card__user-info">
            <span className="post-card__username">{post.userName}</span>
            <div
              className="post-card__location"
              onClick={(e) => {
                e.stopPropagation();
                onLocationClick(post.location);
              }}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  onLocationClick(post.location);
                }
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>{post.location.placeName || post.location.address}</span>
            </div>
          </div>
        </div>
        
        <button className="post-card__menu" aria-label="Más opciones">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="12" cy="19" r="2"/>
          </svg>
        </button>
      </div>

      {/* Image */}
      {post.content.imageUrl && (
        <div 
          className="post-card__image-container"
          onDoubleClick={handleDoubleTap}
        >
          {!imageLoaded && (
            <div className="post-card__image-skeleton skeleton" />
          )}
          <img
            src={post.content.imageUrl}
            alt={post.content.description}
            className={`post-card__image ${imageLoaded ? 'loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="post-card__actions">
        <div className="post-card__actions-left">
          <button
            className={`post-card__action-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLikeClick}
            aria-label={isLiked ? 'Quitar like' : 'Dar like'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          
          <button
            className="post-card__action-btn"
            onClick={() => onComment(post.id)}
            aria-label="Comentar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </button>
          
          <button
            className="post-card__action-btn"
            onClick={() => onShare(post.id)}
            aria-label="Compartir"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Likes count */}
      {post.interactions.likes > 0 && (
        <div className="post-card__likes">
          <strong>{post.interactions.likes.toLocaleString()}</strong>
          {post.interactions.likes === 1 ? ' me gusta' : ' me gusta'}
        </div>
      )}

      {/* Content */}
      <div className="post-card__content">
        <p className="post-card__description">
          <strong className="post-card__username">{post.userName}</strong>
          {' '}
          {post.content.description}
        </p>
      </div>

      {/* Comments preview */}
      {post.interactions.comments > 0 && (
        <button
          className="post-card__comments-link"
          onClick={() => onComment(post.id)}
        >
          Ver {post.interactions.comments === 1 ? 'el comentario' : `los ${post.interactions.comments} comentarios`}
        </button>
      )}

      {/* Timestamp */}
      <div className="post-card__timestamp">
        {formatTimeAgo(post.createdAt)}
      </div>
    </Card>
  );
};

export default PostCard;
