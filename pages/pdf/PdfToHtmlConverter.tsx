import React, { useState } from 'react';
import PdfToolLayout from './PdfToolPlaceholder';
import { GoogleGenAI } from '@google/genai';

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

const PdfToHtmlConverter: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputHtml, setOutputHtml] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const longDescription = (
        <>
            <p>
              Transform your static PDF documents into dynamic, web-friendly HTML with our advanced AI-powered PDF to HTML Converter. This intelligent tool is designed for developers, content managers, and anyone who needs to publish PDF content on the web. Instead of just extracting text, our AI analyzes the entire structure of your document, including headings, paragraphs, lists, tables, and text formatting.
            </p>
            <p>
              It then reconstructs this content using semantic HTML tags, preserving the original layout and making the content accessible and responsive. The generated HTML is clean and ready to be embedded directly into a webpage or styled with your own CSS. It's the perfect solution for converting manuals, reports, and articles into a format that is indexable by search engines and easily readable on any device. Experience a seamless and accurate conversion process, handled securely in your browser.
            </p>
        </>
    );

    const handleProcess = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setOutputHtml(null);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const pdfPart = await fileToGenerativePart(files[0]);

            const prompt = `Analyze the provided PDF document. Convert its entire content into a single, well-structured semantic HTML document. Preserve the layout, text formatting (bold, italic), headings, lists, and tables as accurately as possible. Use appropriate HTML tags (e.g., <h1>, <p>, <ul>, <table>). Do NOT include <html>, <head>, or <body> tags. Only return the content that would go inside the <body> tag. Inline CSS is acceptable for styling if necessary to maintain the layout.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: { parts: [pdfPart, { text: prompt }] },
            });
            
            setOutputHtml(response.text);

        } catch (e: any) {
            console.error(e);
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
            {isProcessing ? 'Converting...' : 'Convert to HTML with AI'}
        </button>
    );

    const Output = (
        <div className="w-full h-full flex flex-col items-center justify-center">
            {isProcessing && (
                <div className="text-center text-brand-text-secondary">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto mb-4"></div>
                    <p>AI is converting your document...</p>
                </div>
            )}

            {!isProcessing && outputHtml && (
                <div className="w-full h-full flex flex-col">
                    <h3 className="font-semibold text-lg text-brand-text-primary text-center mb-2">Conversion Complete!</h3>
                    <iframe
                        srcDoc={outputHtml}
                        title="HTML Preview"
                        className="w-full flex-grow bg-white border border-brand-border rounded-md"
                        sandbox="allow-scripts"
                    />
                    <button onClick={() => createAndDownloadBlob(outputHtml, files[0].name.replace(/\.pdf$/i, '.html'), 'text/html')} className="mt-4 w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 font-semibold">
                        Download HTML File
                    </button>
                </div>
            )}

            {!isProcessing && !outputHtml && (
                <p className="text-brand-text-secondary text-center">
                    {error ? <span className="text-red-500">{error}</span> : "Upload a PDF to convert it into a web-friendly HTML file."}
                </p>
            )}
        </div>
    );

    return (
        <PdfToolLayout
            title="PDF to HTML Converter"
            description="Use AI to convert your PDFs into structured HTML files."
            onFilesSelected={f => { setFiles(f); setOutputHtml(null); setError(null); }}
            selectedFiles={files}
            actionButton={ActionButton}
            output={Output}
            longDescription={longDescription}
        />
    );
};

export default PdfToHtmlConverter;