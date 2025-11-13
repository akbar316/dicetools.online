import React, { useState, useCallback, useRef } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

// --- DYNAMIC LIBRARY LOADING ---
declare global {
    interface Window {
        pdfLib: any;
    }
}

const loadPdfLib = async () => {
    if (window.pdfLib) return window.pdfLib;
    const pdfLibModule = await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.js');
    window.pdfLib = pdfLibModule;
    return window.pdfLib;
};

// --- TYPES & INTERFACES ---
type Action = 'merge' | 'compress' | 'text';

interface MergeOutput {
    name: string;
    url: string;
}
interface CompressOutput {
    originalName: string;
    newName: string;
    url: string;
    originalSize: number;
    newSize: number;
}
interface TextOutput {
    fileName: string;
    text: string;
}

// --- HELPER FUNCTIONS ---
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
};

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// --- UI COMPONENTS ---
const FileListItem: React.FC<{ file: File, onRemove: () => void, isDraggable?: boolean, onDragStart?: any, onDragEnter?: any, onDragEnd?: any, onDragOver?: any }> = 
({ file, onRemove, isDraggable = false, ...dragProps }) => (
    <div
        className={`flex items-center justify-between bg-brand-bg p-3 rounded-md overflow-hidden ${isDraggable ? 'cursor-grab' : ''}`}
        draggable={isDraggable}
        {...dragProps}
    >
        <div className="flex items-center gap-3 w-full min-w-0">
            {isDraggable && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-brand-text-secondary"><line x1="9" y1="12" x2="21" y2="12"></line><line x1="9" y1="6" x2="21" y2="6"></line><line x1="9" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-brand-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <div className="flex-grow min-w-0">
                <p className="truncate text-brand-text-primary">{file.name}</p>
                <p className="text-xs text-brand-text-secondary">{formatBytes(file.size)}</p>
            </div>
        </div>
        <button onClick={onRemove} className="ml-2 text-brand-text-secondary hover:text-red-500 flex-shrink-0 text-xl font-bold">&times;</button>
    </div>
);


const BatchPdfProcessor: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [action, setAction] = useState<Action>('merge');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [error, setError] = useState('');
    const [output, setOutput] = useState<MergeOutput | CompressOutput[] | TextOutput[] | null>(null);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleFilesSelected = (selectedFiles: FileList) => {
        const newFiles = Array.from(selectedFiles).filter(f => f.type === 'application/pdf');
        // Prevent duplicates
        const uniqueFiles = newFiles.filter(nf => !files.some(ef => ef.name === nf.name && ef.size === nf.size));
        setFiles(prev => [...prev, ...uniqueFiles]);
        setOutput(null);
        setError('');
    };
    
    const handleSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const newFiles = [...files];
        const draggedItemContent = newFiles.splice(dragItem.current, 1)[0];
        newFiles.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setFiles(newFiles);
    };

    const handleProcess = () => {
        if (files.length === 0) return;
        setOutput(null);
        setError('');

        if (action === 'merge') handleMerge();
        if (action === 'compress') handleCompress();
        if (action === 'text') handleExtractText();
    };

    const handleMerge = async () => {
        setIsProcessing(true);
        setProcessingMessage('Merging PDFs...');
        try {
            const { PDFDocument } = await loadPdfLib();
            const mergedPdf = await PDFDocument.create();
            for (const file of files) {
                const pdfBytes = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));
            }
            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            setOutput({ name: 'merged_document.pdf', url: URL.createObjectURL(blob) });
        } catch (e: any) {
            setError(`Failed to merge PDFs: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCompress = async () => {
        setIsProcessing(true);
        const results: CompressOutput[] = [];
        try {
            const { PDFDocument } = await loadPdfLib();
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setProcessingMessage(`Compressing file ${i + 1} of ${files.length}...`);
                const existingPdfBytes = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
                const pdfBytes = await pdfDoc.save();
                const originalSize = file.size;
                const newSize = pdfBytes.byteLength;
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                results.push({
                    originalName: file.name,
                    newName: `compressed_${file.name}`,
                    url: URL.createObjectURL(blob),
                    originalSize,
                    newSize,
                });
            }
            setOutput(results);
        } catch (e: any) {
            setError(`Failed to compress a file: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExtractText = async () => {
        setIsProcessing(true);
        const results: TextOutput[] = [];
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setProcessingMessage(`Extracting text from file ${i + 1} of ${files.length}...`);
                const pdfPart = await fileToGenerativePart(file);
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: { parts: [pdfPart, { text: "Extract all text content from the provided PDF as plain text. Do not include any commentary." }] },
                });
                results.push({ fileName: file.name, text: response.text });
            }
            setOutput(results);
        } catch (e: any) {
            setError(`AI text extraction failed: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const actionButtonText = {
        merge: 'Merge PDFs',
        compress: 'Compress PDFs',
        text: 'Extract Text with AI',
    };

    return (
        <ToolPageLayout
            title="Batch PDF Processor"
            description="Apply actions like merging, compressing, or AI text extraction to multiple PDFs at once."
        >
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div onDrop={(e) => { e.preventDefault(); handleFilesSelected(e.dataTransfer.files); }} onDragOver={(e) => e.preventDefault()}
                        className="border-2 border-dashed border-brand-border rounded-lg p-8 text-center">
                        <label className="cursor-pointer font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover px-5 py-2 rounded-md transition-colors">
                            Select PDF(s)
                            <input type="file" accept=".pdf" multiple onChange={(e) => handleFilesSelected(e.target.files!)} className="hidden" />
                        </label>
                        <p className="mt-2 text-brand-text-secondary">or drag & drop here</p>
                    </div>
                    {files.length > 0 && (
                        <div className="space-y-3">
                            {files.map((file, index) => (
                                <FileListItem key={`${file.name}-${file.size}`} file={file}
                                    onRemove={() => setFiles(files.filter((_, i) => i !== index))}
                                    isDraggable={action === 'merge'}
                                    onDragStart={() => dragItem.current = index}
                                    onDragEnter={() => dragOverItem.current = index}
                                    onDragEnd={handleSort}
                                    onDragOver={(e) => e.preventDefault()}
                                />
                            ))}
                        </div>
                    )}
                    <div className="space-y-4 bg-brand-bg p-4 rounded-md">
                        <h3 className="font-semibold text-lg text-brand-text-primary">Batch Action</h3>
                        <select value={action} onChange={(e) => setAction(e.target.value as Action)} className="w-full p-3 bg-brand-surface border border-brand-border rounded-md">
                            <option value="merge">Merge all into one PDF</option>
                            <option value="compress">Compress all files individually</option>
                            <option value="text">Extract text from all files</option>
                        </select>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="bg-brand-bg p-6 rounded-lg min-h-[30rem] flex flex-col h-full">
                        <div className="flex-grow flex items-center justify-center">
                            {isProcessing ? (
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto"></div>
                                    <p className="mt-4 text-brand-text-secondary">{processingMessage}</p>
                                </div>
                            ) : error ? (
                                <p className="text-red-500">{error}</p>
                            ) : output ? (
                                <OutputDisplay output={output} action={action} />
                            ) : (
                                <p className="text-brand-text-secondary text-center">Upload files and select an action to begin.</p>
                            )}
                        </div>
                        <div className="border-t border-brand-border pt-4 mt-4">
                            <button onClick={handleProcess} disabled={files.length === 0 || isProcessing}
                                className="w-full bg-brand-primary text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-brand-primary-hover disabled:bg-gray-600">
                                {isProcessing ? 'Processing...' : actionButtonText[action]}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ToolPageLayout>
    );
};

// --- OUTPUT DISPLAY COMPONENT ---
const OutputDisplay: React.FC<{ output: any, action: Action }> = ({ output, action }) => {
    if (action === 'merge' && output.url) {
        return <DownloadLink name={output.name} url={output.url} title="Merge Complete!" />;
    }

    if (action === 'compress' && Array.isArray(output)) {
        return (
            <div className="w-full space-y-3">
                <h3 className="text-lg font-semibold text-center mb-4">Compression Results</h3>
                {output.map((item: CompressOutput, index: number) => {
                    const reduction = Math.round((1 - item.newSize / item.originalSize) * 100);
                    return (
                        <div key={index} className="bg-brand-surface p-3 rounded-md flex justify-between items-center text-sm">
                            <div className="truncate pr-4">
                                <p className="font-semibold text-brand-text-primary truncate">{item.originalName}</p>
                                <p className="text-xs text-brand-text-secondary">
                                    {formatBytes(item.originalSize)} → {formatBytes(item.newSize)}
                                    <span className="text-green-400 ml-2">({reduction}% reduction)</span>
                                </p>
                            </div>
                            <a href={item.url} download={item.newName} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 whitespace-nowrap">Download</a>
                        </div>
                    );
                })}
            </div>
        );
    }
    
    if (action === 'text' && Array.isArray(output)) {
        const [openAccordion, setOpenAccordion] = useState<number | null>(0);
        return (
             <div className="w-full space-y-2">
                 <h3 className="text-lg font-semibold text-center mb-4">Extracted Text</h3>
                 {output.map((item: TextOutput, index: number) => (
                    <div key={index} className="rounded-md overflow-hidden bg-brand-surface">
                        <button onClick={() => setOpenAccordion(openAccordion === index ? null : index)} className="w-full text-left p-3 font-semibold flex justify-between items-center">
                            <span className="truncate">{item.fileName}</span>
                            <span>{openAccordion === index ? '−' : '+'}</span>
                        </button>
                        {openAccordion === index && (
                             <div className="p-3 border-t border-brand-border">
                                <textarea readOnly value={item.text} className="w-full h-40 bg-brand-bg p-2 rounded text-xs font-mono"></textarea>
                                 <div className="flex justify-end gap-2 mt-2">
                                     <button onClick={() => navigator.clipboard.writeText(item.text)} className="bg-brand-primary text-white px-3 py-1 text-xs rounded">Copy</button>
                                     <a href={URL.createObjectURL(new Blob([item.text], { type: 'text/plain' }))} download={`${item.fileName}.txt`} className="bg-green-600 text-white px-3 py-1 text-xs rounded">Download</a>
                                 </div>
                             </div>
                        )}
                    </div>
                 ))}
             </div>
        );
    }

    return <p className="text-brand-text-secondary text-center">Processing finished. Results will appear here.</p>;
};

const DownloadLink: React.FC<{ name: string, url: string, title: string }> = ({ name, url, title }) => (
    <div className="space-y-4 text-center">
        <h3 className="font-semibold text-lg text-brand-text-primary">{title}</h3>
        <div className="bg-brand-surface p-4 rounded-md flex items-center justify-between">
            <span className="truncate">{name}</span>
            <a href={url} download={name} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Download</a>
        </div>
    </div>
);

export default BatchPdfProcessor;