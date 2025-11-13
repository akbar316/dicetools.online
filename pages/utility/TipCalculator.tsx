
import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const TipCalculator: React.FC = () => {
    const [bill, setBill] = useState('');
    const [tipPercent, setTipPercent] = useState('15');
    const [people, setPeople] = useState('1');

    const b = parseFloat(bill);
    const t = parseFloat(tipPercent);
    const p = parseInt(people, 10);

    let tipAmount = 0;
    let total = 0;
    let perPerson = 0;

    if (!isNaN(b) && !isNaN(t) && !isNaN(p) && p > 0) {
        tipAmount = b * (t / 100);
        total = b + tipAmount;
        perPerson = total / p;
    }

    return (
        <ToolPageLayout
            title="Tip Calculator"
            description="Calculate the tip and total bill per person."
        >
            <div className="max-w-md mx-auto space-y-4">
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Bill Amount</label>
                    <input type="number" value={bill} onChange={e => setBill(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Tip Percentage</label>
                    <input type="number" value={tipPercent} onChange={e => setTipPercent(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Number of People</label>
                    <input type="number" value={people} min="1" step="1" onChange={e => setPeople(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md" />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mt-4">
                    <div className="bg-brand-bg p-4 rounded-md">
                        <p className="text-brand-text-secondary">Tip Amount</p>
                        <p className="text-2xl font-bold text-brand-primary">${tipAmount.toFixed(2)}</p>
                    </div>
                    <div className="bg-brand-bg p-4 rounded-md">
                        <p className="text-brand-text-secondary">Total Bill</p>
                        <p className="text-2xl font-bold text-brand-primary">${total.toFixed(2)}</p>
                    </div>
                    <div className="bg-brand-bg p-4 rounded-md">
                        <p className="text-brand-text-secondary">Per Person</p>
                        <p className="text-2xl font-bold text-brand-primary">${perPerson.toFixed(2)}</p>
                    </div>
                 </div>
            </div>
        </ToolPageLayout>
    );
};

export default TipCalculator;
