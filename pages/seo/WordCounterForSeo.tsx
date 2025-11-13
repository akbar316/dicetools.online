import React, { useState, useMemo } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

interface DensityResult {
    keyword: string;
    count: number;
    density: string;
}

const WordCounterForSeo: React.FC = () => {
    const [text, setText] = useState('');
    const [densityResults, setDensityResults] = useState<DensityResult[]>([]);

    const stats = useMemo(() => {
        if (!text.trim()) {
            return { words: 0, characters: 0, sentences: 0 };
        }
        const words = text.match(/\b\w+\b/g)?.length || 0;
        const characters = text.length;
        const sentences = text.match(/[^.!?]+[.!?]+/g)?.length || 0;
        return { words, characters, sentences };
    }, [text]);

    const calculateDensity = () => {
        const words = text.toLowerCase().match(/\b\w+\b/g);
        if (!words) {
            setDensityResults([]);
            return;
        }

        const wordCount = words.length;
        const freqMap: { [key: string]: number } = {};
        for (const word of words) {
            freqMap[word] = (freqMap[word] || 0) + 1;
        }

        const sortedKeywords = Object.entries(freqMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10

        const results = sortedKeywords.map(([keyword, count]) => ({
            keyword,
            count,
            density: ((count / wordCount) * 100).toFixed(2) + '%',
        }));
        setDensityResults(results);
    };

    return (
        <ToolPageLayout
            title="Word Counter for SEO"
            description="Analyze your text for word count, character count, and keyword density."
        >
            <div className="space-y-6">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your content here to analyze..."
                    className="w-full h-64 p-4 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <StatCard label="Words" value={stats.words} />
                    <StatCard label="Characters" value={stats.characters} />
                    <StatCard label="Sentences" value={stats.sentences} />
                </div>
                <div>
                    <button onClick={calculateDensity} className="w-full bg-brand-primary text-white py-2 rounded-md hover:bg-brand-primary-hover transition-colors">
                        Calculate Keyword Density
                    </button>
                </div>
                {densityResults.length > 0 && (
                     <div className="overflow-x-auto bg-brand-bg rounded-lg">
                        <table className="w-full text-left">
                            <thead className="bg-brand-surface text-sm text-brand-text-secondary">
                                <tr>
                                    <th className="p-3">Keyword</th>
                                    <th className="p-3 text-right">Count</th>
                                    <th className="p-3 text-right">Density</th>
                                </tr>
                            </thead>
                            <tbody>
                                {densityResults.map((res, index) => (
                                    <tr key={index} className="border-t border-brand-border">
                                        <td className="p-3">{res.keyword}</td>
                                        <td className="p-3 text-right">{res.count}</td>
                                        <td className="p-3 text-right">{res.density}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </ToolPageLayout>
    );
};

const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="bg-brand-bg p-4 rounded-md">
        <div className="text-2xl font-bold text-brand-primary">{value.toLocaleString()}</div>
        <div className="text-sm text-brand-text-secondary">{label}</div>
    </div>
);

export default WordCounterForSeo;