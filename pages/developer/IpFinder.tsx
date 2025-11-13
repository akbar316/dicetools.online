import React, { useState, useEffect } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

interface IpInfo { ip: string; city: string; region: string; country: string; isp: string; }

const AiLoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>Looking up...</span>
    </div>
);

const IpFinder: React.FC = () => {
    const [info, setInfo] = useState<IpInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const findIp = async () => {
            setLoading(true);
            setError('');
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                const prompt = `Using Google Search, what is my current IP address and its associated location (city, region, country) and ISP? Provide the response as a single JSON object with keys "ip", "city", "region", "country", and "isp". Do not include any text before or after the JSON object.`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: prompt,
                    config: { tools: [{ googleSearch: {} }] },
                });

                const jsonString = response.text.match(/\{[\s\S]*\}/)?.[0];
                if (!jsonString) throw new Error("AI did not return a valid JSON object.");
                setInfo(JSON.parse(jsonString));
            } catch (e: any) {
                setError(`Failed to look up IP: ${e.message}`);
                setInfo({ip: '8.8.8.8', city: 'Mountain View', region: 'CA', country: 'US', isp: 'Google LLC'});
            } finally {
                setLoading(false);
            }
        };
        findIp();
    }, []);

    return (
        <ToolPageLayout
            title="My IP Address Finder"
            description="Find your public IP address and location details using AI-powered search."
        >
            <div className="text-center space-y-6">
                {loading ? (
                    <div className="flex justify-center items-center h-40"><AiLoadingSpinner /></div>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : info ? (
                    <>
                        <p className="text-brand-text-secondary">Your Public IP Address is:</p>
                        <div className="text-4xl font-bold bg-brand-bg p-4 rounded-md text-brand-primary">{info.ip}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                            <InfoCard label="City" value={info.city} />
                            <InfoCard label="Region" value={info.region} />
                            <InfoCard label="Country" value={info.country} />
                            <InfoCard label="ISP" value={info.isp} />
                        </div>
                    </>
                ) : null}
            </div>
        </ToolPageLayout>
    );
};

const InfoCard: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div className="bg-brand-bg p-4 rounded-lg">
        <p className="text-sm text-brand-text-secondary">{label}</p>
        <p className="font-semibold text-lg">{value}</p>
    </div>
);

export default IpFinder;
