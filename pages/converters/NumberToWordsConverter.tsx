import React, { useState } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

type Format = 'standard' | 'ordinal' | 'currency';
const languages = ['English', 'Spanish', 'French', 'German', 'Mandarin Chinese'];

const AiLoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>Converting...</span>
    </div>
);

const NumberToWordsConverter: React.FC = () => {
    const [number, setNumber] = useState<string>('1234.56');
    const [words, setWords] = useState<string>('');
    const [format, setFormat] = useState<Format>('standard');
    const [language, setLanguage] = useState('English');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const convertToWords = async () => {
        if (!number.trim()) {
            setError('Please enter a number.');
            return;
        }
        setLoading(true);
        setError('');
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            let prompt = `Convert the number "${number}" into words. `;
            
            if (language !== 'English') {
                prompt += `The output language must be ${language}. `;
            }

            switch(format) {
                case 'ordinal':
                    prompt += 'Format the output as an ordinal number (e.g., "one hundred twenty-third"). ';
                    break;
                case 'currency':
                    prompt += 'Format the output as USD currency (e.g., "one thousand two hundred thirty-four dollars and fifty-six cents"). ';
                    break;
                case 'standard':
                default:
                     prompt += 'Format the output as a standard cardinal number. ';
                     break;
            }

            prompt += 'Return only the converted words and nothing else.';

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setWords(response.text.trim());

        } catch (e: any) {
            setError(`An error occurred: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const longDescription = (
      <>
        <p>
          Transform digits into descriptive text with our Advanced Number to Words Converter. Powered by artificial intelligence, this tool goes beyond simple conversions, offering unparalleled flexibility for various contexts. It's an essential utility for financial professionals writing checks, educators teaching number concepts, and writers who need to spell out numbers in formal documents. Simply input any number, select your desired language and format, and let the AI provide an accurate and well-formatted text representation. This tool handles both integers and decimals with ease, making it a comprehensive solution for any number-to-text conversion need.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Flexible Formatting and Multilingual Support</h3>
        <p>
          Our converter is designed to adapt to your specific requirements, providing accurate output for both common and specialized use cases across several major languages.
        </p>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li><strong>Multiple Formats:</strong> Choose between standard cardinal numbers (e.g., "one hundred twenty-three"), ordinal numbers (e.g., "one hundred twenty-third"), and currency format (e.g., "one hundred twenty-three dollars and forty-five cents").</li>
          <li><strong>Multilingual Conversions:</strong> Get accurate translations in English, Spanish, French, German, and Mandarin Chinese, perfect for international documents.</li>
          <li><strong>AI-Powered Accuracy:</strong> By leveraging a powerful language model, the tool correctly handles complex numbers, grammatical rules, and formatting nuances for each language and format.</li>
        </ul>
      </>
    );
    
    return (
        <ToolPageLayout
            title="Advanced Number to Words Converter"
            description="Convert numbers to words, ordinals, or currency in multiple languages using AI."
            longDescription={longDescription}
        >
            <div className="max-w-xl mx-auto space-y-4">
                <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Enter a number..."
                    className="w-full p-3 bg-brand-bg border border-brand-border rounded-md text-lg"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                         <label className="block text-sm font-medium text-brand-text-secondary mb-1">Language</label>
                         <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md">
                            {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                         </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-brand-text-secondary mb-1">Output Format</label>
                         <select value={format} onChange={e => setFormat(e.target.value as Format)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md">
                            <option value="standard">Standard</option>
                            <option value="ordinal">Ordinal (e.g., 1st, 2nd)</option>
                            <option value="currency">Currency (USD)</option>
                         </select>
                    </div>
                </div>

                <button
                    onClick={convertToWords}
                    disabled={loading}
                    className="w-full bg-brand-primary text-white py-2 rounded-md hover:bg-brand-primary-hover transition-colors disabled:bg-gray-500"
                >
                    {loading ? <AiLoadingSpinner /> : 'Convert with AI'}
                </button>
                {error && <p className="text-red-500 text-center">{error}</p>}

                <div className="p-4 bg-brand-bg border border-brand-border rounded-md min-h-[6rem]">
                    <p className="text-lg capitalize">{words}</p>
                </div>
                 <div className="flex justify-end">
                    <CopyButton textToCopy={words} />
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default NumberToWordsConverter;