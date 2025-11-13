import React, { useState, useEffect, useRef } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

interface Lap {
    id: number;
    totalTime: number;
    splitTime: number;
}

const Stopwatch: React.FC = () => {
    const [time, setTime] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [laps, setLaps] = useState<Lap[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isActive) {
            const startTime = Date.now() - time;
            intervalRef.current = setInterval(() => {
                setTime(Date.now() - startTime);
            }, 10);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive]);

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
        const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
        return `${minutes}:${seconds}.${milliseconds}`;
    };
    
    const handleLap = () => {
        const lastTotalTime = laps.length > 0 ? laps[laps.length - 1].totalTime : 0;
        const splitTime = time - lastTotalTime;
        setLaps(prev => [...prev, { id: Date.now(), totalTime: time, splitTime }]);
    };
    
    const handleReset = () => {
        setIsActive(false);
        setTime(0);
        setLaps([]);
    };

    const copyLaps = () => {
        const lapText = laps.map((lap, index) => `Lap ${index + 1}:\t${formatTime(lap.splitTime)} (Total: ${formatTime(lap.totalTime)})`).join('\n');
        navigator.clipboard.writeText(lapText);
    };

    return (
        <ToolPageLayout
            title="Advanced Stopwatch"
            description="A precise online stopwatch with split times and lap export."
        >
            <div className="flex flex-col items-center gap-6">
                <div className="text-7xl font-mono font-bold bg-brand-bg px-6 py-3 rounded-md">
                    {formatTime(time)}
                </div>
                <div className="flex gap-4">
                    {!isActive ?
                        <button onClick={() => setIsActive(true)} className="bg-green-500 text-white w-24 py-2 rounded-md">Start</button> :
                        <button onClick={() => setIsActive(false)} className="bg-yellow-500 text-white w-24 py-2 rounded-md">Pause</button>
                    }
                    <button onClick={handleLap} disabled={!isActive} className="bg-brand-primary text-white w-24 py-2 rounded-md disabled:bg-gray-500">Lap</button>
                    <button onClick={handleReset} className="bg-red-500 text-white w-24 py-2 rounded-md">Reset</button>
                </div>
                <div className="w-full max-w-md bg-brand-bg p-2 rounded-lg">
                    {laps.length > 0 && (
                        <>
                            <div className="flex justify-between p-2 text-sm text-brand-text-secondary border-b border-brand-border">
                                <span>Lap</span>
                                <span>Split Time</span>
                                <span>Total Time</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {[...laps].reverse().map((lap, index) => (
                                    <div key={lap.id} className="flex justify-between p-2 border-b border-brand-border/50 font-mono">
                                        <span>{laps.length - index}</span>
                                        <span>+ {formatTime(lap.splitTime)}</span>
                                        <span>{formatTime(lap.totalTime)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end mt-2">
                                <button onClick={copyLaps} className="text-sm text-brand-primary hover:underline">Copy Laps</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default Stopwatch;
