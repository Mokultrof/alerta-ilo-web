import React, { useState, useRef, useEffect } from 'react';
import './ReactionSystem.css';

interface Reaction {
    id: string;
    emoji: string;
    label: string;
    color: string;
    gradient: string;
}

interface ReactionSystemProps {
    currentReaction?: string | null;
    reactionCounts: { [key: string]: number };
    onReact: (reactionId: string | null) => void;
    size?: 'sm' | 'md' | 'lg';
}

const REACTIONS: Reaction[] = [
    {
        id: 'urgent',
        emoji: '🚨',
        label: 'Urgente',
        color: '#ff4757',
        gradient: 'linear-gradient(135deg, #ff4757 0%, #ff6b6b 100%)'
    },
    {
        id: 'support',
        emoji: '🤝',
        label: 'Apoyo',
        color: '#3742fa',
        gradient: 'linear-gradient(135deg, #3742fa 0%, #5352ed 100%)'
    },
    {
        id: 'seen',
        emoji: '👀',
        label: 'Lo vi',
        color: '#ffa502',
        gradient: 'linear-gradient(135deg, #ffa502 0%, #ff7f50 100%)'
    },
    {
        id: 'resolved',
        emoji: '✅',
        label: 'Resuelto',
        color: '#2ed573',
        gradient: 'linear-gradient(135deg, #2ed573 0%, #7bed9f 100%)'
    },
    {
        id: 'thanks',
        emoji: '💜',
        label: 'Gracias',
        color: '#a55eea',
        gradient: 'linear-gradient(135deg, #a55eea 0%, #8854d0 100%)'
    }
];

const createParticle = (x: number, y: number, emoji: string, color: string) => {
    const particle = document.createElement('div');
    particle.className = 'reaction-particle';
    particle.textContent = emoji;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty('--particle-color', color);

    // Random direction
    const angle = Math.random() * Math.PI * 2;
    const velocity = 50 + Math.random() * 100;
    const endX = Math.cos(angle) * velocity;
    const endY = Math.sin(angle) * velocity - 50;

    particle.style.setProperty('--end-x', `${endX}px`);
    particle.style.setProperty('--end-y', `${endY}px`);
    particle.style.setProperty('--rotation', `${Math.random() * 720 - 360}deg`);

    document.body.appendChild(particle);

    setTimeout(() => particle.remove(), 1000);
};

const ReactionSystem: React.FC<ReactionSystemProps> = ({
    currentReaction,
    reactionCounts,
    onReact,
    size = 'md'
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [animatingReaction, setAnimatingReaction] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsExpanded(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setIsExpanded(false), 300);
    };

    const handleReaction = (reaction: Reaction, e: React.MouseEvent) => {
        e.stopPropagation();

        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // Crear partículas
        for (let i = 0; i < 8; i++) {
            setTimeout(() => createParticle(x, y, reaction.emoji, reaction.color), i * 50);
        }

        setAnimatingReaction(reaction.id);
        setTimeout(() => setAnimatingReaction(null), 600);

        // Toggle reaction
        if (currentReaction === reaction.id) {
            onReact(null);
        } else {
            onReact(reaction.id);
        }

        setIsExpanded(false);
    };

    const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);
    const currentReactionData = REACTIONS.find(r => r.id === currentReaction);
    const topReactions = Object.entries(reactionCounts)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    return (
        <div
            ref={containerRef}
            className={`reaction-system size-${size}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Trigger button */}
            <button
                className={`reaction-trigger ${currentReaction ? 'has-reaction' : ''}`}
                style={currentReactionData ? {
                    background: currentReactionData.gradient,
                    boxShadow: `0 4px 20px ${currentReactionData.color}40`
                } : undefined}
            >
                {currentReactionData ? (
                    <>
                        <span className="trigger-emoji">{currentReactionData.emoji}</span>
                        <span className="trigger-label">{currentReactionData.label}</span>
                    </>
                ) : (
                    <>
                        <span className="trigger-emoji">🎯</span>
                        <span className="trigger-label">Reaccionar</span>
                    </>
                )}
            </button>

            {/* Reaction bar */}
            <div className={`reaction-bar ${isExpanded ? 'expanded' : ''}`}>
                {REACTIONS.map((reaction, index) => (
                    <button
                        key={reaction.id}
                        className={`reaction-option ${currentReaction === reaction.id ? 'active' : ''} ${animatingReaction === reaction.id ? 'animating' : ''}`}
                        onClick={(e) => handleReaction(reaction, e)}
                        style={{
                            animationDelay: `${index * 50}ms`,
                            '--reaction-color': reaction.color
                        } as React.CSSProperties}
                        title={reaction.label}
                    >
                        <span className="reaction-emoji">{reaction.emoji}</span>
                        <span className="reaction-tooltip">{reaction.label}</span>
                    </button>
                ))}
            </div>

            {/* Reaction summary */}
            {totalReactions > 0 && (
                <div className="reaction-summary">
                    <div className="summary-avatars">
                        {topReactions.map(([reactionId]) => {
                            const reaction = REACTIONS.find(r => r.id === reactionId);
                            return reaction ? (
                                <span
                                    key={reactionId}
                                    className="summary-emoji"
                                    style={{ background: reaction.gradient }}
                                >
                                    {reaction.emoji}
                                </span>
                            ) : null;
                        })}
                    </div>
                    <span className="summary-count">{totalReactions}</span>
                </div>
            )}
        </div>
    );
};

export default ReactionSystem;
