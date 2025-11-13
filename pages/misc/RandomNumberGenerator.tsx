
import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const RandomNumberGenerator: React.FC = () => {
    const [min, setMin] = useState('1');
    const [max, setMax] = useState('100');
    const [number, setNumber] = useState<number | null>(null);

    const generateNumber = () => {
        const minNum = parseInt(min, 10);
        const maxNum = parseInt(max, 10);
        if (isNaN(minNum) || isNaN(maxNum) || minNum > maxNum) return;
        const result = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
        setNumber(result);
    };

    return (
        <ToolPageLayout
            title="Random Number Generator"
            description="Generate a random number within a specified range."
        >
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4">
                    <input type="number" value={min} onChange={e => setMin(e.target.value)} className="w-24 p-2 bg-brand-bg border border-brand-border rounded-md" />
                    <span>to</span>
                    <input type="number" value={max} onChange={e => setMax(e.target.value)} className="w-24 p-2 bg-brand-bg border border-brand-border rounded-md" />
                </div>
                <button onClick={generateNumber} className="bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-primary-hover">Generate</button>
                {number !== null && (
                    <div className="text-5xl font-bold bg-brand-bg p-6 rounded-md text-brand-primary">
                        {number}
                    </div>
                )}
            </div>
        </ToolPageLayout>
    );
};

export default RandomNumberGenerator;
