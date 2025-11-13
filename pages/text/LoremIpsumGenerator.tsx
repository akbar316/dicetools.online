import React, { useState } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

const AiLoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>Generating...</span>
    </div>
);

const LoremIpsumGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('a short, professional-sounding paragraph about the benefits of a new productivity app');
    const [output, setOutput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState('');

    const generate = async () => {
        if (!prompt.trim()) {
            setAiError('Please enter a topic for the placeholder text.');
            return;
        }
        setIsGenerating(true);
        setAiError('');
        setOutput('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const model = 'gemini-2.5-flash';
            const fullPrompt = `Generate placeholder text suitable for design mockups based on the following topic. Do not include any titles or introductory phrases like "Here is some placeholder text:". Just return the text itself.\n\nTopic: "${prompt}"`;

            const response = await ai.models.generateContent({
                model,
                contents: fullPrompt,
            });
            
            setOutput(response.text);

        } catch (e: any) {
            console.error(e);
            setAiError(`An error occurred: ${e.message || 'Please try again.'}`);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const longDescription = (
      <>
        <p>
          Move beyond traditional "Lorem Ipsum" with our AI Placeholder Text Generator. This intelligent tool is built for designers, developers, and content creators who need more realistic and context-aware placeholder text for their projects. Instead of filling your mockups with meaningless Latin, you can generate text that actually reflects the intended content. Simply describe the topic, tone, and format you need, and our AI will produce relevant, well-structured paragraphs. This helps stakeholders better visualize the final product, improves the design review process, and ensures your layouts are tested with content that mirrors real-world use cases.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">How It Elevates Your Designs</h3>
        <p>
          Using contextual placeholder text offers significant advantages over generic fillers, creating a more professional and effective design workflow from start to finish.
        </p>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li><strong>Improved Realism:</strong> Generate text that matches the subject matter of your website or app, from product descriptions to blog post introductions.</li>
          <li><strong>Better Feedback:</strong> Allow clients and team members to review designs with content that makes sense, leading to more accurate feedback on layout and user flow.</li>
          <li><strong>Flexible & Fast:</strong> Quickly generate multiple variations of text to test different content lengths and structures within your UI components.</li>
        </ul>
      </>
    );
  
    return (
        <ToolPageLayout
            title="AI Placeholder Text Generator"
            description="Generate contextual placeholder text for your design mockups."
            longDescription={longDescription}
        >
            <div className="space-y-4">
                <p className="text-brand-text-secondary">Instead of "Lorem Ipsum", get placeholder text that matches your content. Describe the topic below.</p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., a welcome message for a new user, a product description for a coffee mug"
                    className="w-full h-24 p-4 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    disabled={isGenerating}
                />
                <button 
                    onClick={generate} 
                    disabled={isGenerating}
                    className="w-full bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-primary-hover transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {isGenerating ? <AiLoadingSpinner /> : 'Generate with AI'}
                </button>
                {aiError && <p className="text-red-500 text-center">{aiError}</p>}
                
                <textarea
                    readOnly
                    value={output}
                    className="w-full h-72 p-4 bg-brand-bg border border-brand-border rounded-md"
                    placeholder="Generated text will appear here..."
                />
                <div className="flex justify-end">
                    <CopyButton textToCopy={output} />
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default LoremIpsumGenerator;