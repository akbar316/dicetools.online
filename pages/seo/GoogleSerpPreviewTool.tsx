import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';
import { GoogleGenAI, Type } from '@google/genai';

interface AnalysisItem {
    factor: string;
    status: 'Good' | 'Needs Improvement' | 'Missing';
    recommendation: string;
}

const AiLoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>Analyzing...</span>
    </div>
);

const SerpPreview: React.FC<{ title: string; description: string; url: string }> = ({ title, description, url }) => (
    <div className="p-4 bg-white dark:bg-brand-bg rounded-lg border border-brand-border font-sans">
        <p className="text-sm text-gray-700 dark:text-brand-text-secondary truncate">{url || 'https://www.example.com/page-path'}</p>
        <h3 className="text-blue-600 dark:text-blue-500 text-xl truncate hover:underline cursor-pointer">{title || 'Your SEO Title Will Appear Here'}</h3>
        <p className="text-sm text-gray-600 dark:text-brand-text-secondary">{description || 'This is how your meta description will look in the Google search results. Make it count!'}</p>
    </div>
);

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
    if (status === 'Good') return <span className="text-green-500">✔</span>;
    if (status === 'Needs Improvement') return <span className="text-yellow-500">!</span>;
    if (status === 'Missing') return <span className="text-red-500">✖</span>;
    return null;
};


const GoogleSerpPreviewTool: React.FC = () => {
    const [title, setTitle] = useState('DiceTools | The Best Free Online Tools');
    const [description, setDescription] = useState('A powerful suite of 80+ free online tools for text manipulation, data conversion, development, AI, PDF editing, and more.');
    const [url, setUrl] = useState('https://dicetools.com');
    const [focusKeyword, setFocusKeyword] = useState('free online tools');

    const [analysis, setAnalysis] = useState<AnalysisItem[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!title.trim() || !description.trim() || !focusKeyword.trim()) {
            setError('Please fill in the Title, Description, and Focus Keyword fields.');
            return;
        }
        setLoading(true);
        setError('');
        setAnalysis(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as an expert SEO copywriter. Analyze the provided URL, Title, Description, and Focus Keyword for their effectiveness on a Google Search Engine Results Page (SERP).

- URL: "${url}"
- Focus Keyword: "${focusKeyword}"
- Title: "${title}"
- Description: "${description}"

Provide a detailed analysis. For each factor, provide a status ('Good', 'Needs Improvement', or 'Missing') and a detailed, actionable recommendation explaining the status and providing specific advice on how to improve it.

Analyze at least these factors: Title Length, Description Length, Keyword in Title, Keyword in Description, Compelling Language (does it encourage clicks?), and Call-to-Action (does the description have a CTA?).`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
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
                        required: ['checklist'],
                    },
                },
            });
            const result = JSON.parse(response.text);
            setAnalysis(result.checklist);

        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ToolPageLayout
            title="AI Google SERP Preview & Optimizer"
            description="Preview your SERP snippet and get AI-powered recommendations to improve it."
        >
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">URL</label>
                            <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Focus Keyword</label>
                            <input type="text" value={focusKeyword} onChange={e => setFocusKeyword(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md" />
                        </div>
                        <div>
                            <label className="flex justify-between text-sm font-medium text-brand-text-secondary mb-1">
                                <span>Title</span>
                                <span className={title.length > 60 ? 'text-red-500' : ''}>{title.length} / 60 characters</span>
                            </label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md" />
                        </div>
                        <div>
                            <label className="flex justify-between text-sm font-medium text-brand-text-secondary mb-1">
                                <span>Description</span>
                                <span className={description.length > 160 ? 'text-red-500' : ''}>{description.length} / 160 characters</span>
                            </label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-brand-text-primary">Live Preview</h3>
                        <SerpPreview title={title} description={description} url={url} />
                        <button onClick={handleAnalyze} disabled={loading} className="w-full bg-brand-primary text-white py-2 rounded-md hover:bg-brand-primary-hover disabled:bg-gray-500 font-semibold">
                            {loading ? <AiLoadingSpinner /> : 'Analyze with AI'}
                        </button>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    </div>
                </div>

                {analysis && (
                    <div className="space-y-4 animate-fade-in-up">
                        <h2 className="text-2xl font-bold text-center">AI Analysis & Recommendations</h2>
                        {analysis.map((item, index) => (
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
                )}
            </div>
        </ToolPageLayout>
    );
};

export default GoogleSerpPreviewTool;