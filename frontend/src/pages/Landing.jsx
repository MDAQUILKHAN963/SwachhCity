import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintAPI } from '../lib/api.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function Landing() {
    return (
        <div className="bg-brand-50 min-h-screen font-sans text-slate-800">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-xl text-white shadow-lg shadow-brand-600/20">♻️</div>
                            <span className="font-black text-xl tracking-tighter text-gray-900 italic">Swachh<span className="text-brand-600">City</span></span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <Link to="/login" className="text-gray-500 hover:text-brand-600 font-bold text-sm tracking-widest uppercase transition">Login</Link>
                            <Link to="/register" className="px-6 py-3 grad-brand text-white rounded-2xl font-black text-xs tracking-widest uppercase hover:shadow-brand-500/50 hover:-translate-y-0.5 transition-all shadow-premium">
                                Join Mission
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-40 overflow-hidden bg-brand-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm mb-10 animate-bounce">
                        <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                        <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest">Next-Gen Municipal OS</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gray-900 mb-8 leading-[0.9]">
                        CLEAN CITIES, <br />
                        <span className="text-transparent bg-clip-text grad-brand">
                            SMART FUTURES.
                        </span>
                    </h1>
                    <p className="mt-4 text-lg font-medium text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed uppercase tracking-tight">
                        The AI-driven platform revolutionizing urban hygiene. <br className="hidden md:block" /> Real-time detection. Automatic deployment. Zero friction.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <Link to="/register" className="px-10 py-5 grad-brand text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-500/40 hover:shadow-brand-500/60 hover:-translate-y-1 transition-all">
                            Start Reporting
                        </Link>
                        <Link to="/login" className="px-10 py-5 bg-white text-gray-700 border border-gray-100 rounded-3xl font-black text-sm uppercase tracking-widest hover:border-brand-200 hover:bg-gray-50 transition shadow-sm">
                            Access Portal
                        </Link>
                    </div>
                </div>

                {/* Animated Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-40 pointer-events-none">
                    <div className="absolute top-40 left-1/4 w-[500px] h-[500px] bg-brand-300 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
                    <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-cyan-200 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
                </div>
            </section>

            {/* Public Impact Map - Transparency Feature */}
            <section className="py-24 bg-white relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="px-4 py-1.5 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-100">Live Transparency</span>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter mt-4 uppercase">City Impact Pulse</h2>
                        <p className="text-gray-400 font-medium max-w-xl mx-auto mt-4 uppercase text-xs tracking-widest italic">Every pin is a citizen creating a cleaner future.</p>
                    </div>

                    <ImpactMap />
                </div>
            </section>

            {/* Features (Refined) */}
            <section className="py-24 bg-white relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { icon: '📸', color: 'grad-brand', title: 'ML DETECTION', desc: 'Enterprise-grade Computer Vision verifies garbage complaints instantly.' },
                            { icon: '🚀', color: 'grad-warm', title: 'AUTO DISPATCH', desc: 'Predictive routing assigns tasks to the nearest mobile force automatically.' },
                            { icon: '📊', color: 'grad-cool', title: 'URBAN INTEL', desc: 'Real-time heatmaps and impact leaderboards drive transparency.' }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-10 rounded-[2.5rem] bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-premium transition-all duration-500 group">
                                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-lg group-hover:rotate-6 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-black text-gray-800 mb-4 tracking-tight leading-none uppercase">{feature.title}</h3>
                                <p className="text-gray-400 font-medium leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-brand-900 text-brand-100 py-16 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">♻️</div>
                        <span className="font-black text-lg tracking-tighter italic">Swachh<span className="text-brand-600">City</span></span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">&copy; 2026 SwachhCity Mission. Built for a Cleaner Planet.</p>
                </div>
            </footer>
        </div>
    );
}

function ImpactMap() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublicReports = async () => {
            try {
                const response = await complaintAPI.getPublic();
                if (response.data.success) {
                    setReports(response.data.data.complaints);
                }
            } catch (err) {
                console.error('Error fetching public reports:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPublicReports();
    }, []);

    useEffect(() => {
        if (!loading && reports.length > 0) {
            const mapContainer = document.getElementById('public-impact-map');
            if (mapContainer && !mapContainer._leaflet_id) {
                const map = L.map('public-impact-map', {
                    scrollWheelZoom: false,
                    attributionControl: false
                }).setView([20.5937, 78.9629], 5); // Center of India

                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

                const markers = [];
                reports.forEach(report => {
                    if (report.location && report.location.coordinates) {
                        const marker = L.marker([report.location.coordinates[1], report.location.coordinates[0]])
                            .addTo(map)
                            .bindPopup(`
                                <div class="p-2 font-sans text-center">
                                    <p class="text-[10px] font-black uppercase tracking-widest text-brand-600 mb-1">${report.status}</p>
                                    <p class="text-xs font-bold text-gray-800">${report.address}</p>
                                </div>
                            `);
                        markers.push(marker);
                    }
                });

                if (markers.length > 0) {
                    const group = new L.featureGroup(markers);
                    map.fitBounds(group.getBounds().pad(0.1));
                }
            }
        }
    }, [loading, reports]);

    return (
        <div className="relative group">
            <div
                id="public-impact-map"
                className="w-full h-[500px] rounded-[3rem] bg-gray-50 border-8 border-white shadow-premium overflow-hidden z-10"
            >
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-20">
                        <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full mb-4"></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tuning City Pulse...</p>
                    </div>
                )}
            </div>
            {/* Stats Overlay */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl grid grid-cols-3 gap-4 px-4 z-20">
                {[
                    { label: 'Active Reports', val: reports.length, icon: '📍' },
                    { label: 'Cities Covered', val: '12', icon: '🏙️' },
                    { label: 'Impact Score', val: '9.8', icon: '✨' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-2xl text-center hover:-translate-y-2 transition-transform duration-500">
                        <span className="text-2xl mb-2 block">{stat.icon}</span>
                        <p className="text-2xl font-black text-gray-900 leading-none">{stat.val}</p>
                        <p className="text-[8px] font-black text-gray-400 uppercase mt-2 tracking-widest">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
