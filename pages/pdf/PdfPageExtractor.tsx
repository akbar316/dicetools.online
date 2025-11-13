import React, { useState, useEffect } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

// --- DYNAMIC LIBRARY LOADING ---
declare global {
    interface Window {
        pdfjsLib: any;
        pdfLib: any;
    }
}
const loadPdfJs = async () => {
    if (window.pdfjsLib) return window.pdfjsLib;
    const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;
    window.pdfjsLib = pdfjs;
    return window.pdfjsLib;
};
const loadPdfLib = async () => {
    if (window.pdfLib) return window.pdfLib;
    const pdfLibModule = await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.js');
    window.pdfLib = pdfLibModule;
    return window.pdfLib;
};
// --- END DYNAMIC LIBRARY LOADING ---

interface Page {
    id: number;
    thumbnailUrl: string;
}

const PdfPageExtractor: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<Page[]>([]);
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [error, setError] = useState('');
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    
    const longDescription = (
        <>
            <p>
              Create new, focused PDF documents by extracting specific pages from a larger file with our intuitive PDF Page Extractor. This tool is perfect for when you only need a portion of a document, such as a single chapter from a book, specific slides from a presentation, or a relevant section from a long report. After uploading your PDF, you'll see a visual gallery of all the pages. Simply click to select the pages you want to include in your new document.
            </p>
            <p>
              You can choose as many pages as you like, in any order. Once you've made your selection, the tool gathers the chosen pages and compiles them into a brand new PDF file, ready for you to download. This is a powerful way to repurpose content and share only the most relevant information. The process is fast, secure, and performed entirely within your browser.
            </p>
        </>
    );

    const handleFileChange = async (selectedFile: File | null) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        setPages([]);
        setSelectedPages(new Set());
        setError('');
        setOutputUrl(null);
        setIsProcessing(true);
        setProcessingMessage('Loading thumbnails...');
        try {
            const pdfjs = await loadPdfJs();
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            
            const loadedPages: Page[] = [];
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.5 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext('2d')!;
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                loadedPages.push({ id: i, thumbnailUrl: canvas.toDataURL() });
            }
            setPages(loadedPages);
        } catch (e: any) {
            setError('Failed to load PDF. It may be encrypted or corrupted.');
        } finally {
            setIsProcessing(false);
        }
    };

    const togglePageSelection = (id: number) => {
        const newSelection = new Set(selectedPages);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedPages(newSelection);
    };

    const handleProcess = async () => {
        if (!file || selectedPages.size === 0) return;
        setIsProcessing(true);
        setProcessingMessage('Extracting pages...');
        setError('');
        try {
            const { PDFDocument } = await loadPdfLib();
            const existingPdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            
            const newPdf = await PDFDocument.create();
            // FIX: Explicitly type map parameter to resolve arithmetic operation error.
            const pagesToCopy = Array.from(selectedPages).map((p: number) => p - 1); // 0-indexed
            const copiedPages = await newPdf.copyPages(pdfDoc, pagesToCopy);
            copiedPages.forEach(page => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            if (outputUrl) URL.revokeObjectURL(outputUrl);
            setOutputUrl(URL.createObjectURL(blob));
        } catch (e: any) {
            setError(`Failed to save PDF: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <ToolPageLayout title="PDF Page Extractor" description="Visually select pages to create a new PDF." longDescription={longDescription}>
            {!file ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] bg-brand-surface p-10 rounded-lg text-center">
                    <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} className="block w-full max-w-sm text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20"/>
                    {error && <p className="mt-4 text-red-500">{error}</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap justify-between items-center bg-brand-bg p-2 rounded-md">
                        <p className="font-semibold">{selectedPages.size} page(s) selected for extraction</p>
                         <button onClick={handleProcess} disabled={isProcessing || selectedPages.size === 0} className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-primary-hover disabled:bg-gray-600">
                             {isProcessing ? 'Processing...' : 'Extract & Download'}
                         </button>
                    </div>

                    {isProcessing && !outputUrl && <div className="text-center">{processingMessage}</div>}

                    {outputUrl && (
                        <div className="bg-green-500/10 border border-green-500 p-4 rounded-lg text-center">
                            <a href={outputUrl} download={`extracted_${file.name}`} className="font-semibold text-green-300">Download Extracted PDF</a>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {pages.map(page => (
                            <div key={page.id} onClick={() => togglePageSelection(page.id)} className="group relative cursor-pointer">
                                <img src={page.thumbnailUrl} alt={`Page ${page.id}`} className={`w-full border-4 rounded-md transition-all ${selectedPages.has(page.id) ? 'border-brand-primary' : 'border-brand-border'}`} />
                                {selectedPages.has(page.id) && (
                                    <div className="absolute inset-0 bg-brand-primary/70 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                )}
                                <p className="text-white text-xs text-center bg-black/70 rounded-full px-2 py-1 absolute bottom-1 left-1/2 -translate-x-1/2">{page.id}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </ToolPageLayout>
    );
};

export default PdfPageExtractor;