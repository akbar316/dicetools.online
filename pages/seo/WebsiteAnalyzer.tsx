import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';
import { GoogleGenAI, Type } from '@google/genai';

interface AnalysisResult {
    score: number;
    checklist: {
        factor: string;
        status: 'Good' | 'Needs Improvement' | 'Missing';
        recommendation: string;
    }[];
}

const AiLoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>Analyzing...</span>
    </div>
);

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (score / 100) * circumference;
    const colorClass = score > 80 ? 'text-green-400' : score > 50 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg className="w-40 h-40">
                <circle className="text-brand-surface" strokeWidth="10" stroke="currentColor" fill="transparent" r="50" cx="70" cy="70" />
                <circle
                    className={`${colorClass} transition-all duration-1000 ease-out`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="50"
                    cx="70"
                    cy="70"
                    transform="rotate(-90 70 70)"
                />
            </svg>
            <span className={`absolute text-4xl font-bold ${colorClass}`}>{score}</span>
        </div>
    );
};

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
    if (status === 'Good') return <span className="text-green-500">✔</span>;
    if (status === 'Needs Improvement') return <span className="text-yellow-500">!</span>;
    if (status === 'Missing') return <span className="text-red-500">✖</span>;
    return null;
};

const WebsiteAnalyzer: React.FC = () => {
    const [url, setUrl] = useState('https://dicetools.com');
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!url.trim()) {
            setError('Please enter a website URL.');
            return;
        }
        setLoading(true);
        setError('');
        setAnalysis(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as an expert on-page SEO auditor. For the conceptual website at "${url}", perform a detailed SEO analysis based on common best practices. You cannot access the live URL, so make reasonable assumptions.

Provide an overall SEO score from 0 to 100. Then, detail the status of these key factors: 'Title Tag', 'Meta Description', 'H1 Tag', 'Header Structure (H2s, H3s)', 'Image Alt Text', and 'Page Load Speed (Conceptual)'.

For each factor, provide a status ('Good', 'Needs Improvement', or 'Missing') and a **detailed, actionable recommendation**. The recommendation should be a multi-sentence explanation or a bulleted list of specific steps to improve this factor. Use newline characters (\n) for formatting bullet points if needed.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            score: { type: Type.NUMBER },
                            checklist: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        factor: { type: Type.STRING },
                                        status: { type: Type.STRING, enum: ['Good', 'Needs Improvement', 'Missing'] },
                                        recommendation: { type: Type.STRING },
                                    },
                                    required: ['factor', 'status', 'recommendation'],
                                },
                            },
                        },
                        required: ['score', 'checklist'],
                    },
                },
            });
            const result = JSON.parse(response.text);
            setAnalysis(result);

        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ToolPageLayout
            title="Website SEO Analyzer"
            description="Get an AI-powered SEO score and optimization report for your website."
        >
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.example.com"
                        className="flex-grow p-3 bg-brand-bg border border-brand-border rounded-md text-lg"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="bg-brand-primary text-white px-8 py-3 rounded-md hover:bg-brand-primary-hover transition-colors disabled:bg-gray-500 font-semibold"
                    >
                        {loading ? <AiLoadingSpinner /> : 'Analyze Website'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-center">{error}</p>}
                
                {loading && (
                    <div className="flex justify-center items-center h-64">
                         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
                    </div>
                )}

                {analysis && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        <div className="md:col-span-1 text-center bg-brand-bg p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-brand-text-secondary mb-2">Overall SEO Score</h3>
                            <ScoreCircle score={analysis.score} />
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            {analysis.checklist.map((item, index) => (
                                <div key={index} className="bg-brand-bg p-4 rounded-lg">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <StatusIcon status={item.status} />
                                        <span>{item.factor}</span>
                                        <span className="ml-auto text-xs px-2 py-1 rounded-full bg-brand-surface">{item.status}</span>
                                    </h4>
                                    <p className="text-sm text-brand-text-secondary mt-1 pl-6 whitespace-pre-wrap">{item.recommendation}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ToolPageLayout>
    );
};

export default WebsiteAnalyzer;