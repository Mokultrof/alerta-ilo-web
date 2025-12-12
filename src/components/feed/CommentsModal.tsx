/**
 * CommentsModal - Modal para ver y agregar comentarios
 */

import React, { useState, useEffect } from 'react';
import { usePosts } from '../../contexts/PostsContext';
import { useAuth } from '../../contexts/AuthContext';
import { Comment } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import './CommentsModal.css';

interface CommentsModalProps {
  isOpen: boolean;
  postId: string;
  onClose: () => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, postId, onClose }) => {
  const { getPostComments, addComment } = usePosts();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      loadComments();
    }
  }, [isOpen, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const postComments = await getPostComments(postId);
      setComments(postComments);
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const comment = await addComment({
        postId,
        text: newComment.trim()
      });
      
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error agregando comentario:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Ahora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (!isOpen) return null;

  return (
    <div className="comments-modal-overlay" onClick={onClose}>
      <div className="comments-modal" onClick={(e) => e.stopPropagation()}>
        <Card padding="none">
          <div className="comments-modal__header">
            <h3>Comentarios</h3>
            <button 
              className="comments-modal__close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="comments-modal__content">
            {loading ? (
              <div className="comments-modal__loading">
                <div className="comments-modal__spinner">
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
                <p>Cargando comentarios...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="comments-modal__empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                <p>No hay comentarios aún</p>
                <span>Sé el primero en comentar</span>
              </div>
            ) : (
              <div className="comments-modal__list">
                {comments.map((comment) => (
                  <div key={comment.id} className="comment">
                    <div className="comment__avatar">
                      {comment.userAvatar ? (
                        <img src={comment.userAvatar} alt={comment.userName} />
                      ) : (
                        <div className="comment__avatar-placeholder">
                          {comment.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="comment__content">
                      <div className="comment__header">
                        <span className="comment__username">{comment.userName}</span>
                        <span className="comment__time">{formatTimeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="comment__text">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {user && (
            <form onSubmit={handleSubmit} className="comments-modal__form">
              <div className="comments-modal__input-container">
                <div className="comments-modal__user-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} />
                  ) : (
                    <div className="comments-modal__avatar-placeholder">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="comments-modal__input"
                  maxLength={500}
                  disabled={submitting}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  disabled={!newComment.trim()}
                >
                  Enviar
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CommentsModal;