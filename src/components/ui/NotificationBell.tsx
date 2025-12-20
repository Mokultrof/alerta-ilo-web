import React, { useState } from 'react';
import { useNotifications, Notification } from '../../contexts/NotificationContext';
import './NotificationBell.css';

const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

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

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'like': return '❤️';
            case 'comment': return '💬';
            case 'report_update': return '📋';
            case 'system': return '🔔';
            default: return '📢';
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            // Navigate to link if needed
        }
    };

    return (
        <div className="notification-bell-container">
            <button
                className="notification-bell-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
            >
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="notification-backdrop" onClick={() => setIsOpen(false)} />
                    <div className="notification-dropdown">
                        <div className="notification-header">
                            <h3>Notificaciones</h3>
                            {unreadCount > 0 && (
                                <button className="mark-all-read" onClick={markAllAsRead}>
                                    Marcar todo como leído
                                </button>
                            )}
                        </div>

                        <div className="notification-list">
                            {notifications.length === 0 ? (
                                <div className="no-notifications">
                                    <span className="no-notif-icon">🔕</span>
                                    <p>No tienes notificaciones</p>
                                </div>
                            ) : (
                                notifications.slice(0, 10).map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <span className="notif-icon">{getNotificationIcon(notification.type)}</span>
                                        <div className="notif-content">
                                            <p className="notif-title">{notification.title}</p>
                                            <p className="notif-message">{notification.message}</p>
                                            <span className="notif-time">{formatDate(notification.createdAt)}</span>
                                        </div>
                                        <button
                                            className="notif-delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearNotification(notification.id);
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
