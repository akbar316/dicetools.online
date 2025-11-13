import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

interface BrokenLink {
    linkUrl: string;
    status: string; // "Broken (404 Not Found)", "Server Error (5xx)", "Likely Outdated Content"
    sourcePage: string;
    anchorText: string;
}

interface AnalysisResult {
    brokenLinks: BrokenLink[];
}

interface GroundingChunk {
    web: {
        uri: string;
        title: string;
    };
}

const AiLoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>Scanning...</span>
    </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    let colorClass = 'bg-gray-500/20 text-gray-300';
    if (status.includes('404')) {
        colorClass = 'bg-red-500/20 text-red-300';
    } else if (status.includes('5xx')) {
        colorClass = 'bg-orange-500/20 text-orange-300';
    } else if (status.toLowerCase().includes('outdated')) {
        colorClass = 'bg-yellow-500/20 text-yellow-300';
    }
    
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
            {status}
        </span>
    );
};

const BrokenLinkChecker: React.FC = () => {
    const [url, setUrl] = useState('https://dicetools.com');
    const [results, setResults] = useState<AnalysisResult | null>(null);
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleScan = async () => {
        if (!url.trim()) {
            setError('Please enter a website URL to scan.');
            return;
        }
        setLoading(true);
        setError('');
        setResults(null);
        setSources([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as an expert SEO tool specializing in finding broken links. Using Google Search, investigate the domain "${url}" for any signs of broken links, 404 pages, or outdated content that might lead to a poor user experience.

Your response MUST be a single JSON object with the key "brokenLinks", which is an array of objects. Do not include any text before or after the JSON object. Return up to 10 potential broken links.

Each object in the "brokenLinks" array should represent a potentially broken link and have the following structure:
- "linkUrl": The full URL of the potentially broken or outdated link.
- "status": A descriptive string of the conceptual status (e.g., "Broken (404 Not Found)", "Server Error (5xx)", "Likely Outdated Content").
- "sourcePage": The URL of the page on the target domain where this broken link is likely located.
- "anchorText": The anchor text associated with the broken link.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

            let jsonString = response.text;
            const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
            if (match) {
                jsonString = match[1];
            }
            
            try {
                const parsedResult = JSON.parse(jsonString);
                setResults(parsedResult);
            } catch (parseError) {
                 console.error("Failed to parse AI response as JSON:", jsonString, parseError);
                setError("The AI returned a response in an unexpected format. Please try again.");
            }

            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (groundingChunks) {
                setSources(groundingChunks.filter((chunk: any) => chunk.web && chunk.web.uri && chunk.web.title));
            }

        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ToolPageLayout
            title="Advanced Broken Link Checker"
            description="Scan a domain for broken or outdated links using Google Search analysis."
        >
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.example.com"
                        className="flex-grow p-3 bg-brand-bg border border-brand-border rounded-md text-lg"
                        disabled={loading}
                    />
                    <button
                        onClick={handleScan}
                        disabled={loading}
                        className="bg-brand-primary text-white px-8 py-3 rounded-md hover:bg-brand-primary-hover transition-colors disabled:bg-gray-500 font-semibold"
                    >
                        {loading ? <AiLoadingSpinner /> : 'Scan for Broken Links'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-center">{error}</p>}
                
                {loading && (
                    <div className="flex flex-col justify-center items-center h-64 text-brand-text-secondary">
                         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mb-4"></div>
                         <p>Scanning for broken links using Google Search...</p>
                    </div>
                )}

                {results && (
                     <div className="space-y-6 animate-fade-in-up">
                        {results.brokenLinks.length > 0 ? (
                            <>
                                <div className="bg-brand-bg p-4 rounded-lg text-center">
                                    Found <span className="font-bold text-brand-primary">{results.brokenLinks.length}</span> potential broken or outdated links.
                                </div>
                                <div className="overflow-x-auto bg-brand-bg rounded-lg">
                                    <table className="w-full text-left">
                                        <thead className="bg-brand-surface text-sm text-brand-text-secondary">
                                            <tr>
                                                <th className="p-3">Broken URL</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3">Anchor Text</th>
                                                <th className="p-3">Source Page</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.brokenLinks.map((res, index) => (
                                                <tr key={index} className="border-t border-brand-border">
                                                    <td className="p-3 text-red-400 truncate max-w-xs">{res.linkUrl}</td>
                                                    <td className="p-3"><StatusBadge status={res.status} /></td>
                                                    <td className="p-3 font-mono truncate max-w-xs">{res.anchorText}</td>
                                                    <td className="p-3 font-mono truncate max-w-xs">{res.sourcePage}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="bg-brand-bg p-8 rounded-lg text-center">
                                <p className="font-semibold text-lg text-green-400">No broken links found!</p>
                                <p className="text-brand-text-secondary mt-2">The AI analysis did not find any potential broken links for this domain.</p>
                            </div>
                        )}
                        
                        {sources.length > 0 && (
                            <div className="bg-brand-bg p-6 rounded-lg">
                                <h4 className="font-semibold text-lg text-brand-primary mb-3">Sources from Google Search</h4>
                                <ul className="list-disc list-inside space-y-2 text-sm max-h-40 overflow-y-auto">
                                    {sources.map((source, i) => (
                                        <li key={i}>
                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{source.web.title}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ToolPageLayout>
    );
};

export default BrokenLinkChecker;
