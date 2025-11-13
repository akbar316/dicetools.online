import React, { useState, useMemo } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';
import { GoogleGenAI, Type } from '@google/genai';

interface KeywordResult {
    keyword: string;
    intent: 'Informational' | 'Navigational' | 'Commercial' | 'Transactional';
    volume: number;
    difficulty: number; // 0-100 scale
    cpc: number; // Cost Per Click
}

interface AnalysisResults {
    relatedKeywords: KeywordResult[];
    questions: KeywordResult[];
}

const AiLoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>Researching...</span>
    </div>
);

const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 29) return 'bg-green-500'; // Very Easy
    if (difficulty <= 49) return 'bg-yellow-500'; // Easy
    if (difficulty <= 69) return 'bg-orange-500'; // Medium
    return 'bg-red-500'; // Hard
};

const getIntentBadge = (intent: string) => {
    switch (intent) {
        case 'Informational': return 'bg-blue-500/20 text-blue-400';
        case 'Navigational': return 'bg-purple-500/20 text-purple-400';
        case 'Commercial': return 'bg-yellow-500/20 text-yellow-400';
        case 'Transactional': return 'bg-green-500/20 text-green-400';
        default: return 'bg-gray-500/20 text-gray-400';
    }
}

const KeywordTable: React.FC<{ keywords: KeywordResult[] }> = ({ keywords }) => (
    <div className="overflow-x-auto bg-brand-bg rounded-lg">
        <table className="w-full text-left">
            <thead className="bg-brand-surface text-sm text-brand-text-secondary">
                <tr>
                    <th className="p-3">Keyword</th>
                    <th className="p-3">Intent</th>
                    <th className="p-3 text-right">Volume</th>
                    <th className="p-3">Difficulty</th>
                    <th className="p-3 text-right">CPC (USD)</th>
                </tr>
            </thead>
            <tbody>
                {keywords.map((res, index) => (
                    <tr key={index} className="border-t border-brand-border">
                        <td className="p-3 font-semibold">{res.keyword}</td>
                        <td className="p-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${getIntentBadge(res.intent)}`}>
                                {res.intent}
                            </span>
                        </td>
                        <td className="p-3 text-right">{res.volume.toLocaleString()}</td>
                        <td className="p-3">
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${getDifficultyColor(res.difficulty)}`}></span>
                                <span>{res.difficulty}</span>
                            </div>
                        </td>
                        <td className="p-3 text-right">${res.cpc.toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


const KeywordResearchTool: React.FC = () => {
    const [seedKeyword, setSeedKeyword] = useState('free online tools');
    const [results, setResults] = useState<AnalysisResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'related' | 'questions'>('related');

    const handleSearch = async () => {
        if (!seedKeyword.trim()) {
            setError('Please enter a keyword to research.');
            return;
        }
        setLoading(true);
        setError('');
        setResults(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const prompt = `Act as an expert SEO keyword research tool. For the seed keyword "${seedKeyword}", generate two lists:
1.  'relatedKeywords': A list of 15 diverse, related keywords (long-tail, short-tail, semantic variations).
2.  'questions': A list of 10 popular questions people ask related to the seed keyword.

For each keyword in both lists, provide the following details:
-   keyword: The keyword phrase itself.
-   intent: The searcher's likely intent ('Informational', 'Navigational', 'Commercial', 'Transactional').
-   volume: A fictional but realistic monthly search volume (integer).
-   difficulty: A keyword difficulty score from 0-100 (integer), where higher is harder.
-   cpc: A fictional but realistic Cost Per Click value in USD (float).`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            relatedKeywords: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        keyword: { type: Type.STRING },
                                        intent: { type: Type.STRING, enum: ['Informational', 'Navigational', 'Commercial', 'Transactional'] },
                                        volume: { type: Type.NUMBER },
                                        difficulty: { type: Type.NUMBER },
                                        cpc: { type: Type.NUMBER },
                                    },
                                    required: ['keyword', 'intent', 'volume', 'difficulty', 'cpc'],
                                },
                            },
                            questions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        keyword: { type: Type.STRING },
                                        intent: { type: Type.STRING, enum: ['Informational', 'Navigational', 'Commercial', 'Transactional'] },
                                        volume: { type: Type.NUMBER },
                                        difficulty: { type: Type.NUMBER },
                                        cpc: { type: Type.NUMBER },
                                    },
                                    required: ['keyword', 'intent', 'volume', 'difficulty', 'cpc'],
                                },
                            },
                        },
                        required: ['relatedKeywords', 'questions'],
                    },
                },
            });

            const jsonResponse = JSON.parse(response.text);
            setResults(jsonResponse);
            setActiveTab('related');

        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };
    
    const keywordsToCopy = useMemo(() => {
        if (!results) return '';
        const list = activeTab === 'related' ? results.relatedKeywords : results.questions;
        return list.map(item => item.keyword).join('\n');
    }, [results, activeTab]);

    return (
        <ToolPageLayout
            title="Advanced Keyword Research Tool"
            description="Get AI-driven insights including search intent, difficulty, volume, and CPC."
        >
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={seedKeyword}
                        onChange={(e) => setSeedKeyword(e.target.value)}
                        placeholder="Enter your main keyword..."
                        className="flex-grow p-3 bg-brand-bg border border-brand-border rounded-md text-lg"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-brand-primary text-white px-8 py-3 rounded-md hover:bg-brand-primary-hover transition-colors disabled:bg-gray-500 font-semibold"
                    >
                        {loading ? <AiLoadingSpinner /> : 'Research Keywords'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-center">{error}</p>}

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
                    </div>
                ) : results && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="p-4 bg-brand-bg rounded-lg text-center">
                            Found <span className="font-bold text-brand-primary">{results.relatedKeywords.length}</span> related keywords and <span className="font-bold text-brand-primary">{results.questions.length}</span> questions for "{seedKeyword}".
                        </div>
                        <div className="flex border-b border-brand-border">
                            <button onClick={() => setActiveTab('related')} className={`px-4 py-2 font-semibold ${activeTab === 'related' ? 'border-b-2 border-brand-primary text-brand-text-primary' : 'text-brand-text-secondary'}`}>
                                Related Keywords
                            </button>
                            <button onClick={() => setActiveTab('questions')} className={`px-4 py-2 font-semibold ${activeTab === 'questions' ? 'border-b-2 border-brand-primary text-brand-text-primary' : 'text-brand-text-secondary'}`}>
                                Questions People Ask
                            </button>
                            <div className="flex-grow" />
                            <CopyButton textToCopy={keywordsToCopy} />
                        </div>
                        
                        {activeTab === 'related' && <KeywordTable keywords={results.relatedKeywords} />}
                        {activeTab === 'questions' && <KeywordTable keywords={results.questions} />}
                    </div>
                )}
            </div>
        </ToolPageLayout>
    );
};

export default KeywordResearchTool;