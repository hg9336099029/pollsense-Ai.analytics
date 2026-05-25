import React from 'react';

// ─── Sentiment configuration ─────────────────────────────────────────────────
export const SENTIMENT_CONFIG = {
  Positive:      { emoji: '😊', bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  color: '#22c55e' },
  Negative:      { emoji: '😞', bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    color: '#ef4444' },
  Neutral:       { emoji: '😐', bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300',   color: '#94a3b8' },
  Controversial: { emoji: '⚡', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', color: '#f97316' },
  Engaging:      { emoji: '💛', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', color: '#a855f7' },
};

export const TOPIC_ICONS = {
  Politics:      '🏛️',
  Technology:    '💻',
  Lifestyle:     '🌿',
  Health:        '❤️',
  Entertainment: '🎬',
  Sports:        '⚽',
  Business:      '💼',
  Social:        '👥',
  Other:         '🔹',
};

export const EMOTION_CONFIG = {
  Hopeful:   { emoji: '🌟', bg: 'bg-green-50',  text: 'text-green-700'  },
  Joyful:    { emoji: '😄', bg: 'bg-green-50',  text: 'text-green-700'  },
  Inspiring: { emoji: '✨', bg: 'bg-green-50',  text: 'text-green-700'  },
  Curious:   { emoji: '🤔', bg: 'bg-blue-50',   text: 'text-blue-700'   },
  Neutral:   { emoji: '😶', bg: 'bg-gray-50',   text: 'text-gray-600'   },
  Divisive:  { emoji: '⚔️', bg: 'bg-red-50',    text: 'text-red-700'    },
  Fearful:   { emoji: '😰', bg: 'bg-red-50',    text: 'text-red-700'    },
  Angry:     { emoji: '😠', bg: 'bg-red-50',    text: 'text-red-700'    },
};

// ─── Components ──────────────────────────────────────────────────────────────

/**
 * Colored pill badge showing sentiment label + optional score
 */
export const SentimentBadge = ({ label, score, showScore = true }) => {
  const cfg = SENTIMENT_CONFIG[label] || SENTIMENT_CONFIG.Neutral;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.emoji} {label}{showScore && score !== undefined ? ` · ${score}/100` : ''}
    </span>
  );
};

/**
 * Colored pill showing the topic with an emoji icon
 */
export const TopicBadge = ({ topic }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
    {TOPIC_ICONS[topic] || '🔹'} {topic}
  </span>
);

/**
 * Thin horizontal bar showing sentiment score (0-100), colored by value
 */
export const SentimentMiniBar = ({ score, showLabel = true }) => {
  if (score === undefined || score === null) return null;
  const color = score > 66 ? '#22c55e' : score > 33 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
          <span>🤖 Sentiment Score</span>
          <span className="font-bold">{score}/100</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

/**
 * Skeleton loader pulse block — use while sentiment is loading
 */
export const SentimentSkeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);
