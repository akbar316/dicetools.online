import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

const AiLoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-primary"></div>
    </div>
);

const RomanNumeralConverter: React.FC = () => {
    const [number, setNumber] = useState('1999');
    const [roman, setRoman] = useState('MCMXCIX');
    const [error, setError] = useState('');
    const [funFact, setFunFact] = useState('');
    const [loadingFact, setLoadingFact] = useState(false);

    const toRoman = (num: number): string => {
        if (num < 1 || num > 3999) return 'Number must be between 1 and 3999';
        const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
        const syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
        let result = "";
        for (let i = 0; i < val.length; i++) {
            while (num >= val[i]) {
                result += syb[i];
                num -= val[i];
            }
        }
        return result;
    };
    
    const romanRegex = /^(M{0,3})(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

    const fromRoman = (str: string): number | string => {
        if (!romanRegex.test(str)) return 'Invalid Roman numeral format';
        const map: { [key: string]: number } = {M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1};
        let result = 0;
        for (let i = 0; i < str.length; i++) {
            const current = map[str[i]];
            const next = map[str[i + 1]];
            if (current < next) {
                result += next - current;
                i++;
            } else {
                result += current;
            }
        }
        return isNaN(result) ? 'Invalid Roman numeral' : result;
    }

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setError('');
        setFunFact('');
        setNumber(val);
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
            setRoman(toRoman(num));
        } else {
            setRoman(val === '' ? '' : 'Invalid number');
        }
    };

    const handleRomanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase();
        setError('');
        setFunFact('');
        setRoman(val);
        if (val === '') {
            setNumber('');
        } else {
            const result = fromRoman(val);
            if (typeof result === 'number') {
                setNumber(result.toString());
            } else {
                setNumber('');
                setError(result);
            }
        }
    };
    
    const fetchFunFact = async () => {
        if (!number || isNaN(parseInt(number, 10))) return;
        setLoadingFact(true);
        setFunFact('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Tell me a brief, interesting historical fact about the number ${number} or its Roman numeral representation ${roman}.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setFunFact(response.text);
        } catch(e: any) {
            setFunFact(`Could not fetch fact: ${e.message}`);
        } finally {
            setLoadingFact(false);
        }
    };
    
    const longDescription = (
      <>
        <p>
          Journey back in time with our Advanced Roman Numeral Converter. This tool is perfect for students, history buffs, and anyone curious about the ancient system of numbering. Our converter offers seamless, two-way conversion: type in a standard number, and it instantly generates the correct Roman numeral, or type a Roman numeral, and it converts it back to a number. The tool includes built-in validation to help you write valid Roman numerals and prevents conversions for numbers outside the standard range (1 to 3999). It's an educational and easy-to-use utility for any task involving Roman numerals.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Discover History with AI Fun Facts</h3>
        <p>
          What makes our converter truly special is the integrated AI-powered "Fun Fact" feature. After converting a number, click the "Show Fun Fact" button to receive an interesting piece of historical trivia related to that specific year or number. This unique feature transforms a simple conversion tool into an engaging learning experience, providing context and making history come alive. Whether you're converting a birth year, a famous historical date, or a random number, you can discover fascinating tidbits about its significance in the past, making this more than just a converter—it's a gateway to historical knowledge.
        </p>
      </>
    );

    return (
        <ToolPageLayout
            title="Advanced Roman Numeral Converter"
            description="Convert numbers to and from Roman numerals with validation and AI-powered fun facts."
            longDescription={longDescription}
        >
            <div className="max-w-md mx-auto space-y-4">
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Number (1-3999)</label>
                    <input
                        type="number"
                        value={number}
                        onChange={handleNumberChange}
                        placeholder="Enter number"
                        className="w-full p-2 bg-brand-bg border border-brand-border rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Roman Numeral</label>
                    <input
                        type="text"
                        value={roman}
                        onChange={handleRomanChange}
                        placeholder="Enter Roman numeral"
                        className="w-full p-2 bg-brand-bg border border-brand-border rounded-md uppercase"
                    />
                </div>
                {error && <p className="text-red-500 text-center">{error}</p>}

                 <div className="pt-2 text-center">
                    <button onClick={fetchFunFact} disabled={loadingFact || !number} className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-primary-hover disabled:bg-gray-500">
                        {loadingFact ? <AiLoadingSpinner /> : 'Show Fun Fact'}
                    </button>
                </div>
                {funFact && (
                    <div className="bg-brand-bg p-4 rounded-md text-center text-sm animate-fade-in-up">
                        <p className="font-bold text-brand-primary mb-2">Did you know?</p>
                        <p>{funFact}</p>
                    </div>
                )}
            </div>
        </ToolPageLayout>
    );
};

export default RomanNumeralConverter;