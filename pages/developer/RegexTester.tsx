import React, { useState, useMemo } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

const AiLoadingSpinner: React.FC<{text: string}> = ({ text }) => (
    <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>{text}</span>
    </div>
);

const CheatSheet: React.FC = () => (
    <div className="bg-brand-bg p-4 rounded-lg text-sm">
        <h3 className="font-semibold text-brand-primary mb-2">Regex Quick Reference</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
            <span>. (any character)</span><span>\d (digit)</span>
            <span>\w (word char)</span><span>\s (whitespace)</span>
            <span>* (0 or more)</span><span>+ (1 or more)</span>
            <span>? (0 or 1)</span><span>^ (start of string)</span>
            <span>$ (end of string)</span><span>[abc] (any of a,b,c)</span>
            <span>(a|b) (a or b)</span><span>&#123;n&#125; (exactly n times)</span>
        </div>
    </div>
);

const RegexTester: React.FC = () => {
    const [pattern, setPattern] = useState('(\\w+)@(\\w+\\.\\w+)');
    const [flags, setFlags] = useState('g');
    const [testString, setTestString] = useState('Contact us at support@example.com or sales@example.org for more info.');
    const [error, setError] = useState('');
    
    // AI state
    const [aiPrompt, setAiPrompt] = useState('An email address');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExplaining, setIsExplaining] = useState(false);
    const [explanation, setExplanation] = useState('');
    const [aiError, setAiError] = useState('');

    const { highlightedString, matches } = useMemo(() => {
        if (!pattern) return { highlightedString: testString, matches: [] };
        try {
            const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
            setError('');
            const foundMatches: (string[])[] = [];
            for (const match of testString.matchAll(regex)) {
                foundMatches.push(Array.from(match));
            }
            return {
                highlightedString: testString.replace(regex, (match) => `<mark>${match}</mark>`),
                matches: foundMatches,
            };
        } catch (e: any) {
            setError(e.message);
            return { highlightedString: testString, matches: [] };
        }
    }, [pattern, flags, testString]);
    
    const handleAiAction = async (action: 'generate' | 'explain') => {
        setAiError('');
        setExplanation('');
        let prompt: string;
        if (action === 'generate') {
            if (!aiPrompt.trim()) { setAiError('Please enter a description.'); return; }
            setIsGenerating(true);
            prompt = `Generate a JavaScript regular expression that matches the following description. Only return the regex pattern itself, without any slashes, flags, or explanations.\n\nDescription: "${aiPrompt}"`;
        } else {
            if (!pattern.trim()) { setAiError('Please enter a regex to explain.'); return; }
            setIsExplaining(true);
            prompt = `Provide a detailed, step-by-step explanation of the following regular expression. Break it down token by token.\n\nRegex: /${pattern}/${flags}`;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            
            if (action === 'generate') {
                const cleanedRegex = response.text.trim().replace(/^`{1,3}(js|javascript|regex)?|`{1,3}$/g, '').trim();
                setPattern(cleanedRegex);
            } else {
                setExplanation(response.text);
            }
        } catch (e: any) {
            setAiError(`An error occurred: ${e.message}`);
        } finally {
            setIsGenerating(false);
            setIsExplaining(false);
        }
    };
    
    const longDescription = (
      <>
        <p>
          Master the art of regular expressions with our Advanced Regex Tester. This comprehensive tool is designed for developers of all skill levels, from beginners learning the basics to experts crafting complex patterns. The real-time interface allows you to instantly test your regex against a sample string, providing immediate visual feedback with highlighted matches. You can easily modify your pattern and flags (like global, multiline, and case-insensitive) to see how they affect the results. The detailed "Matches & Groups" panel breaks down each match and its corresponding capture groups, making debugging and validation a breeze.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Learn and Create with AI</h3>
        <p>
          Struggling to write a complex regex? Let our AI assistant do the heavy lifting. Simply describe what you want to match in plain English, and the "Generate" feature will create a pattern for you. If you have a regex that you don't understand, the "Explain" feature provides a token-by-token breakdown of what each part of the expression does. These AI-powered features make our Regex Tester an invaluable learning resource, helping you not only test your patterns but also understand the logic behind them.
        </p>
      </>
    );

    return (
        <ToolPageLayout title="Advanced Regex Tester" description="Test, generate, and get AI-powered explanations for your RegEx." longDescription={longDescription}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="font-mono flex items-center bg-brand-bg border border-brand-border rounded-md">
                        <span className="px-3 text-brand-text-secondary">/</span>
                        <input type="text" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="Pattern" className="flex-grow p-2 bg-transparent focus:outline-none"/>
                        <span className="px-3 text-brand-text-secondary">/</span>
                        <input type="text" value={flags} onChange={(e) => setFlags(e.target.value)} placeholder="flags" className="w-16 p-2 bg-transparent focus:outline-none"/>
                    </div>
                    {error && <p className="text-red-500 text-sm px-2 font-sans">{error}</p>}
                    <textarea value={testString} onChange={(e) => setTestString(e.target.value)} placeholder="Test String" className="w-full h-48 p-2 bg-brand-bg border border-brand-border rounded-md font-mono"/>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold mb-2">Highlighted Result</h3>
                            <div className="p-2 bg-brand-bg border border-brand-border rounded-md min-h-[8rem] whitespace-pre-wrap font-mono"
                                dangerouslySetInnerHTML={{ __html: highlightedString.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/<mark>/g, '<mark class="bg-brand-primary/50 rounded-sm">') }} />
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">Matches & Groups ({matches.length})</h3>
                            <div className="bg-brand-bg border border-brand-border rounded-md min-h-[8rem] max-h-48 overflow-y-auto p-2 font-mono text-xs">
                                {matches.map((match, i) => (
                                    <div key={i} className="mb-2 p-1 border-b border-brand-border/50">
                                        <p><span className="text-brand-text-secondary">Full Match {i}:</span> {match[0]}</p>
                                        {match.length > 1 && match.slice(1).map((group, j) => (
                                            <p key={j} className="ml-2"><span className="text-brand-text-secondary">Group {j+1}:</span> {group}</p>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="bg-brand-bg p-4 rounded-lg space-y-3">
                        <h3 className="font-semibold text-brand-primary">AI Tools</h3>
                        <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe regex to generate" className="w-full p-2 bg-brand-surface border border-brand-border rounded"/>
                        <button onClick={() => handleAiAction('generate')} disabled={isGenerating || isExplaining} className="w-full bg-brand-primary text-white p-2 rounded disabled:bg-gray-500">{isGenerating ? <AiLoadingSpinner text="Generating..." /> : 'Generate'}</button>
                        <button onClick={() => handleAiAction('explain')} disabled={isGenerating || isExplaining} className="w-full bg-sky-600 text-white p-2 rounded disabled:bg-gray-500">{isExplaining ? <AiLoadingSpinner text="Explaining..." /> : 'Explain Current Regex'}</button>
                        {aiError && <p className="text-red-500 text-sm">{aiError}</p>}
                    </div>
                    {explanation && (
                        <div className="bg-brand-bg p-4 rounded-lg space-y-2 animate-fade-in-up">
                            <h3 className="font-semibold text-brand-primary">AI Explanation</h3>
                            <p className="text-sm whitespace-pre-wrap">{explanation}</p>
                        </div>
                    )}
                    <CheatSheet />
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default RegexTester;