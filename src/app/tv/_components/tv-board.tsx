'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTvData, TvColumn, TvMontage } from '../actions';
import { MapPin, Ruler, Hammer, AlertCircle } from 'lucide-react';

export function TvBoard() {
    const [columns, setColumns] = useState<TvColumn[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getTvData();
                setColumns(data);
                setLastUpdated(new Date());
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch TV data', error);
            }
        };

        fetchData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-200 p-6 overflow-hidden flex flex-col font-sans">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 px-2">
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Panel Realizacji
                    </h1>
                    <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        LIVE
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <ClockDisplay />
                        <div className="text-xs text-slate-500 mt-1">
                            Ost. aktualizacja: {lastUpdated.toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </header>

            {/* Board */}
            <div className="flex-1 grid grid-cols-5 gap-4 h-full overflow-hidden">
                {columns.map((column) => (
                    <Column key={column.id} column={column} />
                ))}
            </div>
        </div>
    );
}

function Column({ column }: { column: TvColumn }) {
    return (
        <div className={`flex flex-col h-full rounded-2xl bg-gradient-to-b ${column.color} border border-white/5 backdrop-blur-sm overflow-hidden`}>
            {/* Column Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h2 className="font-semibold text-lg tracking-wide text-white/90">
                    {column.title}
                </h2>
                <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded text-sm font-mono">
                    {column.items.length}
                </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-hide">
                <AnimatePresence mode='popLayout'>
                    {column.items.map((item) => (
                        <Card key={item.id} item={item} />
                    ))}
                </AnimatePresence>
                {column.items.length === 0 && (
                    <div className="h-32 flex items-center justify-center text-white/20 text-sm italic">
                        Brak zleceń
                    </div>
                )}
            </div>
        </div>
    );
}

function Card({ item }: { item: TvMontage }) {
    const isStuck = item.priority === 'high';

    return (
        <motion.div
            layoutId={item.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`
                relative p-4 rounded-xl border backdrop-blur-md shadow-lg group
                ${isStuck 
                    ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }
                transition-colors duration-300
            `}
        >
            {/* Status Indicator Line */}
            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${isStuck ? 'bg-red-500' : 'bg-blue-500/50'}`} />

            <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-lg leading-tight truncate pr-2">
                        {item.clientName}
                    </h3>
                    {isStuck && (
                        <AlertCircle className="w-5 h-5 text-red-400 animate-pulse shrink-0" />
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center text-slate-400 text-sm">
                        <MapPin className="w-3.5 h-3.5 mr-2 opacity-70" />
                        <span className="truncate">{item.city}</span>
                    </div>

                    {(item.installer || item.measurer) && (
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                            {item.measurer && (
                                <div className="flex items-center text-xs text-purple-300/80" title="Pomiarowiec">
                                    <Ruler className="w-3 h-3 mr-1.5" />
                                    {item.measurer.split(' ')[0]}
                                </div>
                            )}
                            {item.installer && (
                                <div className="flex items-center text-xs text-orange-300/80" title="Montażysta">
                                    <Hammer className="w-3 h-3 mr-1.5" />
                                    {item.installer.split(' ')[0]}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer: Time in status */}
                <div className="mt-3 flex justify-end">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isStuck ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-slate-500'}`}>
                        {item.daysInStatus} dni w etapie
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

function ClockDisplay() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="text-3xl font-mono font-bold text-slate-200 tracking-wider">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
    );
}
