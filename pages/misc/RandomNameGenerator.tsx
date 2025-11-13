import React, { useState, useEffect } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

const AiLoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2 text-white">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>Generating...</span>
    </div>
);

const RandomNameGenerator: React.FC = () => {
    const [name, setName] = useState('');
    const [gender, setGender] = useState('Any');
    const [country, setCountry] = useState('Any');
    const [religion, setReligion] = useState('Any');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const genders = ['Any', 'Male', 'Female'];
    const countries = ['Any', 'USA', 'UK', 'India', 'Japan', 'Nigeria', 'Brazil', 'Germany', 'Egypt', 'Russia', 'China', 'Mexico'];
    const religions = ['Any', 'Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Judaism', 'Sikhism', 'Atheist/Agnostic'];

    const generateName = async () => {
        setLoading(true);
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            let prompt = `Generate a single, culturally plausible full name (first and last).`;
            if (gender !== 'Any') {
                prompt += ` The name should be for a ${gender.toLowerCase()} person.`;
            }
            if (country !== 'Any') {
                prompt += ` The name should be ethnically and culturally appropriate for someone from ${country}.`;
            }
            if (religion !== 'Any' && religion !== 'Atheist/Agnostic') {
                prompt += ` The name should be plausibly associated with the ${religion} faith.`;
            }
            if (religion === 'Atheist/Agnostic') {
                 prompt += ` The name should sound secular or neutral, not strongly associated with any particular religion.`
            }
            prompt += ' Return ONLY the full name and nothing else. Do not add any labels or extra text.';
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setName(response.text.trim());

        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message || 'Please try again.'}`);
            setName(''); // Clear name on error
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        generateName();
    }, []); // Generate one name on initial load with default settings

    return (
        <ToolPageLayout
            title="Advanced Random Name Generator"
            description="Generate random names based on gender, country, and religion using AI."
        >
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-brand-bg rounded-lg">
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Gender</label>
                        <select value={gender} onChange={e => setGender(e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md">
                            {genders.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Country / Ethnicity</label>
                        <select value={country} onChange={e => setCountry(e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md">
                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Religious Context</label>
                        <select value={religion} onChange={e => setReligion(e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md">
                            {religions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                <div className="text-4xl font-bold bg-brand-surface p-6 rounded-md w-full text-center min-h-[5rem] flex items-center justify-center">
                    {loading ? '...' : (name || '...')}
                </div>

                {error && <p className="text-red-500 text-center">{error}</p>}

                 <div className="flex justify-center gap-4">
                    <button 
                        onClick={generateName} 
                        disabled={loading}
                        className="bg-brand-primary text-white px-8 py-3 rounded-md hover:bg-brand-primary-hover font-semibold text-lg disabled:bg-gray-500 w-64"
                    >
                        {loading ? <AiLoadingSpinner /> : 'Generate New Name'}
                    </button>
                    <CopyButton textToCopy={name} />
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default RandomNameGenerator;
