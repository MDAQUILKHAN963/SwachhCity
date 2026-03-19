import { useState, useEffect } from 'react';

export default function Leaderboard({ title, data, type = 'citizen' }) {
    // Icons for top 3
    const getBadge = (index) => {
        if (index === 0) return { name: 'City Legend', icon: '👑', color: 'text-yellow-600 bg-yellow-50' };
        if (index < 3) return { name: 'Guardian', icon: '🛡️', color: 'text-brand-600 bg-brand-50' };
        return { name: 'Eco-Warrior', icon: '🌱', color: 'text-emerald-600 bg-emerald-50' };
    };

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return '🥇'; // Gold
            case 1: return '🥈'; // Silver
            case 2: return '🥉'; // Bronze
            default: return `${index + 1}.`;
        }
    };

    const getRankColor = (index) => {
        switch (index) {
            case 0: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 1: return 'bg-gray-100 text-gray-800 border-gray-200';
            case 2: return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-white text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="bg-white/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white shadow-premium group">
            <div className="p-6 border-b border-gray-100/50 bg-gray-50/30 flex justify-between items-center">
                <div>
                    <h3 className="font-black text-gray-800 tracking-tight">{title}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Global Rankings</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                    {type === 'citizen' ? '🏆' : '⭐'}
                </div>
            </div>

            <div className="p-4">
                {data && data.length > 0 ? (
                    <div className="space-y-3">
                        {data.map((item, index) => (
                            <div
                                key={item._id}
                                className={`flex items-center justify-between p-4 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group/item ${index === 0 ? 'bg-yellow-50/30 border-yellow-100 shadow-sm' :
                                    index === 1 ? 'bg-gray-50/50 border-gray-100 shadow-sm' :
                                        index === 2 ? 'bg-orange-50/20 border-orange-100 shadow-sm' :
                                            'bg-white border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner border border-white/50 ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                        index === 1 ? 'bg-gray-100 text-gray-500' :
                                            index === 2 ? 'bg-orange-100 text-orange-600' :
                                                'bg-gray-50 text-gray-400'
                                        }`}>
                                        {getRankIcon(index)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-black text-gray-800 tracking-tight leading-none group-hover/item:text-brand-600 transition-colors uppercase text-sm">{item.name}</p>
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${getBadge(index).color}`}>
                                                {getBadge(index).icon} {getBadge(index).name}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                            {item.count} {type === 'citizen' ? 'Reports Filed' : 'Spot Resolutions'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-gray-800 tracking-tighter group-hover/item:text-brand-600 transition-all">{item.points || 0}</p>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Impact Pts</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100 mx-2">
                        <div className="text-4xl mb-4 grayscale opacity-30">🏔️</div>
                        <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No Legends Identified</p>
                        <p className="text-[10px] text-gray-300 font-bold mt-1">Be the first to claim the throne!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
