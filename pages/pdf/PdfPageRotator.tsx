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
    rotation: number;
    thumbnailUrl: string;
}

const PdfPageRotator: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<Page[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [error, setError] = useState('');
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    
    const longDescription = (
        <>
            <p>
              Easily correct the orientation of your PDF pages with our intuitive PDF Page Rotator. Scanned documents often end up with pages that are upside down or sideways, making them difficult to read. Our tool provides a simple, visual solution to this common problem. After uploading your PDF, you'll see a thumbnail preview of every page in your document. From there, you can rotate individual pages with a single click or use the 'Rotate All' function to apply a rotation to the entire document at once.
            </p>
            <p>
              The visual interface allows you to see the changes in real-time, ensuring you get the orientation just right before you apply the final changes. It's the perfect tool for fixing scanned reports, receipts, or any document with orientation issues. The entire process is quick, secure, and happens directly in your browser.
            </p>
        </>
    );

    const handleFileChange = async (selectedFile: File | null) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        setPages([]);
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
                
                loadedPages.push({
                    id: i,
                    rotation: page.rotate,
                    thumbnailUrl: canvas.toDataURL(),
                });
            }
            setPages(loadedPages);
        } catch (e: any) {
            setError('Failed to load PDF. It may be encrypted or corrupted.');
        } finally {
            setIsProcessing(false);
        }
    };

    const rotatePage = (id: number, angle: number) => {
        setPages(pages.map(p => p.id === id ? { ...p, rotation: (p.rotation + angle + 360) % 360 } : p));
    };

    const rotateAll = (angle: number) => {
        setPages(pages.map(p => ({ ...p, rotation: (p.rotation + angle + 360) % 360 })));
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true);
        setProcessingMessage('Applying rotations...');
        setError('');
        try {
            const { PDFDocument, degrees } = await loadPdfLib();
            const existingPdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            
            pages.forEach((pageInfo, index) => {
                const page = pdfDoc.getPage(index);
                page.setRotation(degrees(pageInfo.rotation));
            });

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
        <ToolPageLayout title="PDF Page Rotator" description="Visually rotate pages in your PDF document." longDescription={longDescription}>
            {!file ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] bg-brand-surface p-10 rounded-lg text-center">
                    <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} className="block w-full max-w-sm text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20"/>
                    {error && <p className="mt-4 text-red-500">{error}</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap justify-between items-center bg-brand-bg p-2 rounded-md">
                        <div>
                             <span className="font-semibold mr-4">Rotate all pages:</span>
                             <button onClick={() => rotateAll(-90)} className="p-2 hover:bg-brand-border rounded-full">↶</button>
                             <button onClick={() => rotateAll(90)} className="p-2 hover:bg-brand-border rounded-full">↷</button>
                        </div>
                         <button onClick={handleProcess} disabled={isProcessing} className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-primary-hover disabled:bg-gray-600">
                             {isProcessing ? 'Processing...' : 'Apply Changes'}
                         </button>
                    </div>

                    {isProcessing && !outputUrl && <div className="text-center">{processingMessage}</div>}

                    {outputUrl && (
                        <div className="bg-green-500/10 border border-green-500 p-4 rounded-lg text-center">
                            <a href={outputUrl} download={`rotated_${file.name}`} className="font-semibold text-green-300">Download Rotated PDF</a>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {pages.map(page => (
                            <div key={page.id} className="group relative">
                                <img src={page.thumbnailUrl} alt={`Page ${page.id}`} style={{ transform: `rotate(${page.rotation}deg)` }} className="w-full border-2 border-brand-border rounded-md transition-transform" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => rotatePage(page.id, -90)} className="bg-black/50 text-white rounded-full p-2">↶</button>
                                        <button onClick={() => rotatePage(page.id, 90)} className="bg-black/50 text-white rounded-full p-2">↷</button>
                                    </div>
                                    <p className="text-white text-xs text-center bg-black/70 rounded-full px-2 py-1">Page {page.id}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </ToolPageLayout>
    );
};

export default PdfPageRotator;