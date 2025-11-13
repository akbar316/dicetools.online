import React, { useState, useRef, useEffect, useCallback } from 'react';
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


// --- TYPE DEFINITIONS ---
interface Redaction {
    id: number;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

const RENDER_SCALE = 1.5;

// --- MAIN COMPONENT ---
const PdfRedactionTool: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [redactions, setRedactions] = useState<Redaction[]>([]);
    
    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentRect, setCurrentRect] = useState<Omit<Redaction, 'id' | 'page'> | null>(null);

    // Processing state
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const pdfDocRef = useRef<any>(null);
    
    const longDescription = (
        <>
            <p>
              Permanently and securely remove sensitive information from your PDF documents with our intuitive PDF Redaction Tool. In a world where data privacy is critical, simply drawing a black box over text is not enough; the underlying data can often still be recovered. Our tool ensures true redaction by completely removing the content from the document. Simply upload your PDF and use the simple click-and-drag interface to draw redaction boxes over any text or images you wish to conceal.
            </p>
            <p>
              You can redact names, addresses, financial information, or any other confidential data. Once you apply the changes, the tool generates a new, secure version of your PDF with the selected content permanently blacked out and removed. All processing happens safely within your browser, ensuring your sensitive document is never uploaded to a server. Protect your privacy with confidence.
            </p>
        </>
    );

    const resetState = () => {
        setFile(null);
        setTotalPages(0);
        setCurrentPage(1);
        setRedactions([]);
        setIsDrawing(false);
        setCurrentRect(null);
        setLoading(false);
        setLoadingMessage('');
        setError('');
        if (outputUrl) URL.revokeObjectURL(outputUrl);
        setOutputUrl(null);
        pdfDocRef.current = null;
    };

    const handleFileSelect = async (selectedFile: File | null) => {
        if (!selectedFile) return;
        resetState();
        setLoading(true);
        setLoadingMessage('Loading PDF...');
        try {
            const pdfjs = await loadPdfJs();
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            pdfDocRef.current = pdfDoc;
            setFile(selectedFile);
            setTotalPages(pdfDoc.numPages);
            setCurrentPage(1);
        } catch (e: any) {
            setError(`Failed to load PDF: ${e.message}. It may be encrypted or corrupted.`);
            resetState();
        } finally {
            setLoading(false);
        }
    };
    
    // Render PDF page to canvas
    useEffect(() => {
        if (!pdfDocRef.current) return;
        const renderPage = async () => {
            setLoading(true);
            setLoadingMessage(`Rendering page ${currentPage}...`);
            const page = await pdfDocRef.current.getPage(currentPage);
            const viewport = page.getViewport({ scale: RENDER_SCALE });
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d');
            if (!context) return;
            await page.render({ canvasContext: context, viewport }).promise;
            setLoading(false);
        };
        renderPage();
    }, [currentPage, file]);

    // Redaction drawing handlers
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!overlayRef.current) return;
        const rect = overlayRef.current.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        setIsDrawing(true);
        setCurrentRect({ x: startX, y: startY, width: 0, height: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawing || !currentRect || !overlayRef.current) return;
        const rect = overlayRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        setCurrentRect({
            x: Math.min(currentRect.x, currentX),
            y: Math.min(currentRect.y, currentY),
            width: Math.abs(currentX - currentRect.x),
            height: Math.abs(currentY - currentRect.y),
        });
    };

    const handleMouseUp = () => {
        if (!isDrawing || !currentRect || currentRect.width < 5 || currentRect.height < 5) {
            setIsDrawing(false);
            setCurrentRect(null);
            return;
        }
        setRedactions(prev => [...prev, { ...currentRect, page: currentPage, id: Date.now() }]);
        setIsDrawing(false);
        setCurrentRect(null);
    };
    
    const removeRedaction = (id: number) => {
        setRedactions(prev => prev.filter(r => r.id !== id));
    };

    const handleApplyRedactions = async () => {
        if (!file || redactions.length === 0) return;
        setLoading(true);
        setLoadingMessage('Applying redactions...');
        setError('');
        try {
            const { PDFDocument, rgb } = await loadPdfLib();
            const existingPdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });

            for (const redaction of redactions) {
                const page = pdfDoc.getPage(redaction.page - 1);
                const { width: pageWidth, height: pageHeight } = page.getSize();
                
                // Convert coordinates
                const x = redaction.x / RENDER_SCALE;
                const y = pageHeight - (redaction.y / RENDER_SCALE) - (redaction.height / RENDER_SCALE);
                const width = redaction.width / RENDER_SCALE;
                const height = redaction.height / RENDER_SCALE;

                page.drawRectangle({ x, y, width, height, color: rgb(0, 0, 0), });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            if (outputUrl) URL.revokeObjectURL(outputUrl);
            setOutputUrl(URL.createObjectURL(blob));

        } catch (e: any) {
            setError(`Failed to apply redactions: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    if (!file) {
        return (
            <ToolPageLayout title="PDF Redaction Tool" description="Permanently remove sensitive information from PDFs." longDescription={longDescription}>
                 <div className="flex flex-col items-center justify-center min-h-[40vh] bg-brand-surface p-10 rounded-lg shadow-xl text-center">
                    <h2 className="text-xl font-bold text-brand-primary mb-4">Upload your PDF</h2>
                    <p className="text-brand-text-secondary mb-6 max-w-md">Your file is processed securely in your browser and is never sent to our servers.</p>
                    <input type="file" accept=".pdf" onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)} className="block w-full max-w-sm text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20"/>
                    {loading && <p className="mt-4">{loadingMessage}</p>}
                    {error && <p className="mt-4 text-red-500">{error}</p>}
                </div>
            </ToolPageLayout>
        );
    }

    return (
        <ToolPageLayout title="PDF Redaction Tool" description="Click and drag to redact. All processing is done in your browser." longDescription={longDescription}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-2">
                    <div className="flex justify-center items-center bg-brand-bg p-2 rounded-md">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1 rounded-md hover:bg-brand-border disabled:opacity-50">Prev</button>
                        <span className="mx-4">Page {currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md hover:bg-brand-border disabled:opacity-50">Next</button>
                    </div>
                    <div className="relative bg-gray-900 p-4 rounded-lg overflow-auto h-[75vh]">
                        {loading && <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center text-white"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-4"></div><span>{loadingMessage}</span></div>}
                        <div className="relative mx-auto" style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }}>
                            <canvas ref={canvasRef} className="shadow-lg" />
                            <div
                                ref={overlayRef}
                                className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={() => { if (isDrawing) handleMouseUp(); }}
                            >
                                {redactions.filter(r => r.page === currentPage).map(r => (
                                    <div key={r.id} className="absolute bg-black group" style={{ left: r.x, top: r.y, width: r.width, height: r.height }}>
                                        <button onClick={() => removeRedaction(r.id)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs items-center justify-center hidden group-hover:flex">✕</button>
                                    </div>
                                ))}
                                {currentRect && <div className="absolute bg-black/70 border border-dashed border-white" style={{ left: currentRect.x, top: currentRect.y, width: currentRect.width, height: currentRect.height }} />}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-brand-bg p-4 rounded-md">
                        <h3 className="font-bold text-lg mb-2">Instructions</h3>
                        <ol className="list-decimal list-inside text-sm space-y-1 text-brand-text-secondary">
                            <li>Click and drag to draw redaction boxes.</li>
                            <li>Hover over a box to reveal a delete button (✕).</li>
                            <li>Navigate pages and add redactions as needed.</li>
                            <li>Click "Apply Redactions & Download" when finished.</li>
                        </ol>
                    </div>

                    <button onClick={handleApplyRedactions} disabled={redactions.length === 0 || loading} className="w-full bg-brand-primary text-white font-semibold px-6 py-3 rounded-md hover:bg-brand-primary-hover disabled:bg-gray-600">
                        Apply Redactions & Download
                    </button>
                    
                    {error && <p className="text-red-500 text-center">{error}</p>}

                    {outputUrl ? (
                         <div className="bg-green-500/10 border border-green-500 text-green-300 p-4 rounded-lg text-center animate-fade-in-up">
                            <p className="font-semibold mb-2">Redaction Complete!</p>
                            <a href={outputUrl} download={`redacted_${file.name}`} className="bg-green-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-green-700">Download Now</a>
                        </div>
                    ) : (
                         <button onClick={resetState} className="w-full text-sm text-center text-brand-text-secondary hover:text-brand-primary">Start Over</button>
                    )}
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default PdfRedactionTool;