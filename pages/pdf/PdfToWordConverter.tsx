import React, { useState, useCallback } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

// Utility to convert file to base64 generative part
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to read file as data URL."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
    const data = await base64EncodedDataPromise;
    return {
        inlineData: { data, mimeType: file.type },
    };
};

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col justify-center items-center h-full text-brand-text-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mb-4"></div>
        <p>AI is analyzing your document...</p>
        <p className="text-sm">This may take a moment for multi-page documents.</p>
    </div>
);

const PdfToWordConverter: React.FC = () => {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [outputHtml, setOutputHtml] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleFileUpload = (file: File) => {
        if (file && file.type === 'application/pdf') {
            if (file.size > 20 * 1024 * 1024) { // 20MB limit
                 setError("File is too large. Please upload a PDF smaller than 20MB.");
                 return;
            }
            setPdfFile(file);
            setOutputHtml(null);
            setError(null);
        } else {
            setError("Please upload a valid PDF file.");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    }, []);

    const handleDragEvents = (isEntering: boolean) => (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(isEntering);
    };
    
    const handleConvert = async () => {
        if (!pdfFile) {
            setError("Please upload a PDF file first.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setOutputHtml(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const pdfPart = await fileToGenerativePart(pdfFile);
            
            const prompt = `Analyze the entire provided PDF document. Extract all text and accurately reconstruct the content's structure, including headings, paragraphs, lists, and any tables from all pages. Format the output as a single, well-structured semantic HTML document that can be easily copied and pasted into a rich text editor like Microsoft Word or Google Docs. Use tags like <h1>, <h2>, <p>, <ul>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <strong>, and <em>. Preserve the layout as closely as possible. Do not include <html>, <head>, or <body> tags. Just return the content that would go inside the <body>.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: { parts: [pdfPart, { text: prompt }] },
            });
            
            setOutputHtml(response.text);

        } catch (e: any) {
            console.error(e);
            setError(`An AI error occurred: ${e.message || 'The model could not process the document. It might be too large, complex, or password-protected.'}`);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleCopy = () => {
        if (outputHtml) {
            const blob = new Blob([outputHtml], { type: 'text/html' });
            const clipboardItem = new ClipboardItem({ 'text/html': blob });
            navigator.clipboard.write([clipboardItem]).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };
    
    const handleDownload = () => {
        if (!outputHtml || !pdfFile) return;
    
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${pdfFile.name.replace(/\.pdf$/i, '')}</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.5; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
                    th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
                    th { background-color: #f2f2f2; }
                    ul, ol { padding-left: 20px; }
                </style>
            </head>
            <body>
                ${outputHtml}
            </body>
            </html>
        `;
    
        const blob = new Blob([htmlContent], { type: 'application/msword' });
    
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${pdfFile.name.replace(/\.pdf$/i, '')}.doc`; 
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };
    
    const longDescription = (
      <>
        <p>
          Unlock the full potential of your static PDF documents with our cutting-edge AI-powered PDF to Word Converter. This is more than just a simple text extractor; our advanced tool is engineered to intelligently analyze and reconstruct the entire structure of your PDF. It meticulously preserves complex layouts, including columns, tables, headers, and footers, ensuring a seamless transition from PDF to an editable DOCX format. Text formatting such as fonts, colors, and styles are maintained with remarkable accuracy, saving you countless hours of manual reformatting.
        </p>
        <p>
          Whether you need to update a report, repurpose content for a new project, or collaborate on a document that was locked in a PDF, our converter provides a fast, secure, and highly accurate solution. All processing is done with privacy in mind, giving you a reliable tool to streamline your document workflow. Simply upload your file, and let our AI handle the intricate conversion process, delivering a professional-quality Word document in moments.
        </p>
      </>
    );

    return (
        <ToolPageLayout
            title="PDF to Word Converter"
            description="Upload a PDF and let AI extract its content and layout into an editable format."
            longDescription={longDescription}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Panel */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-brand-text-primary">1. Upload PDF Document</h3>
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragEvents(true)}
                        onDragEnter={handleDragEvents(true)}
                        onDragLeave={handleDragEvents(false)}
                        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors min-h-[20rem] flex flex-col justify-center items-center ${isDragging ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border'}`}
                    >
                         {pdfFile ? (
                             <div className="text-center text-brand-text-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-brand-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                <p className="mt-4 font-semibold text-brand-text-primary truncate max-w-xs">{pdfFile.name}</p>
                                <p className="text-sm">{formatBytes(pdfFile.size)}</p>
                             </div>
                        ) : (
                            <div className="text-center text-brand-text-secondary">
                                <p>Drag & drop a PDF here</p>
                                <p className="my-2">(Max 20MB)</p>
                                <label className="cursor-pointer font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover px-5 py-2 rounded-md transition-colors">
                                    Browse Files
                                    <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                        )}
                    </div>
                     {pdfFile && (
                         <label className="inline-block cursor-pointer font-semibold text-brand-primary hover:text-brand-primary-hover py-2 text-center w-full">
                            Change PDF
                            <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                        </label>
                     )}
                     <button
                        onClick={handleConvert}
                        disabled={isProcessing || !pdfFile}
                        className="w-full bg-brand-primary text-white px-6 py-3 rounded-md hover:bg-brand-primary-hover transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed font-semibold text-lg"
                    >
                        {isProcessing ? 'Converting...' : '2. Convert with AI'}
                    </button>
                    {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                </div>

                {/* Output Panel */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-brand-text-primary">3. Copy or Download</h3>
                     <div className="bg-brand-bg min-h-[28rem] w-full rounded-lg border border-brand-border flex flex-col p-1">
                        <div className="flex-grow p-4 overflow-y-auto bg-white text-black prose max-w-none rounded-t-md">
                        {isProcessing && <LoadingSpinner />}
                        
                        {outputHtml && !isProcessing && !error && (
                            <div dangerouslySetInnerHTML={{ __html: outputHtml }} />
                        )}
                        {!isProcessing && !outputHtml && (
                            <div className="flex flex-col h-full justify-center items-center text-center">
                                {error ? (
                                     <p className="text-red-500">{error}</p>
                                ) : (
                                     <p className="text-gray-500">Your converted document will appear here. Paste it into Word, Google Docs, or any rich text editor.</p>
                                )}
                            </div>
                        )}
                        </div>
                        {outputHtml && (
                            <div className="bg-brand-surface p-2 rounded-b-md flex justify-end gap-2">
                                <button
                                    onClick={handleDownload}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    Download .doc
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-primary-hover transition-colors text-sm font-medium"
                                >
                                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </ToolPageLayout>
    );
};

export default PdfToWordConverter;