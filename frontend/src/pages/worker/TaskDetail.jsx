import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { complaintAPI } from '../../lib/api';
import MapView from '../../components/maps/MapView';
import { getImageUrl } from '../../utils/image.js';

export default function TaskDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [proofImage, setProofImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        fetchTaskDetails();
    }, [id]);

    const fetchTaskDetails = async () => {
        try {
            setLoading(true);
            const response = await complaintAPI.getById(id);
            if (response.data.success) {
                setTask(response.data.data.complaint);
            }
        } catch (error) {
            console.error("Error fetching task:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (newStatus === 'resolved' && !proofImage) {
            alert("Please upload a proof image to mark as resolved.");
            return;
        }

        try {
            setUpdating(true);
            const formData = new FormData();
            formData.append('status', newStatus);
            if (proofImage) {
                formData.append('image', proofImage);
            }
            if (newStatus === 'resolved') {
                formData.append('notes', 'Resolved by worker');
            }

            await complaintAPI.updateStatus(id, formData);

            if (newStatus === 'resolved') {
                alert("Task completed successfully! Good job.");
                navigate('/worker/dashboard');
            } else {
                fetchTaskDetails();
            }

        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProofImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const openGoogleMaps = () => {
        if (task && task.location) {
            const [lng, lat] = task.location.coordinates;
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-brand-50/50 flex items-center justify-center">
            <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full"></div>
        </div>
    );

    if (!task) return <div className="p-8 text-center text-red-500 font-black uppercase text-xs tracking-widest">Task not found</div>;

    return (
        <div className="min-h-screen bg-brand-50/50 pb-12">
            {/* Navbar */}
            <nav className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => navigate('/worker/dashboard')}
                        >
                            <div className="w-10 h-10 bg-brand-700 rounded-xl flex items-center justify-center text-xl text-white shadow-lg shadow-brand-700/20">👷</div>
                            <span className="font-black text-xl tracking-tighter text-gray-900 italic">Swachh<span className="text-brand-600">City</span></span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="hidden sm:flex flex-col text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Worker</p>
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

            <div className="max-w-5xl mx-auto px-4 pt-12">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Main Content (Left 3/5) */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="bg-white rounded-[2.5rem] shadow-premium border border-white overflow-hidden p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <button
                                        onClick={() => navigate('/worker/dashboard')}
                                        className="flex items-center gap-2 text-gray-400 hover:text-brand-600 font-black text-[10px] uppercase tracking-widest transition-colors mb-4"
                                    >
                                        <span>⬅️</span>
                                        <span>Back to Tasks</span>
                                    </button>
                                    <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">TASK #{task._id.slice(-6)}</h1>
                                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest italic">{task.address}</p>
                                </div>
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${task.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    task.status === 'in-progress' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                        'bg-brand-50 text-brand-600 border-brand-100'
                                    }`}>
                                    {task.status}
                                </span>
                            </div>

                            {/* Task Visualization */}
                            <div className="rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner h-80 mb-8">
                                <MapView
                                    center={[task.location.coordinates[1], task.location.coordinates[0]]}
                                    zoom={15}
                                    complaints={[task]}
                                    height="100%"
                                />
                            </div>

                            <button
                                onClick={openGoogleMaps}
                                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl flex justify-center items-center gap-3 active:scale-95"
                            >
                                <span className="text-lg">🗺️</span> Open in Maps
                            </button>
                        </div>

                        {/* Description & Evidence */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-premium">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Original Report</h3>
                                <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 h-48 flex items-center justify-center">
                                    {task.imageUrl ? (
                                        <img
                                            src={getImageUrl(task.imageUrl)}
                                            alt="Complaint"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-[10px] font-black text-gray-300 uppercase italic tracking-widest">No Visual Source</span>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-premium">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Task Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">User Notes</p>
                                        <p className="text-xs font-medium text-gray-600 leading-relaxed italic">"{task.description || 'No specific instructions provided.'}"</p>
                                    </div>
                                    <div className="flex gap-6">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">AI Severity</p>
                                            <p className="text-sm font-black text-brand-600">Level {task.severity}/10</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Urgency</p>
                                            <p className="text-sm font-black text-gray-800">URGENT</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions (Right 2/5) */}
                    <div className="lg:col-span-2 space-y-8">
                        {task.status !== 'resolved' ? (
                            <div className="bg-white rounded-[2.5rem] shadow-premium border border-white p-8 group">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl shadow-inner border border-amber-100">⚡</div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter leading-none">Start Work</h3>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Update status</p>
                                    </div>
                                </div>

                                {task.status === 'assigned' && (
                                    <button
                                        onClick={() => handleStatusUpdate('in-progress')}
                                        disabled={updating}
                                        className="w-full py-6 grad-brand text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-1 transition-all active:scale-95"
                                    >
                                        Start Cleaning
                                    </button>
                                )}

                                {task.status === 'in-progress' && (
                                    <div className="space-y-6">
                                        <div className="border-2 border-dashed border-gray-100 rounded-3xl p-8 text-center bg-gray-50/50 group-hover:border-emerald-200 transition-colors">
                                            {previewUrl ? (
                                                <div className="relative group/proof">
                                                    <img src={previewUrl} alt="Proof" className="h-48 w-full object-cover rounded-2xl shadow-xl" />
                                                    <button
                                                        onClick={() => { setProofImage(null); setPreviewUrl(null); }}
                                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl text-xs shadow-lg opacity-0 group-hover/proof:opacity-100 transition-opacity"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer block">
                                                    <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all group-hover:rotate-6">📸</div>
                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">Proof of Cleanup (REQUIRED)</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleImageChange}
                                                    />
                                                    <div className="inline-block px-5 py-2 bg-white text-gray-700 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
                                                        Capture Evidence
                                                    </div>
                                                </label>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleStatusUpdate('resolved')}
                                            disabled={updating || !proofImage}
                                            className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:grayscale active:scale-95"
                                        >
                                            {updating ? 'Saving...' : '✅ Done Cleaning'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-emerald-900 rounded-[2.5rem] shadow-2xl p-10 text-white relative overflow-hidden text-center">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10">
                                    <div className="text-6xl mb-6">🏆</div>
                                    <h3 className="font-black text-2xl mb-2 tracking-tight">Cleaned Up!</h3>
                                    <p className="text-emerald-100 text-sm font-medium leading-relaxed opacity-80 uppercase tracking-tighter">
                                        Impact archived. <br /> Your efforts contribute to a cleaner city.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-[2.5rem] p-8 border border-white shadow-premium">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Task Info</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID Hash</span>
                                    <span className="text-[10px] font-mono text-gray-900">#{task._id.slice(-12)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</span>
                                    <span className="text-[10px] font-black text-brand-600 uppercase">Cleaning</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Timeline</span>
                                    <span className="text-[10px] font-black text-gray-900 uppercase">{new Date(task.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
