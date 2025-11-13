import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

// Updated interface to allow for missing data
interface IpInfo {
    ip: string;
    hostname: string;
    city: string;
    region: string;
    country: string;
    postal: string;
    latitude: number | null;
    longitude: number | null;
    timezone: string;
    isp: string;
    asn: string;
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
        <span>Looking up...</span>
    </div>
);

const IpInfoLookup: React.FC = () => {
    const [ip, setIp] = useState('8.8.8.8');
    const [info, setInfo] = useState<IpInfo | null>(null);
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const lookup = async () => {
        if (!ip.trim()) {
            setError('Please enter an IP address.');
            return;
        }
        setLoading(true);
        setError('');
        setInfo(null);
        setSources([]);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as an expert IP geolocation lookup service. Using Google Search, find and provide the most accurate information possible for the IP address "${ip}".

Your response MUST be a single JSON object. Do not include any text before or after the JSON object.

The JSON object should have the following structure:
- "ip": The IP address that was looked up.
- "hostname": The hostname associated with the IP. Use "N/A" if not found.
- "city": The city. Use "N/A" if not found.
- "region": The state or region. Use "N/A" if not found.
- "country": The country. Use "N/A" if not found.
- "postal": The postal code. Use "N/A" if not found.
- "latitude": The latitude (number). Use null if not found.
- "longitude": The longitude (number). Use null if not found.
- "timezone": The timezone (e.g., "America/New_York"). Use "N/A" if not found.
- "isp": The Internet Service Provider. Use "N/A" if not found.
- "asn": The Autonomous System Number and organization. Use "N/A" if not found.

If any piece of information cannot be found through the search, use "N/A" for strings or null for numbers.`;

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
                const result = JSON.parse(jsonString);
                setInfo(result);
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
            title="IP Info Lookup"
            description="Get accurate, AI-powered geolocation information for any IP address."
        >
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex">
                    <input 
                        type="text" 
                        value={ip} 
                        onChange={e => setIp(e.target.value)} 
                        className="w-full p-3 bg-brand-bg border border-brand-border rounded-l-md text-lg" 
                        placeholder="Enter IP Address"
                        disabled={loading} 
                    />
                    <button 
                        onClick={lookup} 
                        disabled={loading}
                        className="bg-brand-primary text-white px-6 rounded-r-md font-semibold hover:bg-brand-primary-hover disabled:bg-gray-500"
                    >
                        {loading ? <AiLoadingSpinner /> : 'Lookup'}
                    </button>
                </div>

                {error && <p className="text-red-500 text-center">{error}</p>}
                
                {loading && (
                    <div className="flex flex-col justify-center items-center h-64 text-brand-text-secondary">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mb-4"></div>
                        <p>Researching with Google Search...</p>
                    </div>
                )}

                {info && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Location Info */}
                            <div className="bg-brand-bg p-4 rounded-lg space-y-2">
                                <h3 className="font-semibold text-brand-primary text-lg">Location</h3>
                                <InfoRow label="IP Address" value={info.ip} />
                                <InfoRow label="City" value={info.city} />
                                <InfoRow label="Region" value={info.region} />
                                <InfoRow label="Country" value={info.country} />
                                <InfoRow label="Postal Code" value={info.postal} />
                            </div>
                            {/* Network Info */}
                            <div className="bg-brand-bg p-4 rounded-lg space-y-2">
                                <h3 className="font-semibold text-brand-primary text-lg">Network</h3>
                                <InfoRow label="Hostname" value={info.hostname} />
                                <InfoRow label="ISP" value={info.isp} />
                                <InfoRow label="ASN" value={info.asn} />
                                <InfoRow label="Timezone" value={info.timezone} />
                            </div>
                        </div>
                        {/* Geolocation */}
                        <div className="bg-brand-bg p-4 rounded-lg">
                            <h3 className="font-semibold text-brand-primary text-lg mb-2">Geolocation</h3>
                            <div className="flex justify-between items-center">
                                <div>
                                    <InfoRow label="Latitude" value={info.latitude !== null ? info.latitude.toString() : 'N/A'} />
                                    <InfoRow label="Longitude" value={info.longitude !== null ? info.longitude.toString() : 'N/A'} />
                                </div>
                                {info.latitude !== null && info.longitude !== null && (
                                    <a
                                        href={`https://www.google.com/maps?q=${info.latitude},${info.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-brand-surface hover:bg-brand-border text-brand-text-primary font-semibold px-4 py-2 rounded-md transition-colors"
                                    >
                                        View on Map
                                    </a>
                                )}
                            </div>
                        </div>
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
                 <p className="text-xs text-center text-brand-text-secondary">Note: Geolocation data is retrieved by an AI using Google Search and may have limitations.</p>
            </div>
        </ToolPageLayout>
    );
};

const InfoRow: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div className="flex text-sm">
        <span className="w-28 font-semibold text-brand-text-secondary">{label}:</span>
        <span className="text-brand-text-primary break-all">{value}</span>
    </div>
);

export default IpInfoLookup;