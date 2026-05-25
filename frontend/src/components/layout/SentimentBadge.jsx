import React from 'react';

// ─── Sentiment configuration ─────────────────────────────────────────────────
export const SENTIMENT_CONFIG = {
  Positive:      { label: 'Positive',      bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  color: '#22c55e', dot: 'bg-green-500' },
  Negative:      { label: 'Negative',      bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    color: '#ef4444', dot: 'bg-red-500'   },
  Neutral:       { label: 'Neutral',       bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300',   color: '#94a3b8', dot: 'bg-gray-400'  },
  Controversial: { label: 'Controversial', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', color: '#f97316', dot: 'bg-orange-500'},
  Engaging:      { label: 'Engaging',      bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', color: '#a855f7', dot: 'bg-purple-500'},
};

export const TOPIC_ICONS = {
  Politics:      'POL',
  Technology:    'TECH',
  Lifestyle:     'LIFE',
  Health:        'HLTH',
  Entertainment: 'ENT',
  Sports:        'SPT',
  Business:      'BIZ',
  Social:        'SOC',
  Other:         'GEN',
};

export const EMOTION_CONFIG = {
  Hopeful:   { label: 'Hopeful',   bg: 'bg-green-50',  text: 'text-green-700'  },
  Joyful:    { label: 'Joyful',    bg: 'bg-green-50',  text: 'text-green-700'  },
  Inspiring: { label: 'Inspiring', bg: 'bg-green-50',  text: 'text-green-700'  },
  Curious:   { label: 'Curious',   bg: 'bg-blue-50',   text: 'text-blue-700'   },
  Neutral:   { label: 'Neutral',   bg: 'bg-gray-50',   text: 'text-gray-600'   },
  Divisive:  { label: 'Divisive',  bg: 'bg-red-50',    text: 'text-red-700'    },
  Fearful:   { label: 'Fearful',   bg: 'bg-red-50',    text: 'text-red-700'    },
  Angry:     { label: 'Angry',     bg: 'bg-red-50',    text: 'text-red-700'    },
};

// ─── Components ──────────────────────────────────────────────────────────────

/**
 * Colored pill badge showing sentiment label + optional score
 */
export const SentimentBadge = ({ label, score, showScore = true }) => {
  const cfg = SENTIMENT_CONFIG[label] || SENTIMENT_CONFIG.Neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
      {label}{showScore && score !== undefined ? ` · ${score}/100` : ''}
    </span>
  );
};

/**
 * Colored pill showing the topic with a text label
 */
export const TopicBadge = ({ topic }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
    <span className="font-bold text-blue-500 text-[10px]">{TOPIC_ICONS[topic] || 'GEN'}</span>
    {topic}
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
          <span className="font-medium">AI Sentiment Score</span>
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
