import React, { useState } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

const AiLoadingSpinner: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>{text}</span>
    </div>
);

const CssMinifier: React.FC = () => {
    const [cssInput, setCssInput] = useState('/* Main button style */\n.button {\n  color: #ffffff;\n  background-color: #007bff;\n  padding: 10px 20px;\n  border-radius: 5px;\n}\n\n.button:hover {\n    background-color: #0056b3;\n}');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const minify = () => {
        setOutput('');
        setError('');
        try {
            const result = cssInput
                .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
                .replace(/\s+/g, ' ') // collapse whitespace
                .replace(/\s*([{}:;,])\s*/g, '$1') // remove space around operators
                .replace(/;}/g, '}') // remove last semicolon in a block
                .trim();
            setOutput(result);
        } catch (e: any) {
            setError('Failed to minify CSS.');
        }
    };
    
    const optimizeWithAi = async () => {
        if (!cssInput.trim()) {
            setError('Please enter some CSS to optimize.');
            return;
        }
        setLoading(true);
        setOutput('');
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as an expert CSS optimizer. Analyze the following CSS code. Provide an optimized version by combining selectors, removing redundant properties, and using shorthand where possible. Also, add a comment block at the top explaining the key optimizations you made. Return only the optimized CSS code with your comment block.\n\n---\n\n${cssInput}`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setOutput(response.text);
        } catch (e: any) {
            setError(`AI Optimization failed: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const longDescription = (
      <>
        <p>
          Enhance your website's performance and maintainability with our CSS Optimizer & Minifier. This tool is an essential utility for front-end developers aiming to write clean, efficient, and fast-loading stylesheets. It offers two powerful modes to handle your CSS code. The "Minify" function provides a quick and effective way to reduce file size by stripping out all comments, extra whitespace, and unnecessary characters. This results in a smaller CSS file that browsers can download and parse more quickly, directly improving your site's loading speed and user experience.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Intelligent Optimization with AI</h3>
        <p>
          For a deeper level of improvement, our "Optimize with AI" feature goes beyond simple minification. It leverages an advanced AI model to analyze your CSS for best practices and potential refinements. The AI can identify redundant properties, combine selectors with identical rules, and suggest the use of shorthand properties to make your code more concise and maintainable. The output not only provides the optimized code but also includes a comment block at the top explaining the specific changes made. This makes it a fantastic learning tool for improving your CSS skills while simultaneously enhancing your code.
        </p>
      </>
    );

    return (
        <ToolPageLayout
            title="CSS Optimizer & Minifier"
            description="Minify your CSS or use AI to get optimization recommendations."
            longDescription={longDescription}
        >
            <div className="space-y-4">
                 <div className="flex flex-wrap justify-center items-center gap-4">
                    <button onClick={minify} className="bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-primary-hover transition-colors">
                        Minify
                    </button>
                    <button onClick={optimizeWithAi} disabled={loading} className="bg-sky-600 text-white px-6 py-2 rounded-md hover:bg-sky-700 transition-colors disabled:bg-gray-500">
                        {loading ? <AiLoadingSpinner text="Optimizing..." /> : 'Optimize with AI'}
                    </button>
                    <CopyButton textToCopy={output} />
                </div>
                {error && <p className="text-red-500 text-center">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea
                        value={cssInput}
                        onChange={(e) => setCssInput(e.target.value)}
                        placeholder="Paste your CSS code here..."
                        className="w-full h-96 p-4 bg-brand-bg border border-brand-border rounded-md font-mono text-sm"
                    />
                    <textarea
                        readOnly
                        value={output}
                        placeholder="Optimized or minified CSS will appear here..."
                        className="w-full h-96 p-4 bg-brand-bg border border-brand-border rounded-md font-mono text-sm"
                    />
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default CssMinifier;