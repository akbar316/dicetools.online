import React, { useState } from 'react';
import PdfToolLayout from './PdfToolPlaceholder';
import { CopyButton } from '../../components/ToolPageLayout';
import { GoogleGenAI, Type } from '@google/genai';

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
};

const createAndDownloadBlob = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const PdfBookmarkAdder: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toc, setToc] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleProcess = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setToc(null);
        setError('');
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const pdfPart = await fileToGenerativePart(files[0]);

            const prompt = `Act as an expert document analyst. Analyze the provided PDF and generate a detailed table of contents. Identify all major sections, chapters, and sub-headings, and list them with their corresponding page numbers. Format the output as a clean, indented, plain text list. For example:
Introduction...........1
Chapter 1: The Beginning...........5
  1.1 First Steps...........7
  1.2 New Discoveries...........12
Chapter 2: The Middle...........20`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: { parts: [pdfPart, { text: prompt }] },
            });

            setToc(response.text);

        } catch (e: any) {
             setError(`An AI error occurred: ${e.message || 'Could not process document.'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const ActionButton = (
        <button
            onClick={handleProcess}
            disabled={files.length === 0 || isProcessing}
            className="w-full bg-brand-primary text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-brand-primary-hover transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
            {isProcessing ? 'Analyzing Document...' : 'Generate Table of Contents with AI'}
        </button>
    );

    const Output = (
        <div className="w-full h-full flex flex-col items-center justify-center">
            {isProcessing && (
                <div className="text-center text-brand-text-secondary">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto mb-4"></div>
                    <p>AI is reading your document...</p>
                </div>
            )}
            
            {!isProcessing && toc && (
                <div className="w-full h-full flex flex-col">
                    <h3 className="font-semibold text-lg text-brand-text-primary text-center mb-2">Generated Table of Contents</h3>
                    <textarea readOnly value={toc} className="w-full flex-grow bg-brand-surface p-4 rounded-md font-mono text-sm" />
                    <div className="flex justify-end pt-4 gap-2">
                        <button onClick={() => createAndDownloadBlob(toc, `toc_${files[0].name}.txt`, 'text/plain')} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium">Download .txt</button>
                        <CopyButton textToCopy={toc} />
                    </div>
                </div>
            )}
            
            {!isProcessing && !toc && (
                 <p className="text-brand-text-secondary text-center">
                    {error ? <span className="text-red-500">{error}</span> : "Upload a PDF and let AI generate a table of contents for you. Note: This adds a text ToC, not embedded PDF bookmarks."}
                </p>
            )}
        </div>
    );

    return (
        <PdfToolLayout
            title="AI-Powered Table of Contents Generator"
            description="Automatically generate a table of contents for your PDF."
            onFilesSelected={f => { setFiles(f); setToc(null); setError(''); }}
            selectedFiles={files}
            actionButton={ActionButton}
            output={Output}
        />
    );
};

export default PdfBookmarkAdder;