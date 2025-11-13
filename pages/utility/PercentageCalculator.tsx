import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

// FIX: Made the 'children' prop optional to match its usage in the component.
const CalculatorSection: React.FC<{ title: React.ReactNode, children?: React.ReactNode, result: string | null, onCalculate: () => void }> = ({ title, children, result, onCalculate }) => (
    <div className="bg-brand-bg p-4 rounded-lg space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-lg">
            {title}
        </div>
        <div className="flex flex-wrap items-center gap-4">
            {children}
        </div>
        <button onClick={onCalculate} className="bg-brand-primary px-4 py-1 rounded hover:bg-brand-primary-hover">Calculate</button>
        {result !== null && (
            <div className="bg-brand-surface p-2 rounded-md text-center">
                <p className="text-xl font-bold text-brand-primary">{result}</p>
            </div>
        )}
    </div>
);

const NumberInput: React.FC<{ value: string, onChange: (val: string) => void }> = ({ value, onChange }) => (
    <input value={value} onChange={e => onChange(e.target.value)} type="number" className="w-28 p-1 bg-brand-surface border border-brand-border rounded-md text-center"/>
);

const PercentageCalculator: React.FC = () => {
    // Calculator 1: What is X% of Y
    const [p1, setP1] = useState('15');
    const [n1, setN1] = useState('200');
    const [res1, setRes1] = useState<string | null>(null);

    // Calculator 2: X is what % of Y
    const [x2, setX2] = useState('30');
    const [y2, setY2] = useState('200');
    const [res2, setRes2] = useState<string | null>(null);
    
    // Calculator 3: Percentage Change
    const [oldVal, setOldVal] = useState('150');
    const [newVal, setNewVal] = useState('180');
    const [res3, setRes3] = useState<string | null>(null);

    return (
        <ToolPageLayout
            title="Advanced Percentage Calculator"
            description="Solve various common percentage problems with ease."
        >
            <div className="max-w-xl mx-auto space-y-6">
                <CalculatorSection
                    title={<><span>What is</span><NumberInput value={p1} onChange={setP1} /><span>% of</span><NumberInput value={n1} onChange={setN1} /><span>?</span></>}
                    onCalculate={() => {
                        const p = parseFloat(p1); const n = parseFloat(n1);
                        if (!isNaN(p) && !isNaN(n)) setRes1(((p / 100) * n).toString());
                    }}
                    result={res1}
                />

                <CalculatorSection
                    title={<><NumberInput value={x2} onChange={setX2} /><span>is what percent of</span><NumberInput value={y2} onChange={setY2} /><span>?</span></>}
                    onCalculate={() => {
                        const x = parseFloat(x2); const y = parseFloat(y2);
                        if (!isNaN(x) && !isNaN(y) && y !== 0) setRes2(((x / y) * 100).toFixed(2) + '%');
                    }}
                    result={res2}
                />
                
                 <CalculatorSection
                    title={<><span>Percentage change from</span><NumberInput value={oldVal} onChange={setOldVal} /><span>to</span><NumberInput value={newVal} onChange={setNewVal} /><span>?</span></>}
                    onCalculate={() => {
                        const oldN = parseFloat(oldVal); const newN = parseFloat(newVal);
                        if (!isNaN(oldN) && !isNaN(newN) && oldN !== 0) {
                            const change = ((newN - oldN) / oldN) * 100;
                            setRes3(change.toFixed(2) + '% ' + (change > 0 ? '(increase)' : '(decrease)'));
                        }
                    }}
                    result={res3}
                />
            </div>
        </ToolPageLayout>
    );
};

export default PercentageCalculator;
