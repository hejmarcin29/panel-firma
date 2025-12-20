'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTvData } from '../actions';
import type { Montage } from '@/app/dashboard/crm/montaze/types';
import { TvProcessRow } from './tv-process-row';

const ITEMS_PER_PAGE = 7;
const SCROLL_INTERVAL = 15000; // 15 seconds per page

export function TvBoard() {
    const [montages, setMontages] = useState<Montage[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [pageIndex, setPageIndex] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getTvData();
                setMontages(data);
                setLastUpdated(new Date());
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch TV data', error);
            }
        };

        fetchData();
        // Auto-refresh data every 60 seconds
        const dataInterval = setInterval(fetchData, 60000);
        
        // Auto-scroll pages
        const scrollInterval = setInterval(() => {
            setPageIndex(current => {
                const maxPages = Math.ceil(montages.length / ITEMS_PER_PAGE);
                if (maxPages <= 1) return 0;
                return (current + 1) % maxPages;
            });
        }, SCROLL_INTERVAL);

        return () => {
            clearInterval(dataInterval);
            clearInterval(scrollInterval);
        };
    }, [montages.length]);

    const visibleMontages = montages.slice(
        pageIndex * ITEMS_PER_PAGE, 
        (pageIndex + 1) * ITEMS_PER_PAGE
    );

    const totalPages = Math.ceil(montages.length / ITEMS_PER_PAGE);

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
        <div className="min-h-screen w-full bg-slate-950 text-slate-200 p-8 overflow-hidden flex flex-col font-sans">
            {/* Header */}
            <header className="flex justify-between items-center mb-10 px-2">
                <div className="flex items-center gap-6">
                    <h1 className="text-5xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Centrum Operacyjne
                    </h1>
                    <div className="px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-sm text-slate-400 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                        LIVE
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <ClockDisplay />
                        <div className="text-sm text-slate-500 mt-1">
                            Strona {pageIndex + 1} z {totalPages || 1}
                        </div>
                    </div>
                </div>
            </header>

            {/* List Container */}
            <div className="flex-1 relative">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={pageIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4"
                    >
                        {visibleMontages.map((montage) => (
                            <TvProcessRow key={montage.id} montage={montage} />
                        ))}
                    </motion.div>
                </AnimatePresence>

                {montages.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-700 text-2xl italic">
                        Brak aktywnych zleceń
                    </div>
                )}
            </div>
            
            {/* Progress Bar for Page Timer */}
            <div className="fixed bottom-0 left-0 h-1 bg-slate-800 w-full">
                <motion.div 
                    className="h-full bg-blue-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ 
                        duration: SCROLL_INTERVAL / 1000, 
                        ease: "linear", 
                        repeat: Infinity 
                    }}
                    key={pageIndex} // Reset animation on page change
                />
            </div>
        </div>
    );
}

function ClockDisplay() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="text-4xl font-mono font-bold text-slate-200 tracking-wider">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
    );
}
