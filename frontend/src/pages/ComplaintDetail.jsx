import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintAPI } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { getImageUrl } from '../utils/image.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ComplaintDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchComplaint = async () => {
            try {
                setLoading(true);
                const response = await complaintAPI.getById(id);
                if (response.data.success) {
                    setComplaint(response.data.data.complaint);
                }
            } catch (err) {
                setError('Failed to load report details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchComplaint();
    }, [id]);

    const getStatusSteps = (currentStatus) => {
        const steps = [
            { id: 'pending', label: 'Reported', icon: '📸', desc: 'Initial report filed' },
            { id: 'verified', label: 'Verified', icon: '✅', desc: 'Checking details' },
            { id: 'assigned', label: 'Assigned', icon: '👤', desc: 'Worker sent' },
            { id: 'in-progress', label: 'Cleaning', icon: '🧹', desc: 'Cleaning up' },
            { id: 'resolved', label: 'Resolved', icon: '🌟', desc: 'Spot Cleaned' }
        ];

        const statusIndex = steps.findIndex(s => s.id === currentStatus);

        return steps.map((step, index) => ({
            ...step,
            isCompleted: index < statusIndex || (currentStatus === 'resolved' && index === steps.length - 1),
            isCurrent: index === statusIndex && currentStatus !== 'resolved',
            isPending: index > statusIndex && currentStatus !== 'resolved'
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-50/50 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error || !complaint) {
        return (
            <div className="min-h-screen bg-brand-50/50 flex flex-col items-center justify-center p-4">
                <div className="text-6xl mb-6">🚫</div>
                <h2 className="text-2xl font-black text-gray-800 mb-2">Report Not Found</h2>
                <p className="text-gray-500 mb-8">{error || 'This report may have been archived.'}</p>
                <button onClick={() => navigate('/dashboard')} className="px-8 py-3 grad-brand text-white font-black rounded-xl">Return to Dashboard</button>
            </div>
        );
    }

    const timelineSteps = getStatusSteps(complaint.status);

    return (
        <div className="min-h-screen bg-brand-50/50 pb-20">
            {/* Navbar - Reuse common style */}
            <nav className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-xl text-white shadow-lg shadow-brand-600/20">♻️</div>
                            <span className="font-black text-xl tracking-tighter text-gray-900 italic">Swachh<span className="text-brand-600">City</span></span>
                        </div>
                        <div className="flex items-center gap-6">
                            <button onClick={logout} className="px-5 py-2.5 bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-red-100 transition-all active:scale-95 border border-red-100/50">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 pt-10">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-gray-400 hover:text-brand-600 font-black text-[10px] uppercase tracking-widest transition-colors mb-8"
                >
                    <span>⬅️</span> Back to Dashboard
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Analysis Header */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-premium border border-white p-8 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>

                            <div className="relative">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border mb-3 inline-block ${complaint.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-brand-50 text-brand-600 border-brand-100'
                                            }`}>
                                            {complaint.status}
                                        </span>
                                        <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">{complaint.address || 'Location Details'}</h1>
                                        <div className="flex items-center gap-4 mt-1 italic">
                                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest leading-none">Report ID: #{complaint._id}</p>
                                            <button
                                                onClick={() => {
                                                    const text = `I just helped clean ${complaint.address || 'my city'}! Track my impact on SwachhCity ♻️ #CleanCity #SmartFuture`;
                                                    navigator.clipboard.writeText(text);
                                                    alert('Impact message copied to clipboard!');
                                                }}
                                                className="px-3 py-1 bg-brand-50 text-brand-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-brand-100 transition-colors flex items-center gap-1"
                                            >
                                                <span>🔗</span> Share Impact
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                                    <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Severity</p>
                                        <p className="text-xl font-black text-brand-600 tracking-tighter">{Math.round(complaint.severity)}/10</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Waste Type</p>
                                        <p className="text-xl font-black text-gray-800 tracking-tighter capitalize">{complaint.garbageType || 'Mix'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Priority</p>
                                        <p className="text-xl font-black text-amber-600 tracking-tighter italic">High</p>
                                    </div>
                                    <div className="p-4 bg-brand-50 rounded-3xl border border-brand-100">
                                        <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest leading-none mb-1">Target Cleanup</p>
                                        <p className="text-xl font-black text-brand-900 tracking-tighter italic">{complaint.estimatedCleanupTime || 24} Hrs</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual Progress Timeline */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-premium border border-white p-8">
                            <h3 className="text-xl font-black text-gray-800 tracking-tight mb-10 flex items-center gap-3">
                                <span className="p-2 bg-brand-50 rounded-xl">🗺️</span>
                                Cleanup Progress
                            </h3>

                            <div className="relative">
                                {/* Connector Line */}
                                <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-gray-100 -z-0"></div>

                                <div className="space-y-12 relative z-10">
                                    {timelineSteps.map((step, idx) => (
                                        <div key={idx} className={`flex items-start gap-6 transition-all duration-500 ${step.isPending ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-lg border-4 border-white transition-all transform ${step.isCompleted ? 'bg-emerald-500 text-white' :
                                                step.isCurrent ? 'bg-brand-600 text-white scale-110 rotate-3 ring-4 ring-brand-100' :
                                                    'bg-gray-100 text-gray-400'
                                                }`}>
                                                {step.isCompleted ? '✓' : step.icon}
                                            </div>

                                            <div className="flex-1 pt-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className={`font-black text-lg tracking-tight ${step.isCurrent ? 'text-brand-600' : 'text-gray-800'}`}>
                                                        {step.label}
                                                    </h4>
                                                    {step.isCurrent && (
                                                        <span className="animate-pulse bg-brand-100 text-brand-600 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                            In Progress
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-400 text-sm font-medium mt-1">{step.desc}</p>

                                                {step.isCompleted && complaint.statusHistory?.find(h => h.status === step.id) && (
                                                    <div className="mt-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 inline-block px-3 py-1 rounded-lg">
                                                        Completed {new Date(complaint.statusHistory.find(h => h.status === step.id).changedAt).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Visual Evidence Card */}
                        <div className="bg-white rounded-[2.5rem] shadow-premium border border-white overflow-hidden group">
                            <div className="p-6">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-4">Evidence Snapshot</p>
                                <div className="rounded-3xl overflow-hidden aspect-square relative">
                                    <img
                                        src={getImageUrl(complaint.imageUrl)}
                                        alt="Original Case"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-bottom p-6 flex-col justify-end">
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Before Cleanup</span>
                                        <span className="text-white font-black text-sm">{new Date(complaint.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resolved Snapshot (If resolved) */}
                        {complaint.status === 'resolved' && (
                            <div className="bg-emerald-900 rounded-[2.5rem] shadow-2xl overflow-hidden group">
                                <div className="p-6">
                                    <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest leading-none mb-4 italic">Cleanup Success</p>
                                    <div className="rounded-3xl overflow-hidden aspect-square relative bg-emerald-800/50 flex items-center justify-center">
                                        {complaint.afterCleanupImage ? (
                                            <img src={getImageUrl(complaint.afterCleanupImage)} alt="Resolved" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-6">
                                                <span className="text-4xl mb-4 block">✨</span>
                                                <p className="text-white/60 text-xs font-black uppercase tracking-widest">Awaiting Verification Image</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Live Worker Tracking Simulation */}
                        {(complaint.status === 'assigned' || complaint.status === 'in-progress') && (
                            <div className="bg-white rounded-[2.5rem] shadow-premium border border-white overflow-hidden group">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest leading-none">Live Worker Tracking</p>
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                                        </span>
                                    </div>
                                    <div className="rounded-3xl overflow-hidden h-48 bg-gray-100 relative" id="live-worker-map">
                                        <div className="absolute inset-0 flex items-center justify-center bg-brand-50/50">
                                            <div className="text-center">
                                                <div className="animate-bounce text-2xl mb-2">🚚</div>
                                                <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">En Route to Spot</p>
                                            </div>
                                        </div>
                                        {/* In a real app, we'd render a real Leaflet map here. 
                                            For the simulation, we use this premium placeholder with animation */}
                                    </div>
                                    <div className="mt-4 p-4 bg-brand-50 rounded-2xl border border-brand-100/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. Arrival</span>
                                            <span className="text-xs font-black text-brand-600">~14 Mins</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-500 rounded-full animate-pulse transition-all duration-1000" style={{ width: '65%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Location Meta */}
                        <div className="bg-brand-900 rounded-[2.5rem] shadow-2xl p-8 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-400 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform"></div>
                            <p className="text-[10px] font-black text-brand-300 uppercase tracking-widest leading-none mb-4">Geolocation Data</p>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <span className="text-xl">📍</span>
                                    <div>
                                        <p className="text-xs font-black tracking-tight">{complaint.address}</p>
                                        <p className="text-[10px] text-brand-300 font-bold mt-1 uppercase tracking-widest opacity-70">
                                            {complaint.location.coordinates[1].toFixed(4)}, {complaint.location.coordinates[0].toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <span className="text-xl">🏙️</span>
                                    <div>
                                        <p className="text-[10px] text-brand-300 font-bold uppercase tracking-widest">Regional Zone</p>
                                        <p className="text-xs font-black tracking-tight">{complaint.city || 'City Center Zone'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetail;
