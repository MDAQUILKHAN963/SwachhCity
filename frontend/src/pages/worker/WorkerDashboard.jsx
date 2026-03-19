import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workerAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore.js';
import { connectSocket, joinWorkerRoom } from '../../lib/socket.js';

export default function WorkerDashboard() {
    const { user, token, logout } = useAuthStore();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('assigned'); // assigned, in-progress, resolved

    useEffect(() => {
        // Only workers should join worker room
        if (!user || user.role !== 'worker' || !token) return;

        // Use shared socket connection with auth token
        const socket = connectSocket(token);

        // Join worker room keyed by user.id (backend uses worker.userId)
        joinWorkerRoom(user.id);

        const handleNewAssignment = (data) => {
            // Refresh tasks list
            fetchTasks();

            // Browser Notification
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('New Task Assigned! 🧹', {
                    body: `New garbage complaint assigned at ${data.complaint?.address || 'your area'}.`,
                    icon: '/vite.svg'
                });
            } else {
                // Fallback alert
                alert('New task assigned!');
            }
        };

        socket.on('new_assignment', handleNewAssignment);

        return () => {
            socket.off('new_assignment', handleNewAssignment);
        };
    }, [user, token]);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await workerAPI.getMyAssignments();
            if (response.data.success) {
                setTasks(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const getSLATimeRemaining = (assignedDate) => {
        const slaHours = 24;
        const deadline = new Date(assignedDate).getTime() + slaHours * 60 * 60 * 1000;
        const now = new Date().getTime();
        const diff = deadline - now;

        if (diff < 0) return { expired: true, text: 'Overdue' };

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return {
            expired: false,
            hours,
            minutes,
            text: `${hours}h ${minutes}m left`
        };
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'assigned') return task.status === 'assigned';
        if (filter === 'in-progress') return task.status === 'in-progress';
        if (filter === 'resolved') return task.status === 'resolved';
        return true;
    });

    if (loading && tasks.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-brand-50/50">
                <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full mr-4"></div>
                <div className="text-xl font-black text-gray-400 uppercase tracking-widest italic">Loading tasks...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-50/30">
            {/* Navbar */}
            <nav className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/worker/dashboard')}>
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

            {/* Header / Hero Section */}
            <div className="relative overflow-hidden bg-brand-900 pt-16 pb-32">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2"></div>

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-white">
                            <h1 className="text-4xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-200">
                                Worker Portal
                            </h1>
                            <p className="text-brand-100 text-lg font-light max-w-md opacity-80 italic">
                                Help keep the city clean. View your assigned tasks here.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 glass p-4 rounded-3xl border-white/10 shadow-premium">
                            <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
                            <span className="text-white font-black text-xs tracking-[0.2em] uppercase">Status: Available</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-12">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-premium border border-white hover:translate-y-[-4px] transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Tasks</p>
                                <p className="text-4xl font-black text-gray-800 tracking-tight group-hover:text-brand-600 transition-colors">
                                    {tasks.filter(t => t.status === 'assigned').length}
                                </p>
                            </div>
                            <div className="w-14 h-14 bg-blue-50 text-brand-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:rotate-6 transition-transform">📋</div>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-brand-500 h-full w-2/3 opacity-30"></div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-premium border border-white hover:translate-y-[-4px] transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Working On</p>
                                <p className="text-4xl font-black text-gray-800 tracking-tight group-hover:text-amber-500 transition-colors">
                                    {tasks.filter(t => t.status === 'in-progress').length}
                                </p>
                            </div>
                            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:rotate-6 transition-transform">⚡</div>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full w-1/3 opacity-30"></div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-premium border border-white hover:translate-y-[-4px] transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Tasks Completed</p>
                                <p className="text-4xl font-black text-gray-800 tracking-tight group-hover:text-emerald-500 transition-colors">
                                    {tasks.filter(t => t.status === 'resolved').length}
                                </p>
                            </div>
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:rotate-6 transition-transform">🎯</div>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-full opacity-30"></div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs & Content */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-premium overflow-hidden">
                    <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex bg-gray-200/50 p-1.5 rounded-[1.5rem]">
                            {['assigned', 'in-progress', 'resolved'].map((status) => (
                                <button
                                    key={status}
                                    className={`px-8 py-2.5 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all duration-300 ${filter === status
                                        ? 'bg-white text-brand-600 shadow-xl'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    onClick={() => setFilter(status)}
                                >
                                    {status.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">
                            {filteredTasks.length} {filter} Tasks
                        </div>
                    </div>

                    <div className="p-8">
                        {filteredTasks.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50/30 rounded-[2rem] border-2 border-dashed border-gray-100">
                                <div className="text-6xl mb-6">🌈</div>
                                <p className="text-gray-400 font-black text-lg italic tracking-tight">Zone Status: Clean</p>
                                <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest mt-2">No {filter} tasks found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-8">
                                {filteredTasks.map(task => (
                                    <div key={task._id} className="group relative bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl hover:border-brand-100 transition-all duration-500">
                                        <div className="flex flex-col md:flex-row justify-between gap-8">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl border ${task.priority > 0.7 ? 'bg-red-50 text-red-600 border-red-100 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-brand-50 text-brand-600 border-brand-100'
                                                        }`}>
                                                        {task.priority > 0.7 ? '🚨 Urgent Task' : 'Regular Task'}
                                                    </span>
                                                    <span className="text-[10px] font-black font-mono text-gray-300 tracking-[0.3em]">
                                                        ID::{task._id.slice(-6).toUpperCase()}
                                                    </span>
                                                </div>

                                                <h3 className="font-black text-2xl text-gray-900 mb-2 group-hover:text-brand-600 transition-colors tracking-tight italic">
                                                    {task.address || 'Vector Undefined'}
                                                </h3>

                                                {/* SLA / Time Badge */}
                                                {task.status !== 'resolved' && (
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                                                        {(() => {
                                                            const sla = getSLATimeRemaining(task.assignedAt || task.createdAt);
                                                            return (
                                                                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${sla.expired ? 'text-red-600' : 'text-gray-500'}`}>
                                                                    <span className="text-lg">⏱️</span> {sla.text}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                )}

                                                <p className="text-gray-400 text-sm font-medium line-clamp-2 leading-relaxed italic opacity-80">
                                                    "{task.description || 'No additional details provided.'}"
                                                </p>
                                            </div>

                                            <div className="flex flex-col justify-between items-stretch sm:items-end gap-6 min-w-[180px]">
                                                <div className="sm:text-right">
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Time Assigned</p>
                                                    <p className="text-xs font-black text-gray-800 uppercase tracking-tighter">
                                                        {new Date(task.assignedAt || task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <Link
                                                    to={`/worker/task/${task._id}`}
                                                    className="w-full text-center px-8 py-4 grad-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-1 active:scale-95 transition-all duration-300"
                                                >
                                                    View Task
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
