import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/layout/dashboardLayout';
import { axiosInstance } from '../../utils/axiosInstance';
import { API_PATH } from '../../utils/apipath';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
  BarChart, Bar, Legend,
} from 'recharts';
import {
  SENTIMENT_CONFIG, TOPIC_ICONS, EMOTION_CONFIG,
  SentimentBadge, TopicBadge, SentimentMiniBar, SentimentSkeleton,
} from '../../components/layout/SentimentBadge';

// ─── Sentiment Score SVG Arc Gauge ───────────────────────────────────────────
const SentimentGauge = ({ score, total, loading }) => {
  const r = 75;
  const cx = 110;
  const cy = 100;
  const circumference = Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 66 ? '#22c55e' : score > 33 ? '#f59e0b' : '#ef4444';
  const label = score > 66 ? 'Mostly Positive' : score > 33 ? 'Mixed Signals' : 'Mostly Negative';

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <SentimentSkeleton className="w-44 h-24 rounded-full" />
        <SentimentSkeleton className="w-32 h-4 rounded" />
        <SentimentSkeleton className="w-44 h-3 rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="130" viewBox="0 0 220 130">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#f3f4f6" strokeWidth="16" strokeLinecap="round" />
        {/* Score fill */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${circumference}`} strokeDashoffset={`${offset}`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke 0.5s ease' }} />
        {/* Score number */}
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="32" fontWeight="900" fill="#111827">{score}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="12" fill="#9ca3af">out of 100</text>
      </svg>
      <p className="text-sm font-bold text-gray-700 -mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-1">Based on {total} polls · Groq AI</p>
    </div>
  );
};

// ─── Highlight Poll Card ──────────────────────────────────────────────────────
const HighlightCard = ({ poll, type }) => {
  const configs = {
    positive:      { title: 'Most Positive',      border: 'border-green-400',  header: 'bg-green-50',  titleColor: 'text-green-700' },
    negative:      { title: 'Most Negative',      border: 'border-red-400',    header: 'bg-red-50',    titleColor: 'text-red-700'   },
    controversial: { title: 'Most Controversial', border: 'border-orange-400', header: 'bg-orange-50', titleColor: 'text-orange-700' },
  };
  const cfg = configs[type] || configs.positive;

  if (!poll) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-gray-300 min-h-44">
      <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.636-6.364l.707.707M6.343 17.657l-.707.707M17.657 17.657l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
        <p className="text-sm font-medium text-gray-400">Not enough data yet</p>
      </div>
    );
  }

  const totalVotes = poll.options?.reduce((s, o) => s + o.votes, 0) || 0;
  const sentCfg = SENTIMENT_CONFIG[poll.sentiment?.label] || SENTIMENT_CONFIG.Neutral;

  return (
    <div className={`bg-white rounded-2xl border-2 ${cfg.border} overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200`}>
      <div className={`${cfg.header} px-5 py-3 flex items-center justify-between`}>
        <span className={`text-sm font-bold ${cfg.titleColor}`}>{cfg.title}</span>
        <span className={`text-xl font-black ${sentCfg.text}`}>{poll.sentiment?.score}/100</span>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2 mb-3">
          <SentimentBadge label={poll.sentiment?.label} score={poll.sentiment?.score} showScore={false} />
          {poll.sentiment?.topic && <TopicBadge topic={poll.sentiment.topic} />}
          {poll.sentiment?.emotion && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EMOTION_CONFIG[poll.sentiment.emotion]?.bg} ${EMOTION_CONFIG[poll.sentiment.emotion]?.text}`}>
              {EMOTION_CONFIG[poll.sentiment.emotion]?.emoji} {poll.sentiment.emotion}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 leading-snug">{poll.question}</p>
        {poll.sentiment?.summary && (
          <p className="text-xs italic text-gray-400 mb-3 line-clamp-2">AI insight: {poll.sentiment.summary}</p>
        )}
        {poll.sentiment?.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {poll.sentiment.keywords.map(kw => (
              <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#{kw}</span>
            ))}
          </div>
        )}
        <SentimentMiniBar score={poll.sentiment?.score} showLabel={false} />
        <p className="text-xs text-gray-400 mt-2">✔ {totalVotes} total votes</p>
      </div>
    </div>
  );
};

const COLORS = ['#6366f1', '#ef4444', '#94a3b8', '#f97316', '#a855f7', '#22c55e', '#f59e0b', '#06b6d4'];

// ─── Main Sentiment Dashboard ─────────────────────────────────────────────────
const SentimentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState(false);

  const [allPolls, setAllPolls] = useState([]);
  const [avgSentimentScore, setAvgSentimentScore] = useState(0);
  const [sentimentDist, setSentimentDist] = useState([]);
  const [topicData, setTopicData] = useState([]);
  const [emotionData, setEmotionData] = useState([]);
  const [sentimentTrend, setSentimentTrend] = useState([]);
  const [topPolls, setTopPolls] = useState({ mostPositive: null, mostNegative: null, mostControversial: null });
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [pollTypeVsScore, setPollTypeVsScore] = useState([]);

  const ranRef = useRef(false);

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      try {
        setLoading(true);
        const pollsRes = await axiosInstance.get(API_PATH.AUTH.GET_POLLS);
        const polls = pollsRes.data.polls || [];
        setAllPolls(polls);
        setLoading(false);

        if (polls.length === 0 || ranRef.current) return;
        ranRef.current = true;
        setSentimentLoading(true);
        setSentimentError(false);

        const sentRes = await axiosInstance.post(API_PATH.AUTH.ANALYZE_SENTIMENT, {
          pollIds: polls.map(p => p._id),
        });
        const results = sentRes.data.results || [];
        setAnalyzedCount(results.filter(r => r.sentiment?.label).length);

        // Build sentiment map
        const sentMap = {};
        results.forEach(r => { sentMap[r._id] = r.sentiment; });
        const enriched = polls.map(p => ({ ...p, sentiment: sentMap[p._id] || p.sentiment }));

        // Average score
        const scored = results.filter(r => r.sentiment?.score !== undefined);
        const avg = scored.length > 0 ? Math.round(scored.reduce((s, r) => s + r.sentiment.score, 0) / scored.length) : 50;
        setAvgSentimentScore(avg);

        // Sentiment distribution
        const distMap = { Positive: 0, Negative: 0, Neutral: 0, Controversial: 0, Engaging: 0 };
        results.forEach(r => { if (r.sentiment?.label) distMap[r.sentiment.label]++; });
        setSentimentDist(Object.entries(distMap).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })));

        // Topic distribution
        const topicMap = {};
        results.forEach(r => { if (r.sentiment?.topic) topicMap[r.sentiment.topic] = (topicMap[r.sentiment.topic] || 0) + 1; });
        setTopicData(Object.entries(topicMap).map(([name, value]) => ({ name, value })));

        // Emotion distribution
        const emotionMap = {};
        results.forEach(r => { if (r.sentiment?.emotion) emotionMap[r.sentiment.emotion] = (emotionMap[r.sentiment.emotion] || 0) + 1; });
        setEmotionData(Object.entries(emotionMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value })));

        // Sentiment trend by week
        const weekMap = {};
        results.forEach(r => {
          const poll = polls.find(p => p._id === r._id);
          if (!poll || !r.sentiment?.score) return;
          const d = new Date(poll.createdAt);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          const key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!weekMap[key]) weekMap[key] = { scores: [], date: weekStart };
          weekMap[key].scores.push(r.sentiment.score);
        });
        const trend = Object.entries(weekMap)
          .sort(([, a], [, b]) => a.date - b.date).slice(-8)
          .map(([week, { scores }]) => ({ week, score: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) }));
        setSentimentTrend(trend);

        // Poll type vs avg sentiment score
        const typeScoreMap = {};
        results.forEach(r => {
          const poll = polls.find(p => p._id === r._id);
          if (!poll || !r.sentiment?.score) return;
          const t = poll.pollType;
          if (!typeScoreMap[t]) typeScoreMap[t] = [];
          typeScoreMap[t].push(r.sentiment.score);
        });
        setPollTypeVsScore(Object.entries(typeScoreMap).map(([type, scores]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          avgScore: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
          count: scores.length,
        })));

        // Top polls
        const withScore = results.filter(r => r.sentiment?.score !== undefined);
        const findPoll = (id) => enriched.find(p => p._id === id) || null;
        setTopPolls({
          mostPositive: findPoll(withScore.reduce((best, r) => r.sentiment.score > (best?.sentiment.score ?? -1) ? r : best, null)?._id),
          mostNegative: findPoll(withScore.reduce((best, r) => r.sentiment.score < (best?.sentiment.score ?? 101) ? r : best, null)?._id),
          mostControversial: findPoll(withScore.filter(r => r.sentiment?.label === 'Controversial').reduce((best, r) => r.sentiment.score < (best?.sentiment.score ?? 101) ? r : best, null)?._id),
        });

      } catch (err) {
        console.error('Sentiment Dashboard error:', err);
        setSentimentError(true);
      } finally {
        setLoading(false);
        setSentimentLoading(false);
      }
    };
    fetchAndAnalyze();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-indigo-300 mb-4">
              <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.636-6.364l.707.707M6.343 17.657l-.707.707M17.657 17.657l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
            </div>
            <p className="text-gray-600 font-medium">Initializing AI Analysis…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const sentimentTotal = sentimentDist.reduce((s, d) => s + d.value, 0);
  const topTopic = [...topicData].sort((a, b) => b.value - a.value)[0]?.name;
  const topEmotion = emotionData[0]?.name;
  const overallMood = avgSentimentScore > 66 ? 'Positive' : avgSentimentScore > 33 ? 'Mixed' : 'Negative';

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 min-h-screen">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Sentiment Analysis</h1>
              <p className="text-indigo-300 mt-1">Deep AI-powered analysis of poll emotions, topics & community mood</p>
            </div>
            <div className="flex items-center gap-3">
              {sentimentLoading && (
                <span className="flex items-center gap-2 bg-indigo-700 text-indigo-200 text-xs px-3 py-2 rounded-full animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-indigo-300 animate-ping inline-block" />
                  Analyzing with Groq AI…
                </span>
              )}
              {!sentimentLoading && !sentimentError && analyzedCount > 0 && (
                <span className="bg-emerald-900 text-emerald-300 text-xs px-3 py-2 rounded-full font-medium">
                  {analyzedCount} polls analyzed
                </span>
              )}
              {sentimentError && (
                <span className="bg-red-900 text-red-300 text-xs px-3 py-2 rounded-full">
                  ⚠ AI unavailable — using fallback
                </span>
              )}
            </div>
          </div>

          {/* ── Row 1: Gauge + Breakdown ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            {/* Gauge */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center">
              <h2 className="text-white font-bold mb-2 text-sm uppercase tracking-widest">Overall Mood Score</h2>
              <SentimentGauge score={avgSentimentScore} total={sentimentTotal} loading={sentimentLoading} />
            </div>

            {/* Sentiment Distribution Cards */}
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Sentiment Distribution</h2>
              {sentimentLoading ? (
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map(i => <SentimentSkeleton key={i} className="h-20 rounded-xl opacity-50" />)}
                </div>
              ) : sentimentDist.length === 0 ? (
                <p className="text-indigo-300 text-sm text-center py-8">Run the dashboard to analyze polls</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                    {Object.keys(SENTIMENT_CONFIG).map(label => {
                      const d = sentimentDist.find(x => x.name === label);
                      const count = d?.value || 0;
                      const cfg = SENTIMENT_CONFIG[label];
                      const pct = sentimentTotal > 0 ? ((count / sentimentTotal) * 100).toFixed(0) : 0;
                      return (
                        <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                          <p className="text-2xl mb-1">{cfg.emoji}</p>
                          <p className="text-2xl font-black text-white">{count}</p>
                          <p className="text-xs text-gray-300 font-medium">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{pct}%</p>
                        </div>
                      );
                    })}
                  </div>
                  {/* Stacked bar */}
                  <div className="w-full h-3 rounded-full overflow-hidden flex" title="Sentiment distribution">
                    {sentimentDist.map(d => (
                      <div key={d.name} title={`${d.name}: ${d.value}`}
                        style={{ width: `${(d.value / sentimentTotal) * 100}%`, backgroundColor: SENTIMENT_CONFIG[d.name]?.color }}
                        className="transition-all duration-700" />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Row 2: Trend + Topic Donut ───────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Sentiment Trend */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Mood Trend (Weekly)</h2>
              {sentimentLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <SentimentSkeleton key={i} className="h-8 rounded opacity-50" />)}</div>
              ) : sentimentTrend.length < 2 ? (
                <div className="flex flex-col items-center justify-center h-52 text-indigo-300 text-sm gap-2">
                  <div className="text-indigo-400 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <p>Not enough weekly data yet</p>
                  <p className="text-xs text-indigo-500">Create polls across different weeks to see the trend</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={sentimentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="week" tick={{ fill: '#a5b4fc', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#a5b4fc', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: 12, color: '#e0e7ff' }}
                      formatter={v => [`${v}/100`, 'Avg Mood']}
                    />
                    <ReferenceLine y={66} stroke="#22c55e" strokeDasharray="5 5" label={{ value: '+ve', fill: '#22c55e', fontSize: 10 }} />
                    <ReferenceLine y={33} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '-ve', fill: '#ef4444', fontSize: 10 }} />
                    <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3}
                      dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#a5b4fc' }}
                      activeDot={{ r: 7, fill: '#818cf8' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Topic Donut */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Topic Distribution</h2>
              {sentimentLoading ? (
                <div className="flex justify-center"><SentimentSkeleton className="w-44 h-44 rounded-full opacity-50" /></div>
              ) : topicData.length === 0 ? (
                <div className="flex items-center justify-center h-52 text-indigo-300 text-sm">No topic data</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={topicData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value"
                      label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                      {topicData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: 12, color: '#e0e7ff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Row 3: Poll Type vs Sentiment Score + Emotion Pills ───────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Poll Type vs Avg Sentiment Bar */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Poll Type vs Mood Score</h2>
              {sentimentLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <SentimentSkeleton key={i} className="h-8 rounded opacity-50" />)}</div>
              ) : pollTypeVsScore.length === 0 ? (
                <div className="flex items-center justify-center h-52 text-indigo-300 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pollTypeVsScore} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#a5b4fc', fontSize: 11 }} />
                    <YAxis dataKey="type" type="category" tick={{ fill: '#a5b4fc', fontSize: 11 }} width={90} />
                    <Tooltip
                      contentStyle={{ background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: 12, color: '#e0e7ff' }}
                      formatter={(v) => [`${v}/100`, 'Avg Mood Score']}
                    />
                    <Bar dataKey="avgScore" radius={[0, 6, 6, 0]}>
                      {pollTypeVsScore.map((entry, i) => (
                        <Cell key={i} fill={entry.avgScore > 66 ? '#22c55e' : entry.avgScore > 33 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Emotion Pills */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Community Emotions</h2>
              {sentimentLoading ? (
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3, 4, 5].map(i => <SentimentSkeleton key={i} className="h-8 w-24 rounded-full opacity-50" />)}
                </div>
              ) : emotionData.length === 0 ? (
                <p className="text-indigo-300 text-sm">No emotion data yet</p>
              ) : (
                <div className="flex flex-wrap gap-3 content-start">
                  {emotionData.map(({ name, value }) => {
                    const cfg = EMOTION_CONFIG[name] || EMOTION_CONFIG.Neutral;
                    const maxCount = emotionData[0]?.value || 1;
                    const scale = value / maxCount;
                    const size = scale > 0.7 ? 'text-base px-4 py-2' : scale > 0.4 ? 'text-sm px-3 py-1.5' : 'text-xs px-2 py-1';
                    return (
                      <span key={name}
                        className={`${size} rounded-full font-semibold bg-white/10 border border-white/20 text-white flex items-center gap-1.5 hover:bg-white/20 transition-colors cursor-default`}>
                        <span>{cfg.emoji}</span>
                        <span>{name}</span>
                        <span className="bg-white/20 rounded-full px-1.5 text-xs">{value}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Top 3 Highlight Cards ─────────────────────────────────────── */}
          <div className="mb-6">
            <h2 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">AI Poll Highlights</h2>
            {sentimentLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map(i => <SentimentSkeleton key={i} className="h-52 rounded-2xl opacity-50" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <HighlightCard poll={topPolls.mostPositive} type="positive" />
                <HighlightCard poll={topPolls.mostControversial} type="controversial" />
                <HighlightCard poll={topPolls.mostNegative} type="negative" />
              </div>
            )}
          </div>

          {/* ── AI Quick Stats Banner ─────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 shadow-xl">
            <h2 className="text-white font-bold mb-5 text-sm uppercase tracking-widest">AI-Powered Insights</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Mood Score', value: sentimentLoading ? '…' : `${avgSentimentScore}/100` },
                { label: 'Overall Mood', value: sentimentLoading ? '…' : overallMood },
                { label: 'Top Topic', value: sentimentLoading ? '…' : topTopic ? `${TOPIC_ICONS[topTopic] || ''} ${topTopic}` : 'N/A' },
                { label: 'Top Emotion', value: sentimentLoading ? '…' : topEmotion ? `${EMOTION_CONFIG[topEmotion]?.emoji || ''} ${topEmotion}` : 'N/A' },
                { label: 'Polls Analyzed', value: sentimentLoading ? '…' : analyzedCount },
                { label: 'Topics Found', value: sentimentLoading ? '…' : topicData.length },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/10 rounded-xl p-4 text-center">
                  <p className="text-indigo-200 text-xs mb-1">{label}</p>
                  <p className="text-white font-bold text-base leading-tight">{value}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default SentimentDashboard;
