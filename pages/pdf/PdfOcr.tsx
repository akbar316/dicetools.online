import React, { useState, useMemo } from 'react';
import PdfToolLayout from './PdfToolPlaceholder';
import { CopyButton } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

// --- HELPER FUNCTIONS ---

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

const createAndDownloadBlob = (content: string, fileName: string, mimeType: string) => {
    if (!content) return;
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

const languages = [ 'English', 'Spanish', 'French', 'German', 'Chinese (Simplified)', 'Japanese', 'Korean', 'Russian', 'Portuguese', 'Italian', 'Arabic', 'Hindi' ];

// --- MAIN COMPONENT ---

// FIX: Defined the TabButton component to resolve the 'Cannot find name' error. Added whitespace-nowrap for better display in a scrolling container.
const TabButton: React.FC<{label: string, isActive: boolean, onClick: () => void}> = ({label, isActive, onClick}) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-semibold text-sm whitespace-nowrap ${isActive ? 'border-b-2 border-brand-primary text-brand-text-primary' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
    >
        {label}
    </button>
);

const PdfOcr: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [outputTextByPage, setOutputTextByPage] = useState<string[]>([]);
    const [language, setLanguage] = useState('English');
    const [outputFormat, setOutputFormat] = useState<'plain' | 'markdown'>('plain');
    const [activePageTab, setActivePageTab] = useState(0); // 0 for full document
    
    const longDescription = (
        <>
            <p>
              Unlock the text trapped inside your scanned documents and images with our advanced AI-powered PDF OCR (Optical Character Recognition) tool. Standard text extractors can't read image-based PDFs, but our intelligent OCR engine can. It analyzes your scanned file, recognizes the characters, and converts them into editable, searchable text. This is perfect for digitizing old documents, invoices, receipts, or pages from a book. For even greater accuracy, you can specify the primary language of the document.
            </p>
            <p>
              Our tool offers two powerful output options: choose 'Plain Text' for raw text extraction, or select 'Markdown' to have the AI intelligently reconstruct the document's original layout, including headings, lists, and paragraphs. This allows you to not only access the text but also preserve its structure. Bring your static documents to life with our powerful, secure, and browser-based OCR technology.
            </p>
        </>
    );

    const handleProcess = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setError(null);
        setOutputTextByPage([]);
        setActivePageTab(0);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const file = files[0];
            const pdfPart = await fileToGenerativePart(file);

            let prompt = `You are an expert OCR system. Perform OCR on the provided PDF document. The document's primary language is ${language}.`;
            if (outputFormat === 'markdown') {
                prompt += ` Extract all text and accurately reconstruct the document's structure, including headings (using #, ##), paragraphs, lists, and tables, by formatting the output as Markdown.`;
            } else {
                prompt += ` Extract all text as plain text.`;
            }
            prompt += ` For this multi-page document, you MUST separate the content of each page with a unique delimiter: "---[AI_PDF_OCR_PAGE_BREAK]---". Do not include any other commentary or introductory text in your response.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: { parts: [pdfPart, { text: prompt }] },
            });

            const fullText = response.text;
            const pages = fullText.split('---[AI_PDF_OCR_PAGE_BREAK]---').map(p => p.trim());
            setOutputTextByPage(pages);
            setActivePageTab(1); // Default to showing Page 1 first

        } catch (e: any)
        {
            console.error(e);
            setError(`An AI error occurred: ${e.message || 'The model could not process the document. It may be too large, corrupted, or password-protected.'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const fullDocumentText = useMemo(() => outputTextByPage.join('\n\n---\n\n'), [outputTextByPage]);
    const textToDisplay = activePageTab === 0 ? fullDocumentText : outputTextByPage[activePageTab - 1] || '';
    const fileExtension = outputFormat === 'markdown' ? 'md' : 'txt';

    const ActionButton = (
        <button
            onClick={handleProcess}
            disabled={files.length === 0 || isProcessing}
            className="w-full bg-brand-primary text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-brand-primary-hover transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
            {isProcessing ? 'Recognizing Text...' : 'Perform OCR with AI'}
        </button>
    );

    const Output = (
        <div className="w-full h-full flex flex-col">
            {isProcessing && (
                <div className="m-auto text-center text-brand-text-secondary">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto mb-4"></div>
                    <p>AI is analyzing your document...</p>
                    <p className="text-sm">(This may take a moment for large files)</p>
                </div>
            )}

            {!isProcessing && outputTextByPage.length > 0 && (
                <>
                    <div className="flex border-b border-brand-border mb-2 -mx-2 px-2 overflow-x-auto">
                         <TabButton label="Full Document" isActive={activePageTab === 0} onClick={() => setActivePageTab(0)} />
                        {outputTextByPage.map((_, index) => (
                            <TabButton key={index + 1} label={`Page ${index + 1}`} isActive={activePageTab === index + 1} onClick={() => setActivePageTab(index + 1)} />
                        ))}
                    </div>
                    <textarea
                        readOnly
                        value={textToDisplay}
                        className="w-full flex-grow bg-brand-surface border-brand-border rounded-md p-4 font-mono text-sm"
                    />
                    <div className="flex justify-end pt-4 gap-2">
                        <button
                            onClick={() => createAndDownloadBlob(textToDisplay, `${files[0]?.name.replace(/\.pdf$/i, '')}.${fileExtension}`, 'text/plain')}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                            Download .{fileExtension}
                        </button>
                        <CopyButton textToCopy={textToDisplay} />
                    </div>
                </>
            )}

            {!isProcessing && outputTextByPage.length === 0 && (
                <p className="m-auto text-brand-text-secondary text-center">
                    {error ? <span className="text-red-500">{error}</span> : 'Upload a scanned PDF to recognize its text.'}
                </p>
            )}
        </div>
    );

    return (
        <PdfToolLayout
            title="Advanced PDF OCR (Text Recognition)"
            description="Extract text from scanned PDFs using AI, with layout preservation."
            onFilesSelected={(f) => { setFiles(f); setOutputTextByPage([]); setError(null); }}
            selectedFiles={files}
            actionButton={ActionButton}
            output={Output}
            longDescription={longDescription}
        >
            <div className="space-y-6">
                <div className="space-y-4 bg-brand-bg p-4 rounded-md">
                    <h3 className="font-semibold text-lg text-brand-text-primary">Language</h3>
                    <div>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full p-2 bg-brand-surface border border-brand-border rounded-md"
                        >
                            {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                    </div>
                </div>
                <div className="space-y-4 bg-brand-bg p-4 rounded-md">
                    <h3 className="font-semibold text-lg text-brand-text-primary">Output Format</h3>
                    <div className="flex border border-brand-border rounded-md">
                        <button onClick={() => setOutputFormat('plain')} className={`flex-1 p-2 rounded-l-md ${outputFormat === 'plain' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>Plain Text</button>
                        <button onClick={() => setOutputFormat('markdown')} className={`flex-1 p-2 rounded-r-md ${outputFormat === 'markdown' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>Markdown</button>
                    </div>
                </div>
            </div>
        </PdfToolLayout>
    );
};

export default PdfOcr;
