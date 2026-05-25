import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/dashboardLayout';
import { axiosInstance } from '../../utils/axiosInstance';
import { API_PATH } from '../../utils/apipath';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPolls: 0, totalVotes: 0, userPolls: 0, votedPolls: 0, bookmarkedPolls: 0,
  });
  const [recentPolls, setRecentPolls] = useState([]);
  const [trendingPolls, setTrendingPolls] = useState([]);
  const [pollTypeData, setPollTypeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const pollsRes = await axiosInstance.get(API_PATH.AUTH.GET_POLLS);
        const allPolls = pollsRes.data.polls || [];

        let userPolls = [], votedPolls = [], bookmarkedPolls = [];
        const token = localStorage.getItem('accessToken');
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
          } catch (_) {}
        }

        const totalVotes = allPolls.reduce((s, p) => s + p.options.reduce((os, o) => os + o.votes, 0), 0);
        setStats({ totalPolls: allPolls.length, totalVotes, userPolls: userPolls.length, votedPolls: votedPolls.length, bookmarkedPolls: bookmarkedPolls.length });
        setRecentPolls(allPolls.slice(0, 6));

        const trending = [...allPolls].sort((a, b) => {
          const av = a.options.reduce((s, o) => s + o.votes, 0);
          const bv = b.options.reduce((s, o) => s + o.votes, 0);
          return bv - av;
        }).slice(0, 6);
        setTrendingPolls(trending);

        const typeCounts = {};
        allPolls.forEach(p => { typeCounts[p.pollType] = (typeCounts[p.pollType] || 0) + 1; });
        setPollTypeData(Object.entries(typeCounts).map(([type, count]) => ({
          name: type.charAt(0).toUpperCase() + type.slice(1), value: count,
        })));
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const engagementRate = stats.totalPolls > 0 ? ((stats.totalVotes / (stats.totalPolls * 10)) * 100).toFixed(1) : 0;
  const avgVotes = stats.totalPolls > 0 ? (stats.totalVotes / stats.totalPolls).toFixed(1) : 0;
  const participationRate = stats.totalPolls > 0 ? ((stats.votedPolls / stats.totalPolls) * 100).toFixed(1) : 0;

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Poll Dashboard</h1>
            <p className="text-gray-500 mt-1">Overview of your polling activity and community engagement</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Polls',  value: stats.totalPolls,       color: 'border-blue-500',   bg: 'bg-blue-50',   svgPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', text: 'text-blue-600' },
              { label: 'Total Votes',  value: stats.totalVotes,       color: 'border-emerald-500', bg: 'bg-emerald-50', svgPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',                                                                                                                                                                                                                                   text: 'text-emerald-600' },
              { label: 'My Polls',     value: stats.userPolls,        color: 'border-violet-500',  bg: 'bg-violet-50',  svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',                                                                                                                                                    text: 'text-violet-600' },
              { label: 'Voted',        value: stats.votedPolls,       color: 'border-amber-500',   bg: 'bg-amber-50',   svgPath: 'M5 13l4 4L19 7',                                                                                                                                                                                                                                                                         text: 'text-amber-600' },
              { label: 'Bookmarked',   value: stats.bookmarkedPolls,  color: 'border-rose-500',    bg: 'bg-rose-50',    svgPath: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',                                                                                                                                                                                                                                      text: 'text-rose-600' },
            ].map(({ label, value, color, bg, svgPath, text }) => (
              <div key={label} className={`bg-white rounded-2xl shadow-sm p-5 border-l-4 ${color} hover:shadow-md transition-all`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{label}</p>
                    <p className={`text-3xl font-black mt-1 ${text}`}>{value}</p>
                  </div>
                  <div className={`${bg} rounded-xl p-2.5`}>
                    <svg className={`w-5 h-5 ${text}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={svgPath} />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Poll Type Donut */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Poll Type Distribution</h2>
              {pollTypeData.length === 0 ? (
                <div className="flex items-center justify-center h-52 text-gray-400">No poll data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pollTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}>
                      {pollTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Quick Insights */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-sm p-6 text-white">
              <h2 className="text-lg font-bold mb-6">Quick Insights</h2>
              <div className="grid grid-cols-1 gap-5">
                {[
                  { label: 'Engagement Rate',    value: `${engagementRate}%`, sub: 'votes vs expected capacity',  svgPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                  { label: 'Avg Votes / Poll',   value: avgVotes,              sub: 'community participation',     svgPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { label: 'Participation Rate', value: `${participationRate}%`, sub: 'polls where you voted',    svgPath: 'M5 13l4 4L19 7' },
                ].map(({ label, value, sub, svgPath }) => (
                  <div key={label} className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
                    <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={svgPath} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-100 text-xs mb-0.5">{label}</p>
                      <p className="text-2xl font-black">{value}</p>
                      <p className="text-blue-200 text-xs mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent + Trending */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Polls */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Polls</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {recentPolls.length > 0 ? recentPolls.map(poll => {
                  const votes = poll.options.reduce((s, o) => s + o.votes, 0);
                  return (
                    <div key={poll._id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {poll.createdBy?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-2">{poll.question}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-400">@{poll.createdBy?.username}</span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{poll.pollType}</span>
                          <span className="text-xs text-gray-400">{votes} votes</span>
                        </div>
                      </div>
                    </div>
                  );
                }) : <p className="text-gray-400 text-sm text-center py-8">No polls yet</p>}
              </div>
            </div>

            {/* Trending */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Trending Polls</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {trendingPolls.length > 0 ? trendingPolls.map((poll, idx) => {
                  const votes = poll.options.reduce((s, o) => s + o.votes, 0);
                  const maxVotes = Math.max(...trendingPolls.map(p => p.options.reduce((s, o) => s + o.votes, 0)));
                  const pct = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
                  return (
                    <div key={poll._id} className="p-3 rounded-xl border border-gray-100 hover:bg-orange-50 transition-colors">
                      <div className="flex items-start gap-3 mb-2">
                        <span className={`text-lg font-black flex-shrink-0 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-gray-300'}`}>
                          #{idx + 1}
                        </span>
                        <p className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">{poll.question}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-orange-600 whitespace-nowrap">{votes} votes</span>
                      </div>
                    </div>
                  );
                }) : <p className="text-gray-400 text-sm text-center py-8">No trending polls yet</p>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;