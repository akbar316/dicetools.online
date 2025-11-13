
import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const DateDifferenceCalculator: React.FC = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [diff, setDiff] = useState<string | null>(null);

    const calculateDiff = () => {
        if (!startDate || !endDate) return;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const difference = Math.abs(end.getTime() - start.getTime());
        const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
        const years = Math.floor(days / 365);
        const months = Math.floor((days % 365) / 30);
        const remainingDays = days - (years * 365) - (months * 30);
        
        setDiff(`${years} years, ${months} months, and ${remainingDays} days`);
    };

    return (
        <ToolPageLayout
            title="Date Difference Calculator"
            description="Calculate the duration between two dates."
        >
            <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 bg-brand-bg border border-brand-border rounded-md text-brand-text-secondary"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">End Date</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 bg-brand-bg border border-brand-border rounded-md text-brand-text-secondary"/>
                    </div>
                </div>
                 <button onClick={calculateDiff} className="bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-primary-hover">Calculate Difference</button>
                 {diff && (
                    <div className="text-center bg-brand-bg p-4 rounded-md mt-4">
                        <p className="text-brand-text-secondary">Difference is:</p>
                        <p className="text-2xl font-bold text-brand-primary">{diff}</p>
                    </div>
                )}
            </div>
        </ToolPageLayout>
    );
};

export default DateDifferenceCalculator;
