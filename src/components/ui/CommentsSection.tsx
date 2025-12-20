import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './CommentsSection.css';

interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    createdAt: Date;
}

interface CommentsSectionProps {
    comments: Comment[];
    onAddComment: (text: string) => Promise<void>;
    onClose?: () => void;
    isModal?: boolean;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
    comments,
    onAddComment,
    onClose,
    isModal = false
}) => {
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        setSubmitting(true);
        try {
            await onAddComment(newComment.trim());
            setNewComment('');
        } catch (error) {
            console.error('Error al agregar comentario:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Justo ahora';
        if (minutes < 60) return `hace ${minutes}m`;
        if (hours < 24) return `hace ${hours}h`;
        if (days < 7) return `hace ${days}d`;
        return date.toLocaleDateString('es-ES');
    };

    const content = (
        <div className={`comments-section ${isModal ? 'modal' : ''}`}>
            {isModal && (
                <div className="comments-header">
                    <h3>💬 Comentarios ({comments.length})</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>
            )}

            <div className="comments-list">
                {comments.length === 0 ? (
                    <div className="no-comments">
                        <span className="no-comments-icon">💬</span>
                        <p>Sé el primero en comentar</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                            <div className="comment-avatar">
                                {comment.userAvatar ? (
                                    <img src={comment.userAvatar} alt={comment.userName} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {comment.userName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="comment-content">
                                <div className="comment-header">
                                    <span className="comment-author">{comment.userName}</span>
                                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                                </div>
                                <p className="comment-text">{comment.text}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {user && (
                <form onSubmit={handleSubmit} className="comment-form">
                    <div className="comment-input-container">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe un comentario..."
                            maxLength={500}
                            disabled={submitting}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || submitting}
                            className="send-btn"
                        >
                            {submitting ? '...' : '➤'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );

    if (isModal) {
        return (
            <div className="comments-overlay" onClick={onClose}>
                <div className="comments-modal" onClick={(e) => e.stopPropagation()}>
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

export default CommentsSection;
