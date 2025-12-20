import React, { useState } from 'react';
import './ShareButtons.css';

interface ShareButtonsProps {
    title: string;
    description: string;
    url?: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ title, description, url }) => {
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareUrl = url || window.location.href;
    const shareText = `${title}: ${description}`;

    const handleWhatsAppShare = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
        window.open(whatsappUrl, '_blank');
        setShowShareMenu(false);
    };

    const handleFacebookShare = () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
        setShowShareMenu(false);
    };

    const handleTwitterShare = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
        setShowShareMenu(false);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Error al copiar:', err);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: description,
                    url: shareUrl
                });
            } catch (err) {
                console.log('Share cancelado o error:', err);
            }
        } else {
            setShowShareMenu(true);
        }
    };

    return (
        <div className="share-buttons-container">
            <button
                className="share-trigger-btn"
                onClick={handleNativeShare}
                title="Compartir"
            >
                📤 Compartir
            </button>

            {showShareMenu && (
                <>
                    <div className="share-overlay" onClick={() => setShowShareMenu(false)} />
                    <div className="share-menu">
                        <div className="share-menu-header">
                            <span>Compartir en</span>
                            <button className="share-close-btn" onClick={() => setShowShareMenu(false)}>✕</button>
                        </div>

                        <div className="share-options">
                            <button className="share-option whatsapp" onClick={handleWhatsAppShare}>
                                <span className="share-icon">💬</span>
                                <span>WhatsApp</span>
                            </button>

                            <button className="share-option facebook" onClick={handleFacebookShare}>
                                <span className="share-icon">📘</span>
                                <span>Facebook</span>
                            </button>

                            <button className="share-option twitter" onClick={handleTwitterShare}>
                                <span className="share-icon">🐦</span>
                                <span>Twitter</span>
                            </button>

                            <button className="share-option copy" onClick={handleCopyLink}>
                                <span className="share-icon">{copied ? '✅' : '🔗'}</span>
                                <span>{copied ? '¡Copiado!' : 'Copiar enlace'}</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ShareButtons;
