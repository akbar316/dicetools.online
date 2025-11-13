import React, { useState } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

const AiLoadingSpinner: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>{text}</span>
    </div>
);

const JsMinifier: React.FC = () => {
    const [jsInput, setJsInput] = useState('// This is a sample function\nfunction sayHello(name) {\n    const greeting = "Hello, " + name + "!";\n    console.log(greeting); // Log to console\n    return greeting;\n}');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const cleanCode = () => {
        setOutput('');
        setError('');
        try {
            const result = jsInput
                .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // remove comments
                .replace(/console\.\w+\(.*\);?/g, '') // remove console logs
                .replace(/\s+/g, ' ') // collapse whitespace
                .replace(/\s*([;:{},()=\[\]])\s*/g, '$1') // remove space around operators
                .trim();
            setOutput(result);
        } catch (e: any) {
            setError('Failed to clean JS.');
        }
    };
    
    const obfuscateWithAi = async () => {
        if (!jsInput.trim()) {
            setError('Please enter some JavaScript to obfuscate.');
            return;
        }
        setLoading(true);
        setOutput('');
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as an expert JavaScript obfuscator. Rewrite the following JavaScript code to be functionally identical but much harder to read and understand. Use techniques like renaming variables to short, meaningless names, converting strings to hex or base64, and restructuring logic where possible. Do not add any comments or explanations. Return only the raw, obfuscated JavaScript code.\n\n---\n\n${jsInput}`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setOutput(response.text);
        } catch (e: any) {
            setError(`AI Obfuscation failed: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const longDescription = (
      <>
        <p>
          Optimize and protect your JavaScript with our JS Cleaner & AI Obfuscator. This powerful tool is designed for web developers who want to prepare their code for production environments. It offers two distinct functionalities to enhance your scripts. The "Clean Code" feature acts as a simple minifier, stripping out all comments and console log statements, and collapsing unnecessary whitespace. This process reduces the file size of your scripts, leading to faster page load times and improved performance for your users. It's an essential step in any deployment pipeline for creating lean, efficient code.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Advanced Protection with AI Obfuscation</h3>
        <p>
          When you need to protect your intellectual property or make your code more difficult to reverse-engineer, our "Obfuscate with AI" feature provides a sophisticated solution. Unlike simple minifiers, this tool leverages an advanced AI model to intelligently rewrite your code. It renames variables, restructures logic, and employs other advanced techniques to make the code functionally identical but extremely difficult for humans to read and understand. This adds a significant layer of protection to your client-side scripts, deterring unauthorized copying and analysis of your proprietary algorithms and business logic.
        </p>
      </>
    );

    return (
        <ToolPageLayout
            title="JS Cleaner & AI Obfuscator"
            description="Clean your JavaScript by removing comments and logs, or use AI to obfuscate it."
            longDescription={longDescription}
        >
             <div className="space-y-4">
                <div className="flex flex-wrap justify-center items-center gap-4">
                    <button onClick={cleanCode} className="bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-primary-hover transition-colors">
                        Clean Code
                    </button>
                    <button onClick={obfuscateWithAi} disabled={loading} className="bg-sky-600 text-white px-6 py-2 rounded-md hover:bg-sky-700 transition-colors disabled:bg-gray-500">
                        {loading ? <AiLoadingSpinner text="Obfuscating..." /> : 'Obfuscate with AI'}
                    </button>
                    <CopyButton textToCopy={output} />
                </div>
                {error && <p className="text-red-500 text-center">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea
                        value={jsInput}
                        onChange={(e) => setJsInput(e.target.value)}
                        placeholder="Paste your JavaScript code here..."
                        className="w-full h-96 p-4 bg-brand-bg border border-brand-border rounded-md font-mono text-sm"
                    />
                    <textarea
                        readOnly
                        value={output}
                        placeholder="Output code will appear here..."
                        className="w-full h-96 p-4 bg-brand-bg border border-brand-border rounded-md font-mono text-sm"
                    />
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default JsMinifier;