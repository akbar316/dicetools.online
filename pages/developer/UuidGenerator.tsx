import React, { useState, useMemo } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

const UuidGenerator: React.FC = () => {
    // FIX: Explicitly type state as string[] to avoid overly specific type inference from crypto.randomUUID().
    const [uuids, setUuids] = useState<string[]>([crypto.randomUUID()]);
    const [count, setCount] = useState(1);
    const [uppercase, setUppercase] = useState(false);
    const [noHyphens, setNoHyphens] = useState(false);

    const generateNew = () => {
        const newUuids = Array.from({ length: count }, () => crypto.randomUUID());
        setUuids(newUuids);
    };

    const formattedUuids = useMemo(() => {
        return uuids.map(uuid => {
            let formatted = uuid;
            if (uppercase) formatted = formatted.toUpperCase();
            if (noHyphens) formatted = formatted.replace(/-/g, '');
            return formatted;
        }).join('\n');
    }, [uuids, uppercase, noHyphens]);

    return (
        <ToolPageLayout
            title="Advanced UUID Generator"
            description="Generate multiple version 4 UUIDs with formatting options."
        >
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="bg-brand-bg p-4 rounded-lg space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">How many?</label>
                            <input type="number" min="1" max="100" value={count} onChange={e => setCount(parseInt(e.target.value, 10))} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md"/>
                         </div>
                        <label className="flex items-center space-x-2 p-3 bg-brand-surface rounded-md cursor-pointer justify-center">
                            <input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} className="h-4 w-4 rounded" />
                            <span>Uppercase</span>
                        </label>
                        <label className="flex items-center space-x-2 p-3 bg-brand-surface rounded-md cursor-pointer justify-center">
                            <input type="checkbox" checked={noHyphens} onChange={e => setNoHyphens(e.target.checked)} className="h-4 w-4 rounded" />
                            <span>No Hyphens</span>
                        </label>
                    </div>
                </div>
                <textarea
                    readOnly
                    value={formattedUuids}
                    rows={Math.max(5, count)}
                    className="w-full p-3 bg-brand-bg border border-brand-border rounded-md font-mono text-center"
                />
                <div className="flex justify-center gap-4">
                    <button onClick={generateNew} className="bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-primary-hover">
                        Generate
                    </button>
                    <CopyButton textToCopy={formattedUuids} />
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default UuidGenerator;
