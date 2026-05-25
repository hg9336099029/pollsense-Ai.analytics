import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/layout/dashboardLayout';
import { axiosInstance } from '../../utils/axiosInstance';
import { API_PATH } from '../../utils/apipath';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import {
  SENTIMENT_CONFIG, TOPIC_ICONS, EMOTION_CONFIG,
  SentimentBadge, TopicBadge, SentimentMiniBar, SentimentSkeleton,
} from '../../components/layout/SentimentBadge';

// ─── Sentiment Score SVG Gauge ────────────────────────────────────────────────
const SentimentGauge = ({ score, loading }) => {
  const r = 70;
  const cx = 100;
  const cy = 90;
  const circumference = Math.PI * r; // half circle
  const offset = circumference - (score / 100) * circumference;
  const color = score > 66 ? '#22c55e' : score > 33 ? '#f59e0b' : '#ef4444';
  const label = score > 66 ? '😊 Mostly Positive' : score > 33 ? '😐 Mixed Signals' : '😞 Mostly Negative';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <SentimentSkeleton className="w-36 h-36 rounded-full mb-3" />
        <SentimentSkeleton className="w-32 h-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#e5e7eb" strokeWidth="14" strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${offset}`}
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
        />
        {/* Score number */}
        <text x={cx} y={cy - 10} textAnchor="middle" fontSize="28" fontWeight="bold" fill="#111827">
          {score}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#6b7280">
          out of 100
        </text>
      </svg>
      <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">Powered by Groq AI</p>
    </div>
  );
};

// ─── Stacked Sentiment Bar ────────────────────────────────────────────────────
const SentimentStackedBar = ({ distribution, total, loading }) => {
  if (loading) return <SentimentSkeleton className="w-full h-4 mt-3" />;
  if (total === 0) return <div className="w-full h-4 bg-gray-100 rounded-full mt-3" />;
  return (
    <div className="w-full h-4 rounded-full overflow-hidden flex mt-3" title="Sentiment distribution">
      {distribution.map((d) => (
        <div
          key={d.name}
          style={{ width: `${(d.value / total) * 100}%`, backgroundColor: SENTIMENT_CONFIG[d.name]?.color || '#94a3b8' }}
          title={`${d.name}: ${d.value} polls`}
          className="transition-all duration-700"
        />
      ))}
    </div>
  );
};

// ─── Poll Highlight Card ──────────────────────────────────────────────────────
const HighlightCard = ({ poll, type }) => {
  if (!poll) return (
    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-5 flex items-center justify-center h-full">
      <p className="text-gray-400 text-sm text-center">Not enough data yet</p>
    </div>
  );
  const cfg = SENTIMENT_CONFIG[poll.sentiment?.label] || SENTIMENT_CONFIG.Neutral;
  const labels = { positive: ['🟢 Most Positive', 'border-green-400', 'bg-green-50'], negative: ['🔴 Most Negative', 'border-red-400', 'bg-red-50'], controversial: ['⚡ Most Controversial', 'border-orange-400', 'bg-orange-50'] };
  const [title, border, headerBg] = labels[type] || labels.positive;
  const totalVotes = poll.options?.reduce((s, o) => s + o.votes, 0) || 0;

  return (
    <div className={`bg-white rounded-xl border-2 ${border} overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
      <div className={`${headerBg} px-4 py-2 border-b ${border}`}>
        <span className="text-sm font-bold text-gray-700">{title}</span>
      </div>
      <div className="p-4">
        <div className="flex gap-2 mb-2 flex-wrap">
          <SentimentBadge label={poll.sentiment?.label} score={poll.sentiment?.score} />
          {poll.sentiment?.topic && <TopicBadge topic={poll.sentiment.topic} />}
        </div>
        <p className="font-semibold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">
          {poll.question}
        </p>
        {poll.sentiment?.summary && (
          <p className="text-xs italic text-gray-500 mb-3">💬 {poll.sentiment.summary}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>✔ {totalVotes} votes</span>
          {poll.sentiment?.emotion && (
            <span className={`px-2 py-0.5 rounded-full ${EMOTION_CONFIG[poll.sentiment.emotion]?.bg} ${EMOTION_CONFIG[poll.sentiment.emotion]?.text} font-medium`}>
              {EMOTION_CONFIG[poll.sentiment.emotion]?.emoji} {poll.sentiment.emotion}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState({ totalPolls: 0, totalVotes: 0, userPolls: 0, votedPolls: 0, bookmarkedPolls: 0 });
  const [recentPolls, setRecentPolls] = useState([]);
  const [trendingPolls, setTrendingPolls] = useState([]);
  const [pollTypeData, setPollTypeData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sentiment states
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState(false);
  const [avgSentimentScore, setAvgSentimentScore] = useState(0);
  const [sentimentDist, setSentimentDist] = useState([]);
  const [topicData, setTopicData] = useState([]);
  const [emotionData, setEmotionData] = useState([]);
  const [sentimentTrend, setSentimentTrend] = useState([]);
  const [topPolls, setTopPolls] = useState({ mostPositive: null, mostNegative: null, mostControversial: null });
  const [allPollsWithSentiment, setAllPollsWithSentiment] = useState([]);

  const sentimentRan = useRef(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const pollsResponse = await axiosInstance.get(API_PATH.AUTH.GET_POLLS);
        const allPolls = pollsResponse.data.polls || [];

        let userPolls = [], votedPolls = [], bookmarkedPolls = [];

        if (token) {
          try {
            const [upRes, vpRes, bpRes] = await Promise.all([
              axiosInstance.get(API_PATH.AUTH.GET_USERPOLLS),
              axiosInstance.get(API_PATH.AUTH.GET_VOTED_POLLS),
              axiosInstance.get(API_PATH.AUTH.GET_BOOOKMARK_POLLS),
            ]);
            userPolls = upRes.data.polls || [];
            votedPolls = vpRes.data.votedPolls || [];
            bookmarkedPolls = bpRes.data.bookmarkedPolls || [];
          } catch (_) { /* non-fatal */ }
        }

        const totalVotes = allPolls.reduce((s, p) => s + p.options.reduce((os, o) => os + o.votes, 0), 0);
        setStats({ totalPolls: allPolls.length, totalVotes, userPolls: userPolls.length, votedPolls: votedPolls.length, bookmarkedPolls: bookmarkedPolls.length });
        setRecentPolls(allPolls.slice(0, 5));

        const trending = [...allPolls].sort((a, b) => {
          const av = a.options.reduce((s, o) => s + o.votes, 0);
          const bv = b.options.reduce((s, o) => s + o.votes, 0);
          return bv - av;
        }).slice(0, 5);
        setTrendingPolls(trending);

        const typeCounts = {};
        allPolls.forEach(p => { typeCounts[p.pollType] = (typeCounts[p.pollType] || 0) + 1; });
        setPollTypeData(Object.entries(typeCounts).map(([type, count]) => ({ name: type.charAt(0).toUpperCase() + type.slice(1), value: count })));

        setLoading(false);

        // ── Phase 2: AI Sentiment ─────────────────────────────────────────────
        if (allPolls.length === 0 || sentimentRan.current) return;
        sentimentRan.current = true;
        setSentimentLoading(true);
        setSentimentError(false);

        try {
          const pollIds = allPolls.map(p => p._id);
          const sentRes = await axiosInstance.post(API_PATH.AUTH.ANALYZE_SENTIMENT, { pollIds });
          const results = sentRes.data.results || [];

          // Merge sentiment into polls map
          const sentimentMap = {};
          results.forEach(r => { sentimentMap[r._id] = r.sentiment; });

          const enriched = allPolls.map(p => ({ ...p, sentiment: sentimentMap[p._id] || p.sentiment }));
          setAllPollsWithSentiment(enriched);

          // Update recent polls with sentiment
          setRecentPolls(enriched.slice(0, 5));

          // Average score
          const scored = results.filter(r => r.sentiment?.score !== undefined);
          const avg = scored.length > 0 ? Math.round(scored.reduce((s, r) => s + r.sentiment.score, 0) / scored.length) : 50;
          setAvgSentimentScore(avg);

          // Sentiment distribution
          const distMap = { Positive: 0, Negative: 0, Neutral: 0, Controversial: 0, Engaging: 0 };
          results.forEach(r => { if (r.sentiment?.label) distMap[r.sentiment.label] = (distMap[r.sentiment.label] || 0) + 1; });
          setSentimentDist(Object.entries(distMap).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })));

          // Topic distribution
          const topicMap = {};
          results.forEach(r => { if (r.sentiment?.topic) topicMap[r.sentiment.topic] = (topicMap[r.sentiment.topic] || 0) + 1; });
          setTopicData(Object.entries(topicMap).map(([name, value]) => ({ name, value })));

          // Emotion distribution
          const emotionMap = {};
          results.forEach(r => { if (r.sentiment?.emotion) emotionMap[r.sentiment.emotion] = (emotionMap[r.sentiment.emotion] || 0) + 1; });
          setEmotionData(Object.entries(emotionMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value })));

          // Sentiment trend (group by week)
          const weekMap = {};
          results.forEach(r => {
            const poll = allPolls.find(p => p._id === r._id);
            if (!poll || !r.sentiment?.score) return;
            const d = new Date(poll.createdAt);
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay());
            const key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!weekMap[key]) weekMap[key] = { scores: [], date: weekStart };
            weekMap[key].scores.push(r.sentiment.score);
          });
          const trend = Object.entries(weekMap)
            .sort(([, a], [, b]) => a.date - b.date)
            .slice(-8)
            .map(([week, { scores }]) => ({ week, score: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) }));
          setSentimentTrend(trend);

          // Top polls
          const withScore = results.filter(r => r.sentiment?.score !== undefined);
          const most = (fn) => {
            const id = fn(withScore)?._id;
            return enriched.find(p => p._id === id) || null;
          };
          setTopPolls({
            mostPositive: most(arr => arr.reduce((best, r) => r.sentiment.score > (best?.sentiment.score || -1) ? r : best, null)),
            mostNegative: most(arr => arr.reduce((best, r) => r.sentiment.score < (best?.sentiment.score ?? 101) ? r : best, null)),
            mostControversial: most(arr => arr.filter(r => r.sentiment?.label === 'Controversial').reduce((best, r) => r.sentiment.score < (best?.sentiment.score ?? 101) ? r : best, null)),
          });

        } catch (err) {
          console.error('Sentiment analysis failed:', err);
          setSentimentError(true);
        } finally {
          setSentimentLoading(false);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const sentimentTotal = sentimentDist.reduce((s, d) => s + d.value, 0);
  const topTopic = topicData.sort((a, b) => b.value - a.value)[0]?.name;
  const topEmotion = emotionData[0]?.name;
  const overallMood = avgSentimentScore > 66 ? '😊 Positive' : avgSentimentScore > 33 ? '😐 Mixed' : '😞 Negative';

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-500 mt-2">Monitor your polling activity and AI-powered insights</p>
          </div>

          {/* ── Stats Grid ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Polls', value: stats.totalPolls, color: 'border-blue-500', bg: 'bg-blue-100', icon: '📊' },
              { label: 'Total Votes', value: stats.totalVotes, color: 'border-green-500', bg: 'bg-green-100', icon: '✅' },
              { label: 'My Polls', value: stats.userPolls, color: 'border-purple-500', bg: 'bg-purple-100', icon: '🗳️' },
              { label: 'Voted Polls', value: stats.votedPolls, color: 'border-orange-500', bg: 'bg-orange-100', icon: '☑️' },
              { label: 'Bookmarked', value: stats.bookmarkedPolls, color: 'border-red-500', bg: 'bg-red-100', icon: '🔖' },
            ].map(({ label, value, color, bg, icon }) => (
              <div key={label} className={`bg-white rounded-xl shadow p-5 border-l-4 ${color} hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                  </div>
                  <div className={`${bg} rounded-full p-3 text-lg`}>{icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Row 1: Poll Type Distribution + Sentiment Gauge ──────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Poll Type Donut */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Poll Type Distribution</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pollTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pollTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Sentiment Gauge */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">🤖 AI Sentiment Score</h2>
                {sentimentLoading && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full animate-pulse">Analyzing…</span>
                )}
                {sentimentError && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">⚠ AI unavailable</span>
                )}
              </div>
              <SentimentGauge score={avgSentimentScore} loading={sentimentLoading} />

              {/* Mini sentiment pills */}
              {!sentimentLoading && sentimentDist.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {sentimentDist.map(d => (
                    <span key={d.name} className={`text-xs px-2 py-1 rounded-full font-medium ${SENTIMENT_CONFIG[d.name]?.bg} ${SENTIMENT_CONFIG[d.name]?.text}`}>
                      {SENTIMENT_CONFIG[d.name]?.emoji} {d.name}: {d.value}
                    </span>
                  ))}
                </div>
              )}
              {sentimentLoading && (
                <div className="flex gap-2 mt-4 justify-center">
                  {[1, 2, 3].map(i => <SentimentSkeleton key={i} className="w-20 h-6 rounded-full" />)}
                </div>
              )}
            </div>
          </div>

          {/* ── Sentiment Breakdown Full Bar ──────────────────────────────── */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🤖 Sentiment Breakdown</h2>
            {sentimentLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map(i => <SentimentSkeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : sentimentDist.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No sentiment data yet. Analysis runs on first load.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.keys(SENTIMENT_CONFIG).map(label => {
                    const d = sentimentDist.find(x => x.name === label);
                    const count = d?.value || 0;
                    const cfg = SENTIMENT_CONFIG[label];
                    return (
                      <div key={label} className={`rounded-xl p-4 text-center border ${cfg.border} ${cfg.bg}`}>
                        <p className="text-2xl mb-1">{cfg.emoji}</p>
                        <p className={`text-xl font-bold ${cfg.text}`}>{count}</p>
                        <p className={`text-xs font-medium ${cfg.text}`}>{label}</p>
                        {sentimentTotal > 0 && <p className="text-xs text-gray-400 mt-1">{((count / sentimentTotal) * 100).toFixed(0)}%</p>}
                      </div>
                    );
                  })}
                </div>
                <SentimentStackedBar distribution={sentimentDist} total={sentimentTotal} loading={false} />
              </>
            )}
          </div>

          {/* ── Row 2: Sentiment Trend + Topic Distribution ───────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sentiment Trend */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Sentiment Trend (weekly)</h2>
              {sentimentLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <SentimentSkeleton key={i} className="h-8 w-full rounded" />)}
                </div>
              ) : sentimentTrend.length < 2 ? (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  📈 Not enough data yet — keep creating polls!
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={sentimentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v}/100`, 'Avg Sentiment']} />
                    <ReferenceLine y={66} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Positive', position: 'right', fontSize: 10, fill: '#22c55e' }} />
                    <ReferenceLine y={33} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Negative', position: 'right', fontSize: 10, fill: '#ef4444' }} />
                    <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Topic Distribution */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🗺️ Topic Distribution</h2>
              {sentimentLoading ? (
                <div className="flex items-center justify-center h-48">
                  <SentimentSkeleton className="w-40 h-40 rounded-full" />
                </div>
              ) : topicData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No topic data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={topicData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value"
                      label={({ name, value }) => `${TOPIC_ICONS[name] || '🔹'} ${name}: ${value}`} labelLine={false}>
                      {topicData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Emotion Pills ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">💬 Community Emotions</h2>
            {sentimentLoading ? (
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4, 5].map(i => <SentimentSkeleton key={i} className="h-8 rounded-full" style={{ width: `${60 + i * 20}px` }} />)}
              </div>
            ) : emotionData.length === 0 ? (
              <p className="text-gray-400 text-sm">No emotion data yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {emotionData.map(({ name, value }) => {
                  const cfg = EMOTION_CONFIG[name] || EMOTION_CONFIG.Neutral;
                  const size = value > 10 ? 'text-base px-4 py-2' : value > 5 ? 'text-sm px-3 py-1.5' : 'text-xs px-2 py-1';
                  return (
                    <span key={name} className={`${size} rounded-full font-semibold border ${cfg.bg} ${cfg.text} border-current border-opacity-30`}>
                      {cfg.emoji} {name} ({value})
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Top 3 AI Highlights ───────────────────────────────────────── */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🏆 AI Poll Highlights</h2>
            {sentimentLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <SentimentSkeleton key={i} className="h-40 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <HighlightCard poll={topPolls.mostPositive} type="positive" />
                <HighlightCard poll={topPolls.mostControversial} type="controversial" />
                <HighlightCard poll={topPolls.mostNegative} type="negative" />
              </div>
            )}
          </div>

          {/* ── Recent + Trending ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Polls */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Polls</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentPolls.length > 0 ? recentPolls.map(poll => (
                  <div key={poll._id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{poll.question}</h3>
                    {poll.sentiment?.summary && (
                      <p className="text-xs italic text-gray-400 mb-2 line-clamp-1">💬 {poll.sentiment.summary}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">By <span className="font-medium">@{poll.createdBy?.username}</span></span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{poll.pollType}</span>
                      {poll.sentiment?.label && <SentimentBadge label={poll.sentiment.label} score={poll.sentiment.score} showScore={false} />}
                      {poll.sentiment?.topic && <TopicBadge topic={poll.sentiment.topic} />}
                    </div>
                    {poll.sentiment?.score !== undefined && (
                      <div className="mt-2">
                        <SentimentMiniBar score={poll.sentiment.score} showLabel={false} />
                      </div>
                    )}
                    {sentimentLoading && !poll.sentiment && (
                      <SentimentSkeleton className="h-3 w-full rounded mt-2" />
                    )}
                  </div>
                )) : <p className="text-gray-400 text-sm text-center py-8">No polls yet</p>}
              </div>
            </div>

            {/* Trending Polls */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🔥 Trending Polls</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {trendingPolls.length > 0 ? trendingPolls.map((poll, index) => {
                  const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
                  return (
                    <div key={poll._id} className="border border-gray-100 rounded-xl p-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-xl font-bold text-orange-500 flex-shrink-0">#{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{poll.question}</h3>
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="text-xs text-gray-500">@{poll.createdBy?.username}</span>
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-bold">{totalVotes} votes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : <p className="text-gray-400 text-sm text-center py-8">No trending polls yet</p>}
              </div>
            </div>
          </div>

          {/* ── Quick Insights Banner ─────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">⚡ Quick Insights</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div>
                <p className="text-blue-200 text-xs mb-1">Engagement Rate</p>
                <p className="text-2xl font-bold">{stats.totalPolls > 0 ? ((stats.totalVotes / (stats.totalPolls * 10)) * 100).toFixed(1) : 0}%</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs mb-1">Avg Votes / Poll</p>
                <p className="text-2xl font-bold">{stats.totalPolls > 0 ? (stats.totalVotes / stats.totalPolls).toFixed(1) : 0}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs mb-1">Participation Rate</p>
                <p className="text-2xl font-bold">{stats.totalPolls > 0 ? ((stats.votedPolls / stats.totalPolls) * 100).toFixed(1) : 0}%</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs mb-1">🤖 Overall Mood</p>
                <p className="text-lg font-bold">{sentimentLoading ? '...' : sentimentError ? 'N/A' : overallMood}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs mb-1">🤖 Top Topic</p>
                <p className="text-lg font-bold">{sentimentLoading ? '...' : topTopic ? `${TOPIC_ICONS[topTopic] || ''} ${topTopic}` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs mb-1">🤖 Community Emotion</p>
                <p className="text-lg font-bold">{sentimentLoading ? '...' : topEmotion ? `${EMOTION_CONFIG[topEmotion]?.emoji || ''} ${topEmotion}` : 'N/A'}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;