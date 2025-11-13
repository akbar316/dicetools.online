import React, { useState, useMemo } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

const AiLoadingSpinner: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>{text}</span>
    </div>
);

// Simple syllable counter heuristic
const countSyllables = (word: string): number => {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 0;
};

const WordCounter: React.FC = () => {
  const [text, setText] = useState('');

  // AI State
  const [summary, setSummary] = useState('');
  const [proofread, setProofread] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isProofreading, setIsProofreading] = useState(false);
  const [aiError, setAiError] = useState('');

  const stats = useMemo(() => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return { words: 0, characters: 0, sentences: 0, paragraphs: 0, readingTime: 0, speakingTime: 0, readability: 0 };
    }
    const words = trimmedText.match(/\b\w+\b/g) || [];
    const wordCount = words.length;
    const characters = text.length;
    const sentences = trimmedText.match(/[^.!?]+[.!?]+/g)?.length || 1;
    const paragraphs = trimmedText.split(/\n+/).filter(p => p.trim().length > 0).length;
    
    // Advanced stats
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed 200 wpm
    const speakingTime = Math.ceil(wordCount / 150); // Average speaking speed 150 wpm

    // Flesch-Kincaid Readability
    // FIX: Explicitly type the `word` parameter as `string`. TypeScript was incorrectly inferring it as `never` when the `words` array could be empty, causing a type error.
    const totalSyllables = words.reduce((acc: number, word: string) => acc + countSyllables(word), 0);
    const readability = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (totalSyllables / wordCount);

    return { words: wordCount, characters, sentences, paragraphs, readingTime, speakingTime, readability: Math.max(0, Math.round(readability)) };
  }, [text]);

  const handleAiAction = async (action: 'summarize' | 'proofread') => {
    if (!text.trim()) {
        setAiError('Please enter some text to analyze.');
        return;
    }
    
    let prompt = '';
    if (action === 'summarize') {
        setIsSummarizing(true);
        setSummary('');
        prompt = `Summarize the following text concisely:\n\n---\n\n${text}`;
    } else {
        setIsProofreading(true);
        setProofread('');
        prompt = `Act as an expert proofreader. Review the following text for grammar, spelling, punctuation, and style errors. Provide a corrected version of the text. Do not provide commentary, just return the corrected text.\n\n---\n\n${text}`;
    }
    
    setAiError('');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        if (action === 'summarize') {
            setSummary(response.text);
        } else {
            setProofread(response.text);
        }
    } catch (e: any) {
        console.error(e);
        setAiError(`An error occurred: ${e.message || 'Please try again.'}`);
    } finally {
        setIsSummarizing(false);
        setIsProofreading(false);
    }
  };
  
  const longDescription = (
    <>
      <p>
        Dive deeper into your writing with our Advanced Word Counter, a comprehensive tool designed for writers, students, editors, and marketers. Beyond simple word and character counts, this utility provides actionable insights to improve your text's quality and readability. Simply paste your content into the text area, and watch as the tool instantly analyzes it, breaking down everything from sentence structure to reading time. It's the perfect companion for ensuring your essays meet length requirements, your social media posts are concise, and your articles are engaging for your audience.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">AI-Powered Writing Assistant</h3>
      <p>
        Elevate your content with integrated AI features. With a single click, you can generate a concise summary of your text, perfect for creating abstracts or TL;DR sections. Need a second pair of eyes? The AI Proofreader will scan your document for grammatical errors, spelling mistakes, and awkward phrasing, providing a clean, corrected version. These powerful features help you refine your message, catch mistakes you might have missed, and ensure your final text is polished and professional.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Key Analytical Features</h3>
      <ul className="list-disc list-inside space-y-2">
        <li><strong>Detailed Statistics:</strong> Instantly see counts for words, characters, sentences, and paragraphs.</li>
        <li><strong>Readability Metrics:</strong> Calculate estimated reading and speaking times, along with a Flesch-Kincaid readability score to gauge your content's accessibility.</li>
        <li><strong>AI Summarization:</strong> Condense long articles or essays into key takeaways automatically.</li>
        <li><strong>AI Proofreading:</strong> Get instant feedback and corrections for grammar, spelling, and style.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Advanced Word Counter"
      description="Analyze your text for readability, word count, and get AI-powered feedback."
      longDescription={longDescription}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here..."
              className="w-full h-80 p-4 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            {aiError && <p className="text-red-500 text-center">{aiError}</p>}
            
            {(isSummarizing || summary) && (
                <div className="bg-brand-bg p-4 border border-brand-border rounded-md">
                    <h3 className="text-lg font-semibold text-brand-primary mb-2">AI Summary</h3>
                    {isSummarizing ? (
                        <div className="flex justify-center items-center h-24"><p className="text-brand-text-secondary">Generating summary...</p></div>
                    ) : (
                        <>
                            <p className="whitespace-pre-wrap text-sm">{summary}</p>
                            <div className="flex justify-end mt-2"><CopyButton textToCopy={summary} /></div>
                        </>
                    )}
                </div>
            )}
            
             {(isProofreading || proofread) && (
                <div className="bg-brand-bg p-4 border border-brand-border rounded-md">
                    <h3 className="text-lg font-semibold text-brand-primary mb-2">AI Proofread & Suggestions</h3>
                    {isProofreading ? (
                        <div className="flex justify-center items-center h-24"><p className="text-brand-text-secondary">Generating suggestions...</p></div>
                    ) : (
                        <>
                            <p className="whitespace-pre-wrap text-sm">{proofread}</p>
                            <div className="flex justify-end mt-2"><CopyButton textToCopy={proofread} /></div>
                        </>
                    )}
                </div>
            )}
        </div>

        <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4 text-center">
                <StatCard value={stats.words} label="Words" />
                <StatCard value={stats.characters} label="Characters" />
                <StatCard value={stats.sentences} label="Sentences" />
                <StatCard value={stats.paragraphs} label="Paragraphs" />
            </div>
             <div className="grid grid-cols-2 gap-4 text-center">
                <StatCard value={`${stats.readingTime} min`} label="Reading Time" />
                <StatCard value={`${stats.speakingTime} min`} label="Speaking Time" />
            </div>
            <div className="bg-brand-bg p-4 rounded-md text-center">
                 <div className="text-2xl font-bold text-brand-primary">{stats.readability}</div>
                 <div className="text-sm text-brand-text-secondary">Readability Score</div>
                 <p className="text-xs text-brand-text-secondary mt-1">(Flesch-Kincaid)</p>
            </div>
            <div className="space-y-3 pt-4 border-t border-brand-border">
                <button
                    onClick={() => handleAiAction('summarize')}
                    disabled={isSummarizing || isProofreading || !text.trim()}
                    className="w-full bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-primary-hover transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {isSummarizing ? <AiLoadingSpinner text="Summarizing..." /> : 'Summarize with AI'}
                </button>
                 <button
                    onClick={() => handleAiAction('proofread')}
                    disabled={isSummarizing || isProofreading || !text.trim()}
                    className="w-full bg-sky-600 text-white px-6 py-2 rounded-md hover:bg-sky-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {isProofreading ? <AiLoadingSpinner text="Proofreading..." /> : 'Proofread with AI'}
                </button>
            </div>
        </div>
      </div>
    </ToolPageLayout>
  );
};

const StatCard: React.FC<{value: string | number, label: string}> = ({ value, label }) => (
    <div className="bg-brand-bg p-4 rounded-md">
        <div className="text-2xl font-bold text-brand-primary">{value}</div>
        <div className="text-sm text-brand-text-secondary">{label}</div>
    </div>
);

export default WordCounter;