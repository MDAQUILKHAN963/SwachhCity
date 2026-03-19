import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { complaintAPI, analyticsAPI } from '../lib/api.js';
import { onNewComplaint, onComplaintStatusUpdate } from '../lib/socket.js';
import Leaderboard from '../components/Leaderboard';
import { getImageUrl } from '../utils/image.js';

function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
  });
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    rank: 'Citizen'
  });
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchComplaints();
    fetchLeaderboard();
    fetchUserStats();

    // Set up real-time listsners
    const handleNewComplaint = (data) => {
      console.log('New complaint received:', data);
      fetchComplaints(); // Refresh list
    };

    const handleStatusUpdate = (data) => {
      console.log('Status updated:', data);
      setComplaints((prev) =>
        prev.map((c) =>
          c._id === data.complaintId
            ? { ...c, status: data.status }
            : c
        )
      );
    };

    onNewComplaint(handleNewComplaint);
    onComplaintStatusUpdate(handleStatusUpdate);

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await analyticsAPI.getLeaderboard();
      if (response.data.success) {
        setLeaderboard(response.data.data.citizens);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await analyticsAPI.getUserStats();
      if (response.data.success) {
        setUserStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintAPI.getAll();
      setComplaints(response.data.data.complaints);

      // Calculate stats
      const total = response.data.data.complaints.length;
      const pending = response.data.data.complaints.filter(
        (c) => c.status === 'pending' || c.status === 'verified' || c.status === 'assigned'
      ).length;
      const resolved = response.data.data.complaints.filter(
        (c) => c.status === 'resolved'
      ).length;

      setStats({ total, pending, resolved });
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      'in-progress': 'bg-indigo-100 text-indigo-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-brand-50/50 pb-12">
      {/* Navbar */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-xl text-white shadow-lg shadow-brand-600/20">♻️</div>
              <span className="font-black text-xl tracking-tighter text-gray-900 italic">Swachh<span className="text-brand-600">City</span></span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Citizen Member</p>
                <p className="text-sm font-black text-gray-900">{user?.name}</p>
              </div>
              <button
                onClick={logout}
                className="group flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-red-100 transition-all active:scale-95 border border-red-100/50"
              >
                <span className="text-base group-hover:rotate-12 transition-transform">🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero / Action Section */}
      <div className="relative overflow-hidden bg-brand-900 pt-16 pb-32">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-white z-10">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-200">
              City Dashboard
            </h1>
            <p className="text-brand-100 text-lg font-light max-w-md">
              Track your impact. Every report creates a cleaner environment for everyone.
            </p>
          </div>
          <button
            onClick={() => navigate('/submit-complaint')}
            className="group px-6 py-3.5 bg-white text-brand-900 font-bold rounded-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] hover:shadow-lg hover:shadow-brand-500/50 hover:bg-brand-50 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 z-10"
          >
            <span className="text-xl group-hover:rotate-12 transition-transform duration-300">📸</span>
            <span>Report Garbage</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-[2rem] shadow-premium border border-white p-6 hover:translate-y-[-4px] transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Impact</p>
                <p className="text-4xl font-black text-gray-800 tracking-tight group-hover:text-brand-600 transition-colors">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-brand-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:rotate-12 transition-transform">📄</div>
            </div>
            <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-brand-500 h-full w-2/3 opacity-30"></div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-premium border border-white p-6 hover:translate-y-[-4px] transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Pending Verification</p>
                <p className="text-4xl font-black text-gray-800 tracking-tight group-hover:text-amber-500 transition-colors">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:animate-spin transition-all [animation-duration:3s]">⏳</div>
            </div>
            <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-1/3 opacity-30"></div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-premium border border-white p-6 hover:translate-y-[-4px] transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">City Improvement</p>
                <p className="text-4xl font-black text-gray-800 tracking-tight group-hover:text-emerald-500 transition-colors">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">✅</div>
            </div>
            <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-full opacity-30"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Complaints List (Left 2/3) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between px-2">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-none mb-1">My Activity List</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tracking your reported hotspots</p>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-xs shadow-sm cursor-pointer hover:bg-gray-50">🔍</div>
                <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-xs shadow-sm cursor-pointer hover:bg-gray-50">🔃</div>
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-premium">
                <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-6"></div>
                <p className="text-gray-500 font-bold tracking-tight">Accessing city database...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="p-20 text-center bg-white/70 backdrop-blur-xl rounded-[2.5rem] border-2 border-dashed border-gray-100 shadow-premium group">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-500">🏙️</div>
                <p className="text-gray-400 font-black text-xl mb-6">No reports found in your area.</p>
                <button
                  onClick={() => navigate('/submit-complaint')}
                  className="px-8 py-4 grad-brand text-white font-black rounded-2xl shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-1 transition-all"
                >
                  Start Impact Journey
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {complaints.map(complaint => (
                  <div
                    key={complaint._id}
                    onClick={() => navigate(`/complaint/${complaint._id}`)}
                    className="group bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-2xl hover:border-brand-100 transition-all duration-500 cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Image Thumbnail */}
                      <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-gray-50 rounded-[1.5rem] overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform duration-500">
                        {complaint.imageUrl ? (
                          <img src={getImageUrl(complaint.imageUrl)} alt="Evidence" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-200">
                            <span className="text-2xl">📷</span>
                            <span className="text-[10px] font-bold uppercase mt-1 tracking-widest">No Evidence</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${complaint.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                complaint.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                  'bg-brand-50 text-brand-600 border-brand-100'
                                }`}>
                                {complaint.status}
                              </span>
                              <span className="text-[10px] font-black text-gray-300 tracking-widest uppercase italic">#{complaint._id.slice(-6)}</span>
                            </div>
                            <h3 className="text-xl font-black text-gray-800 group-hover:text-brand-600 transition-colors leading-tight mb-1">{complaint.address || "Unknown Location"}</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Filed Date</p>
                            <p className="text-xs font-bold text-gray-500">{new Date(complaint.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <p className="text-gray-500 font-medium text-sm line-clamp-2 leading-relaxed mb-4">{complaint.description}</p>
                        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-50">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest mb-0.5">ML Severity</span>
                            <span className="text-xs font-black text-brand-600 tracking-tighter">LEVEL {Math.round(complaint.severity || 0)} / 10</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest mb-0.5">Assignment Priority</span>
                            <span className="text-xs font-black text-gray-700 tracking-tighter">{String(complaint.priority || 0).substring(0, 4)} INDEX</span>
                          </div>
                          <button className="ml-auto p-2 hover:bg-brand-50 rounded-xl transition-colors text-brand-600">
                            <span className="text-lg">➡️</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar (Right 1/3) */}
          <div className="space-y-10">
            {/* User Profile Card */}
            <div className="bg-white rounded-[2.5rem] shadow-premium border border-white p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>

              <div className="relative flex flex-col items-center text-center mb-8">
                <div className="w-24 h-24 grad-brand rounded-[2rem] flex items-center justify-center text-4xl text-white shadow-2xl shadow-brand-500/40 mb-4 border-4 border-white transform hover:rotate-6 transition-transform">
                  {user?.name?.charAt(0)?.toUpperCase() || '👤'}
                </div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-1">{user?.name}</h2>
                <span className="px-4 py-1 rounded-xl text-[10px] font-black bg-brand-50 text-brand-600 uppercase tracking-widest border border-brand-100">
                  {user?.role || 'Citizen'}
                </span>
              </div>

              <div className="space-y-5 relative">
                {[
                  { label: 'Email Address', value: user?.email, icon: '📧' },
                  { label: 'Phone Number', value: user?.phone || 'Contact pending', icon: '📱' },
                  { label: 'Home Area', value: user?.address || 'City Center', icon: '📍' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-lg border border-gray-100 group-hover/item:grad-brand group-hover/item:text-white transition-all duration-300">{item.icon}</div>
                    <div>
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                      <p className="text-xs font-black text-gray-700 group-hover/item:text-brand-600 transition-colors truncate max-w-[160px]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-premium border border-white p-8">
              <Leaderboard title="🏆 City Guardians" data={leaderboard} type="citizen" />
            </div>

            <div className="bg-brand-900 rounded-[2.5rem] shadow-2xl p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
              <div className="relative z-10 text-center">
                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">🌱</div>
                <h3 className="font-black text-xl mb-3 tracking-tight">{userStats.rank || 'Eco-Warrior'} Progress</h3>
                <p className="text-brand-100 text-sm font-medium leading-relaxed opacity-80 mb-6 px-2">
                  You have earned <span className="text-white font-black">{userStats.totalPoints || 0} Impact Points</span>. Top performing citizens receive local tax benefits and digital badges.
                </p>
                <div className="w-full bg-white/10 h-2 rounded-full mb-2">
                  <div
                    className="bg-brand-400 h-full rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000"
                    style={{ width: `${Math.min(100, (userStats.totalPoints / 100) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] font-black text-brand-300 uppercase tracking-widest mb-4">
                  {userStats.totalPoints >= 100 ? 'Level Max Reached 🏆' : `Next Reward at 100 Points`}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-brand-300 uppercase tracking-widest mb-1 opacity-60">Waste Collected</p>
                    <p className="text-lg font-black text-white">{userStats.totalKg || 0}kg</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-brand-300 uppercase tracking-widest mb-1 opacity-60">CO2 Offset</p>
                    <p className="text-lg font-black text-white">{userStats.totalCo2 || 0}kg</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
