import React, { useState, useEffect, useRef } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

type Mode = 'timer' | 'date';

const CountdownTimer: React.FC = () => {
    const [mode, setMode] = useState<Mode>('timer');
    
    // Timer mode state
    const [duration, setDuration] = useState(1500); // 25 mins default
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);

    // Date mode state
    const [targetDate, setTargetDate] = useState('');
    const [dateDiff, setDateDiff] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Effect for standard timer
    useEffect(() => {
        if (mode !== 'timer' || !isActive) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        if (timeLeft > 0) {
            intervalRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else {
            setIsActive(false);
            if(intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if(intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, timeLeft, mode]);
    
    // Effect for countdown to date
    useEffect(() => {
        if (mode !== 'date' || !targetDate) return;
        
        const calculateDiff = () => {
             const difference = new Date(targetDate).getTime() - new Date().getTime();
             if (difference > 0) {
                 setDateDiff({
                     days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                     hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                     minutes: Math.floor((difference / 1000 / 60) % 60),
                     seconds: Math.floor((difference / 1000) % 60),
                 });
             } else {
                 setDateDiff({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                 if(intervalRef.current) clearInterval(intervalRef.current);
             }
        };
        
        calculateDiff();
        intervalRef.current = setInterval(calculateDiff, 1000);

        return () => {
            if(intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [targetDate, mode]);
    
    const startTimer = () => { setTimeLeft(duration); setIsActive(true); };
    const pauseTimer = () => setIsActive(false);
    const resetTimer = () => { setIsActive(false); setTimeLeft(0); };
    
    const setPreset = (minutes: number) => { setDuration(minutes * 60); setTimeLeft(minutes * 60); };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <ToolPageLayout
            title="Advanced Countdown Timer"
            description="Set a timer or count down to a specific date and time."
        >
            <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
                <div className="flex border border-brand-border rounded-md w-full">
                    <button onClick={() => setMode('timer')} className={`flex-1 p-2 rounded-l-md ${mode === 'timer' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>Timer</button>
                    <button onClick={() => setMode('date')} className={`flex-1 p-2 rounded-r-md ${mode === 'date' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>Countdown to Date</button>
                </div>

                {mode === 'timer' ? (
                    <>
                        <div className="text-7xl font-mono font-bold bg-brand-bg px-6 py-3 rounded-md">{formatTime(timeLeft)}</div>
                        {!isActive && timeLeft === 0 && (
                            <div className="space-y-3 text-center">
                                <div className="flex items-center gap-2">
                                    <input type="number" value={Math.floor(duration/60)} onChange={e => setDuration(parseInt(e.target.value, 10) * 60)} className="w-24 p-2 bg-brand-bg border border-brand-border rounded-md" placeholder="Minutes"/>
                                    <span className="text-lg">Minutes</span>
                                </div>
                                <div className="flex gap-2 justify-center">
                                    {[5, 10, 15, 25, 45, 60].map(p => <button key={p} onClick={() => setPreset(p)} className="bg-brand-surface px-3 py-1 text-sm rounded-md">{p} min</button>)}
                                </div>
                            </div>
                        )}
                        <div className="flex gap-4">
                            {timeLeft === 0 && !isActive && <button onClick={startTimer} className="bg-green-500 text-white px-6 py-2 rounded-md">Start</button>}
                            {isActive && <button onClick={pauseTimer} className="bg-yellow-500 text-white px-6 py-2 rounded-md">Pause</button>}
                            {!isActive && timeLeft > 0 && <button onClick={() => setIsActive(true)} className="bg-green-500 text-white px-6 py-2 rounded-md">Resume</button>}
                            {timeLeft > 0 && <button onClick={resetTimer} className="bg-red-500 text-white px-6 py-2 rounded-md">Reset</button>}
                        </div>
                    </>
                ) : (
                    <div className="w-full space-y-4 text-center">
                         <input type="datetime-local" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="p-3 bg-brand-bg border border-brand-border rounded-md text-brand-text-secondary text-lg"/>
                         <div className="grid grid-cols-4 gap-4">
                            <div className="bg-brand-bg p-3 rounded-md"><div className="text-4xl font-bold">{dateDiff.days}</div><div className="text-xs">Days</div></div>
                            <div className="bg-brand-bg p-3 rounded-md"><div className="text-4xl font-bold">{dateDiff.hours}</div><div className="text-xs">Hours</div></div>
                            <div className="bg-brand-bg p-3 rounded-md"><div className="text-4xl font-bold">{dateDiff.minutes}</div><div className="text-xs">Minutes</div></div>
                            <div className="bg-brand-bg p-3 rounded-md"><div className="text-4xl font-bold">{dateDiff.seconds}</div><div className="text-xs">Seconds</div></div>
                         </div>
                    </div>
                )}
            </div>
        </ToolPageLayout>
    );
};

export default CountdownTimer;
