import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { analyticsAPI, workerAPI, complaintAPI } from '../../lib/api';
import MapView from '../../components/maps/MapView';
import Leaderboard from '../../components/Leaderboard';
import { onNewComplaint, onComplaintStatusUpdate } from '../../lib/socket.js';

export default function AdminDashboard() {
    const { user, logout } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [mapData, setMapData] = useState([]);
    const [hotspots, setHotspots] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [leaderboards, setLeaderboards] = useState({ citizens: [], workers: [] });
    const [loading, setLoading] = useState(true);

    // Manual Assignment State
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [availableWorkers, setAvailableWorkers] = useState([]);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        fetchAvailableWorkers();

        // Real-time listeners
        const handleNewComplaint = (data) => {
            console.log('Admin: New complaint received', data);
            fetchDashboardData(); // Refresh all stats and map
        };

        const handleStatusUpdate = (data) => {
            console.log('Admin: Status updated', data);
            fetchDashboardData(); // Refresh to reflect new counts
        };

        onNewComplaint(handleNewComplaint);
        onComplaintStatusUpdate(handleStatusUpdate);

        return () => {
            // Socket cleanup is handled in the socket lib
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, mapRes, hotspotsRes, leaderboardRes, predictionsRes] = await Promise.all([
                analyticsAPI.getDashboard(),
                analyticsAPI.getMapData(),
                analyticsAPI.getHotspots(),
                analyticsAPI.getLeaderboard(),
                analyticsAPI.getPredictions()
            ]);

            if (statsRes.data.success) setStats(statsRes.data.data);
            if (mapRes.data.success) setMapData(mapRes.data.data);
            if (hotspotsRes.data.success) setHotspots(hotspotsRes.data.data);
            if (leaderboardRes.data.success) setLeaderboards(leaderboardRes.data.data);
            if (predictionsRes.data.success) setPredictions(predictionsRes.data.data);

        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableWorkers = async () => {
        try {
            const res = await workerAPI.getAvailable();
            if (res.data.success) {
                setAvailableWorkers(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch available workers", error);
        }
    };

    const handleAssign = async (workerId) => {
        if (!selectedComplaint) return;
        try {
            setAssigning(true);
            const res = await complaintAPI.assign(selectedComplaint._id, workerId);
            if (res.data.success) {
                // Success feedback
                setSelectedComplaint(null);
                fetchDashboardData();
                fetchAvailableWorkers(); // Refresh available list
                alert("Worker assigned successfully!");
            }
        } catch (error) {
            console.error("Assignment failed", error);
            alert(error.response?.data?.message || "Assignment failed");
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full mb-4"></div>
                <div className="ml-4 text-xl font-bold text-gray-400 uppercase tracking-widest italic">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-50/30 pb-12">
            {/* Navbar */}
            <nav className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-900 rounded-xl flex items-center justify-center text-xl text-white shadow-lg shadow-brand-900/20">🛡️</div>
                            <span className="font-black text-xl tracking-tighter text-gray-900 italic">Swachh<span className="text-brand-600">City</span></span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="hidden sm:flex flex-col text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Administrator</p>
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

            {/* Header / Hero Section */}
            <div className="relative overflow-hidden bg-brand-900 pt-16 pb-32">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-900/50 to-brand-900 pointer-events-none"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-white/10">🏛️</div>
                                <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-200">
                                    Admin Dashboard
                                </h1>
                            </div>
                            <p className="text-brand-100 text-lg font-light max-w-xl opacity-80">
                                Monitor city cleanliness and manage garbage workers.
                            </p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="glass px-6 py-3 rounded-2xl border-white/10 flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-brand-200 uppercase tracking-widest">System Status</p>
                                    <p className="text-sm font-bold text-white uppercase">Running</p>
                                </div>
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-premium border border-white hover:translate-y-[-4px] transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">📊</div>
                                <span className="text-[10px] font-black tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">+12.5%</span>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Reports</p>
                            <p className="text-4xl font-black text-gray-800 tracking-tight group-hover:text-brand-600 transition-colors">{stats.complaints.total}</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-premium border border-white hover:translate-y-[-4px] transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">⏳</div>
                                <span className="text-[10px] font-black tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">Pending</span>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Pending Reports</p>
                            <p className="text-4xl font-black text-gray-800 tracking-tight group-hover:text-amber-500 transition-colors">{stats.complaints.pending}</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-premium border border-white hover:translate-y-[-4px] transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">⚡</div>
                                <span className="text-[10px] font-black tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">Optimized</span>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Success Rate</p>
                            <p className="text-4xl font-black text-gray-800 tracking-tight group-hover:text-emerald-500 transition-colors">{stats.complaints.resolutionRate}%</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-premium border border-white hover:translate-y-[-4px] transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">👷</div>
                                <span className="text-[10px] font-black tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">On Field</span>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Active Workforce</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-4xl font-black text-gray-800 tracking-tight group-hover:text-indigo-500 transition-colors">{stats.workers.active}</p>
                                <span className="text-sm font-bold text-gray-300">/ {stats.workers.total}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Map Section */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-premium overflow-hidden mb-10 border border-white relative">
                    <div className="p-8 bg-gray-50/30 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-white text-brand-600 rounded-3xl text-2xl shadow-sm border border-gray-100">🗺️</div>
                            <div>
                                <h2 className="font-black text-2xl text-gray-800 tracking-tight leading-tight italic">City Garbage Map</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Interactive Map</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest bg-white/50 px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
                            <span className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></span> Critical
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> Pending
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span> Resolved
                            </span>
                            <span className="h-4 w-[1px] bg-gray-200 mx-2"></span>
                            <span className="flex items-center gap-2 text-brand-600">
                                <div className="w-3 h-3 border-2 border-brand-500 border-dashed rounded-full animate-spin [animation-duration:5s]"></div> AI Hotspot
                            </span>
                        </div>
                    </div>
                    <div className="h-[650px] w-full relative">
                        <MapView
                            center={[23.2599, 77.4126]} // Default to Bhopal for better view in demo
                            zoom={12}
                            complaints={mapData}
                            hotspots={hotspots}
                            predictions={predictions}
                            showHeatmap={true}
                            height="100%"
                            onMarkerClick={(complaint) => {
                                if (complaint.status !== 'resolved') {
                                    setSelectedComplaint(complaint);
                                }
                            }}
                        />
                    </div>

                    {/* Manual Assignment Sidebar/Modal overlay */}
                    {selectedComplaint && (
                        <div className="absolute top-24 right-8 w-96 bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white z-[1000] p-8 animate-in slide-in-from-right duration-300">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-black text-xl text-gray-800 tracking-tight italic">Manual Assign</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Complaint #{selectedComplaint._id.slice(-6)}</p>
                                </div>
                                <button onClick={() => setSelectedComplaint(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">✕</button>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
                                <p className="text-xs font-bold text-gray-900 mb-1 leading-tight">{selectedComplaint.address}</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">SEVERITY: {selectedComplaint.severity}/10</span>
                                    <span className="text-[9px] font-black text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-100">{selectedComplaint.status.toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Available Workforce ({availableWorkers.length})</p>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {availableWorkers.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-xs font-bold text-gray-400 italic">No available workers found</p>
                                        </div>
                                    ) : (
                                        availableWorkers.map(worker => (
                                            <div key={worker._id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-brand-300 hover:shadow-lg transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">👷</div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-800 leading-none mb-1">{worker.userId?.name || 'Worker'}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">ID: {worker.employeeId}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    disabled={assigning}
                                                    onClick={() => handleAssign(worker._id)}
                                                    className="px-4 py-2 bg-brand-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-all active:scale-95"
                                                >
                                                    {assigning ? '...' : 'Assign'}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <p className="text-[9px] text-gray-400 font-medium italic opacity-60">Selected worker will be dispatched immediately.</p>
                        </div>
                    )}
                </div>

                {/* Alerts & Insights Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* Alerts Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-premium p-10 border border-white">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center text-3xl shadow-inner animate-pulse">⚠️</div>
                                <div>
                                    <h3 className="font-black text-2xl text-gray-800 tracking-tight">Urgent Reports</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Recent Reports Feed</p>
                                </div>
                            </div>
                            <span className="bg-red-50/50 text-red-600 text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest border border-red-100 animate-bounce">Live</span>
                        </div>

                        <div className="space-y-5">
                            {mapData.filter(c => c.severity >= 8 && c.status !== 'resolved').slice(0, 4).map(alert => (
                                <div key={alert._id} onClick={() => setSelectedComplaint(alert)} className="group flex items-start gap-6 p-6 bg-gray-50/30 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-2xl hover:border-red-100 transition-all duration-500 cursor-pointer">
                                    <div className="bg-white group-hover:bg-red-50 p-4 rounded-2xl shadow-sm text-2xl transition-all group-hover:rotate-12">🚨</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-black text-gray-900 text-sm tracking-tight group-hover:text-red-600 transition-colors line-clamp-1 italic">{alert.address}</p>
                                            <span className="text-[9px] font-black text-red-600 bg-red-50/80 px-3 py-1 rounded-lg border border-red-100">URGENT</span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 mb-4 truncate italic">"{alert.description || 'No specific metadata'}"</p>
                                        <div className="flex items-center gap-5 uppercase font-black text-[9px] tracking-widest text-gray-400">
                                            <span className="flex items-center gap-2 text-red-500">
                                                <span className="text-sm">⚡</span> Severity: {alert.severity}/10
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <span className="text-sm">🗓️</span> {new Date(alert.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {mapData.filter(c => c.severity >= 8 && c.status !== 'resolved').length === 0 && (
                                <div className="text-center py-20 bg-emerald-50/20 rounded-[2rem] border-2 border-dashed border-emerald-100 group">
                                    <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-500">🌍</div>
                                    <p className="text-emerald-800 font-black text-xl mb-1 italic">City Harmonic</p>
                                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest opacity-60">No high-severity escalations active</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Infrastructure Health Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-premium p-10 border border-white">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-3xl shadow-inner">🦾</div>
                            <div>
                                <h3 className="font-black text-2xl text-gray-800 tracking-tight">System Status</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Application Health</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {[
                                { name: 'ML Detection Core', status: 'Optimal', icon: '🧠', trend: '+0.1s latency' },
                                { name: 'Geospatial Engine', status: 'Stable', icon: '🌍', trend: '99.9% uptime' },
                                { name: 'Workforce Hub', status: 'Active', icon: '📡', trend: 'Sync: Active' }
                            ].map((service, idx) => (
                                <div key={idx} className="flex justify-between items-center p-6 bg-gray-50/30 rounded-3xl border border-gray-100 group hover:bg-white hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-gray-50 group-hover:scale-105 transition-transform">{service.icon}</div>
                                        <div>
                                            <p className="text-sm font-black text-gray-800 tracking-tight">{service.name}</p>
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{service.trend}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">{service.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-8 bg-brand-900 rounded-[2rem] text-white overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-400 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
                            <div className="relative z-10 flex items-start gap-5">
                                <div className="text-4xl group-hover:rotate-[20deg] transition-transform">⚡</div>
                                <div>
                                    <h4 className="font-black text-xs uppercase tracking-[0.3em] text-brand-300 mb-2">AI Recommendation</h4>
                                    <p className="text-sm text-brand-50 font-medium leading-relaxed opacity-80 italic">
                                        Detected high-density waste clusters in Sector 7. Recommend preemptive squad deployment to maintain the 98% satisfaction baseline.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leaderboards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <Leaderboard title="🏆 Top Workers" data={leaderboards.workers} type="worker" />
                    <Leaderboard title="🌟 Top Citizens" data={leaderboards.citizens} type="citizen" />
                </div>
            </div>
        </div>
    );
}
