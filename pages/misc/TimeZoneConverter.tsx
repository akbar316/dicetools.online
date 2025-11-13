
import React, { useState, useEffect } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const timezones = [ 'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney' ];

const TimeZoneConverter: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const [fromTz, setFromTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [toTz, setToTz] = useState('UTC');
    
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date, tz: string) => {
        try {
            return new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                year: 'numeric', month: 'short', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }).format(date);
        } catch (e) {
            return "Invalid Timezone";
        }
    };

    return (
        <ToolPageLayout
            title="Time Zone Converter"
            description="Convert time between different time zones."
        >
            <div className="flex flex-col items-center gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    <div className="bg-brand-bg p-4 rounded-md">
                         <select value={fromTz} onChange={e => setFromTz(e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md mb-2">
                             {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                             <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>Your Local Time</option>
                         </select>
                         <p className="text-2xl font-mono">{formatTime(time, fromTz)}</p>
                    </div>
                     <div className="bg-brand-bg p-4 rounded-md">
                         <select value={toTz} onChange={e => setToTz(e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md mb-2">
                             {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                         </select>
                         <p className="text-2xl font-mono">{formatTime(time, toTz)}</p>
                    </div>
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default TimeZoneConverter;
