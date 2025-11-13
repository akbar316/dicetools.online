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

const PdfPageDeleter: React.FC = () => {
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
                Clean up your PDF documents by removing unwanted pages with our simple and visual PDF Page Deleter. Whether you need to get rid of blank pages, remove irrelevant sections, or delete sensitive information, this tool makes the process effortless. After uploading your PDF, you'll be presented with a thumbnail gallery of all its pages. Simply click on the pages you wish to remove; selected pages will be clearly marked for deletion.
            </p>
            <p>
                This visual approach ensures you know exactly which pages are being removed, preventing any accidental deletions. Once you've made your selections, the tool processes the file and generates a new, cleaner version of your PDF without the unwanted pages. It’s an essential utility for refining reports, presentations, and any document that needs a quick cleanup. The entire process is secure and happens within your browser, protecting your data.
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
        setProcessingMessage('Deleting pages...');
        setError('');
        try {
            const { PDFDocument } = await loadPdfLib();
            const existingPdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            
            const pagesToRemove = Array.from(selectedPages).sort((a: number, b: number) => b - a); // Sort descending to not mess up indices
            // FIX: Explicitly typed the 'pageNum' parameter in the forEach callback to resolve the arithmetic operation error.
            pagesToRemove.forEach((pageNum: number) => pdfDoc.removePage(pageNum - 1));

            const pdfBytes = await pdfDoc.save();
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
        <ToolPageLayout title="PDF Page Deleter" description="Visually select and remove pages from your PDF." longDescription={longDescription}>
            {!file ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] bg-brand-surface p-10 rounded-lg text-center">
                    <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} className="block w-full max-w-sm text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20"/>
                    {error && <p className="mt-4 text-red-500">{error}</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap justify-between items-center bg-brand-bg p-2 rounded-md">
                        <p className="font-semibold">{selectedPages.size} page(s) selected for deletion</p>
                         <button onClick={handleProcess} disabled={isProcessing || selectedPages.size === 0} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-600">
                             {isProcessing ? 'Processing...' : 'Delete Pages & Download'}
                         </button>
                    </div>

                    {isProcessing && !outputUrl && <div className="text-center">{processingMessage}</div>}

                    {outputUrl && (
                        <div className="bg-green-500/10 border border-green-500 p-4 rounded-lg text-center">
                            <a href={outputUrl} download={`deleted_${file.name}`} className="font-semibold text-green-300">Download Modified PDF</a>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {pages.map(page => (
                            <div key={page.id} onClick={() => togglePageSelection(page.id)} className="group relative cursor-pointer">
                                <img src={page.thumbnailUrl} alt={`Page ${page.id}`} className={`w-full border-4 rounded-md transition-all ${selectedPages.has(page.id) ? 'border-red-500' : 'border-brand-border'}`} />
                                {selectedPages.has(page.id) && (
                                    <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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

export default PdfPageDeleter;