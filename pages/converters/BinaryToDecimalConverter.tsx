import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

type Base = 'bin' | 'oct' | 'dec' | 'hex';

const baseConfig = {
    bin: { name: 'Binary', base: 2, regex: /^[01]*$/ },
    oct: { name: 'Octal', base: 8, regex: /^[0-7]*$/ },
    dec: { name: 'Decimal', base: 10, regex: /^[0-9]*$/ },
    hex: { name: 'Hexadecimal', base: 16, regex: /^[0-9a-f]*$/i },
};

const AiLoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>Loading...</span>
    </div>
);


const NumberBaseConverter: React.FC = () => {
    const [values, setValues] = useState<Record<Base, string>>({ bin: '', oct: '', dec: '', hex: '' });
    const [error, setError] = useState('');
    const [showSteps, setShowSteps] = useState(false);
    const [stepsContent, setStepsContent] = useState('');
    const [loadingSteps, setLoadingSteps] = useState(false);

    const handleValueChange = (base: Base, value: string) => {
        setError('');
        const config = baseConfig[base];

        if (!config.regex.test(value)) {
            setError(`Invalid ${config.name} value.`);
            setValues(prev => ({...prev, [base]: value}));
            return;
        }

        if (value === '') {
            setValues({ bin: '', oct: '', dec: '', hex: '' });
            return;
        }
        
        try {
            const decimalValue = parseInt(value, config.base);
            if (isNaN(decimalValue)) {
                setValues({ bin: '', oct: '', dec: '', hex: '' });
                return;
            }
            
            setValues({
                bin: decimalValue.toString(2),
                oct: decimalValue.toString(8),
                dec: decimalValue.toString(10),
                hex: decimalValue.toString(16).toUpperCase(),
            });
        } catch(e) {
            setError('Number is too large to convert accurately.');
        }
    };
    
    const fetchConversionSteps = async () => {
        if (!values.dec) return;
        setLoadingSteps(true);
        setStepsContent('');
        setShowSteps(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Provide a clear, step-by-step explanation for converting the decimal number ${values.dec} to binary, octal, and hexadecimal. Use markdown for formatting.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setStepsContent(response.text);

        } catch (e: any) {
            setStepsContent(`An error occurred: ${e.message}`);
        } finally {
            setLoadingSteps(false);
        }
    };
    
    const longDescription = (
      <>
        <p>
          Seamlessly translate numbers between different numeral systems with our Advanced Number Base Converter. This tool is an essential utility for computer science students, programmers, and network engineers who regularly work with binary, octal, decimal, and hexadecimal values. The intuitive interface provides real-time conversions across all four bases simultaneously. Simply enter a value in any of the fields—whether it's a binary string or a hexadecimal code—and the other fields will update instantly with the corresponding values. This live-update functionality makes it incredibly fast and efficient to see how a number is represented across different systems without any extra clicks.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Learn with AI-Powered Explanations</h3>
        <p>
          Go beyond simple conversion and truly understand the process. Our tool integrates a unique AI-powered feature that provides a detailed, step-by-step explanation of how the conversions are performed. Click "Show Steps with AI" to see a clear breakdown of the mathematical process for converting your decimal number to binary, octal, and hexadecimal. This educational feature is perfect for students learning about number bases or for anyone looking to refresh their knowledge.
        </p>
      </>
    );

    return (
        <ToolPageLayout
            title="Advanced Number Base Converter"
            description="Convert between Binary, Octal, Decimal, and Hexadecimal systems."
            longDescription={longDescription}
        >
            <div className="max-w-xl mx-auto space-y-4">
                {(Object.keys(baseConfig) as Base[]).map(base => (
                    <div key={base}>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">{baseConfig[base].name}</label>
                        <input
                            type="text"
                            value={values[base]}
                            onChange={(e) => handleValueChange(base, e.target.value)}
                            className="w-full p-2 bg-brand-bg border border-brand-border rounded-md font-mono"
                        />
                    </div>
                ))}
                {error && <p className="text-red-500 text-center">{error}</p>}
                
                <div className="pt-4 text-center">
                    <button onClick={fetchConversionSteps} disabled={!values.dec} className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-primary-hover disabled:bg-gray-500">
                        Show Steps with AI
                    </button>
                </div>
            </div>

             {showSteps && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowSteps(false)}>
                    <div className="bg-brand-surface p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Conversion Steps for {values.dec}</h2>
                        {loadingSteps ? <AiLoadingSpinner /> : (
                            <div className="prose prose-invert max-w-none text-brand-text-secondary" dangerouslySetInnerHTML={{ __html: stepsContent.replace(/\n/g, '<br/>') }}/>
                        )}
                        <button onClick={() => setShowSteps(false)} className="mt-6 bg-brand-border px-4 py-2 rounded-md">Close</button>
                    </div>
                </div>
            )}
        </ToolPageLayout>
    );
};

export default NumberBaseConverter;