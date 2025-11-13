import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// --- TYPE DEFINITIONS & HELPERS ---
interface TextBlock {
    id: string;
    x: number;
    y: number;
    y_baseline: number;
    width: number;
    height: number;
    original_text: string;
    editable_text: string;
    font: string;
    // New properties
    fontSize: number;
    color: [number, number, number]; // RGB 0-1
    textAlign: 'left' | 'center' | 'right';
    isNew?: boolean;
}

interface PageData {
    page_number: number;
    text_blocks: TextBlock[];
}

interface UploadResponse {
    file_upload_url: string;
    page_count: number;
    pages: PageData[];
}

interface EditChange {
    block_id: string;
    new_text: string;
}

const hexToRgbLib = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];
    return [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
    ];
};

const rgbLibToHex = (rgb: [number, number, number]): string => {
    const toHex = (c: number) => ('0' + Math.round(c * 255).toString(16)).slice(-2);
    return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
};


// --- MAIN COMPONENT ---
const PdfTextEditor: React.FC = () => {
    const [stage, setStage] = useState<'upload' | 'editing' | 'done'>('upload');
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [processingData, setProcessingData] = useState<UploadResponse | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    
    const [toolMode, setToolMode] = useState<'select' | 'addText'>('select');
    const [formatPainter, setFormatPainter] = useState<{ active: boolean; sourceStyle: any | null }>({ active: false, sourceStyle: null });

    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [editedFileUrl, setEditedFileUrl] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const renderTaskRef = useRef<any>(null);
    
    const longDescription = (
      <>
        <p>
          Make quick corrections and updates to your PDF documents with our innovative PDF Text Editor. This powerful tool provides a unique solution for editing text directly within your PDF, bridging the gap between static documents and editable files. After uploading your file, the tool analyzes its structure and identifies individual text blocks, allowing you to click and edit them inline. It's the perfect way to fix typos, update names and dates, or make minor content changes without needing to convert the entire document to another format.
        </p>
        <p>
          In addition to editing existing text, you can add new text boxes, adjust font properties like size and color, and even use our format painter to quickly copy styles. The editor is designed to preserve the original layout of your document as much as possible, offering a seamless and intuitive editing experience directly in your browser. All your edits are applied securely on your device, ensuring your document's privacy.
        </p>
      </>
    );

    // --- PDF PROCESSING LOGIC ---
    const processPdf = async (file: File) => {
        setLoading(true);
        setLoadingMessage('Analyzing PDF...');
        setError(null);
        try {
            const pdfjs = await loadPdfJs();
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;

            const response: UploadResponse = {
                file_upload_url: `https://…/upload/${file.name}`,
                page_count: pdfDoc.numPages,
                pages: [],
            };

            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent();
                const viewport = page.getViewport({ scale: 1.0 });

                const pageData: PageData = {
                    page_number: i,
                    text_blocks: textContent.items.map((item: any, index: number) => {
                        const tx = item.transform;
                        const y_baseline = tx[5];
                        const y = viewport.height - y_baseline - (item.height * 0.2); 
                        
                        return {
                            id: `p${i}-b${index}`, x: tx[4], y, y_baseline,
                            width: item.width, height: item.height, original_text: item.str, editable_text: item.str, font: item.fontName,
                            fontSize: item.height, color: [0, 0, 0], textAlign: 'left',
                        };
                    }),
                };
                response.pages.push(pageData);
            }
            setProcessingData(response);
            setOriginalFile(file);
            setStage('editing');

        } catch (e: any) {
            setError(`Failed to process PDF: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (selectedFile: File | null) => {
        if (!selectedFile) return;
        if (selectedFile.type !== 'application/pdf') { setError('Invalid file format. Please upload a PDF.'); return; }
        if (selectedFile.size > 50 * 1024 * 1024) { setError('File size exceeds 50MB limit.'); return; }
        processPdf(selectedFile);
    };

    // --- RENDER PDF PAGE ---
    useEffect(() => {
        if (stage !== 'editing' || !originalFile) return;
        let isCancelled = false;
        const render = async () => {
            try {
                if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; }
                const pdfjs = await loadPdfJs();
                const arrayBuffer = await originalFile.arrayBuffer();
                const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                if (isCancelled) return;
                const page = await pdfDoc.getPage(currentPage);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = canvasRef.current;
                if (!canvas) return;
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext('2d');
                if (!context) return;
                const renderTask = page.render({ canvasContext: context, viewport });
                renderTaskRef.current = renderTask;
                await renderTask.promise;
                if (!isCancelled) { renderTaskRef.current = null; }
            } catch (e: any) {
                if (!isCancelled && e.name !== 'RenderingCancelledException') { setError("Failed to render PDF page."); }
            }
        };
        render();
        return () => { isCancelled = true; if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; } };
    }, [stage, originalFile, currentPage]);

    // --- EDITING & TOOL LOGIC ---
    const updateBlock = (blockId: string, updates: Partial<TextBlock>) => {
        if (!processingData) return;
        const updatedPages = processingData.pages.map(p => ({
            ...p,
            text_blocks: p.text_blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
        }));
        setProcessingData({ ...processingData, pages: updatedPages });
    };

    const handleBlockClick = (block: TextBlock) => {
        if (formatPainter.active && formatPainter.sourceStyle) {
            updateBlock(block.id, formatPainter.sourceStyle);
            setFormatPainter({ active: false, sourceStyle: null });
        } else {
            setSelectedBlockId(block.id);
        }
    };
    
    const handleCopyStyle = () => {
        const block = processingData?.pages.flatMap(p => p.text_blocks).find(b => b.id === selectedBlockId);
        if (block) {
            setFormatPainter({
                active: true,
                sourceStyle: { fontSize: block.fontSize, color: block.color, textAlign: block.textAlign },
            });
            setSelectedBlockId(null);
        }
    };
    
    const handleAddText = (e: React.MouseEvent<HTMLDivElement>) => {
        if (toolMode !== 'addText' || !editorContainerRef.current || !canvasRef.current || !processingData) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / 1.5; // Un-scale
        const y_css = (e.clientY - rect.top) / 1.5;
        const y_baseline = (canvasRef.current.height - (e.clientY - rect.top)) / 1.5;

        const newBlock: TextBlock = {
            id: `new-${Date.now()}`, x, y: y_css, y_baseline,
            width: 100, height: 12, original_text: '', editable_text: 'New Text',
            font: 'Helvetica', fontSize: 12, color: [0, 0, 0], textAlign: 'left', isNew: true,
        };
        
        const updatedPages = processingData.pages.map(p => p.page_number === currentPage ? {...p, text_blocks: [...p.text_blocks, newBlock]} : p);
        setProcessingData({...processingData, pages: updatedPages});
        setToolMode('select');
        setSelectedBlockId(newBlock.id);
    };

    // --- SUBMIT & DOWNLOAD LOGIC ---
    const handleSubmitEdits = async () => {
        if (!originalFile || !processingData) return;
        setLoading(true);
        setError(null);
        setLoadingMessage('Applying edits...');
        try {
            const { PDFDocument, rgb, StandardFonts } = await loadPdfLib();
            const existingPdfBytes = await originalFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            for(const pageData of processingData.pages) {
                const page = pdfDoc.getPage(pageData.page_number - 1);
                
                for(const block of pageData.text_blocks) {
                    if(block.original_text !== block.editable_text || block.isNew) {
                         if (!block.isNew) { // Cover original text
                            page.drawRectangle({
                                x: block.x, y: block.y_baseline - (block.height * 0.25),
                                width: block.width, height: block.height, color: rgb(1, 1, 1),
                            });
                        }
                        
                        // Calculate x for alignment
                        const textWidth = font.widthOfTextAtSize(block.editable_text, block.fontSize);
                        let textX = block.x;
                        if(block.textAlign === 'center') textX = block.x + (block.width / 2) - (textWidth / 2);
                        else if(block.textAlign === 'right') textX = block.x + block.width - textWidth;

                        page.drawText(block.editable_text, {
                            x: textX, y: block.y_baseline, font, size: block.fontSize,
                            color: rgb(block.color[0], block.color[1], block.color[2]),
                        });
                    }
                }
            }
            
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            if (editedFileUrl) URL.revokeObjectURL(editedFileUrl);
            const newUrl = URL.createObjectURL(blob);
            setEditedFileUrl(newUrl);
            setStage('done');
        } catch (e: any) {
            setError(`Failed to save PDF: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // --- RENDER STAGES ---
    if (stage === 'upload') return (
        <ToolPageLayout title="PDF Text Editor" description="Upload a PDF to begin editing its text content." longDescription={longDescription}>
             <div className="flex flex-col items-center justify-center min-h-[40vh] bg-brand-surface p-10 rounded-lg shadow-xl text-center">
                <h2 className="text-xl font-bold text-brand-primary mb-4">Upload your PDF</h2>
                <p className="text-brand-text-secondary mb-6 max-w-md">The tool will analyze your document and extract text blocks for you to edit.</p>
                <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e.target.files ? e.target.files[0] : null)} className="block w-full max-w-sm text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20"/>
                {loading && <p className="mt-4">{loadingMessage}</p>}
                {error && <p className="mt-4 text-red-500">{error}</p>}
            </div>
        </ToolPageLayout>
    );

    if (stage === 'done') return (
         <ToolPageLayout title="PDF Text Editor" description="Your edits have been applied." longDescription={longDescription}>
             <div className="flex flex-col items-center justify-center min-h-[40vh] bg-brand-surface p-10 rounded-lg shadow-xl text-center">
                <h2 className="text-xl font-bold text-green-500 mb-4">Processing Complete!</h2>
                <a href={editedFileUrl!} download={`edited_${originalFile?.name}`} className="bg-green-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-green-700">Download Edited PDF</a>
                <button onClick={() => { setStage('upload'); setProcessingData(null); setOriginalFile(null); }} className="mt-4 text-brand-primary hover:underline">Edit another file</button>
             </div>
         </ToolPageLayout>
    );
    
    const currentPageBlocks = processingData?.pages.find(p => p.page_number === currentPage)?.text_blocks || [];
    const selectedBlock = currentPageBlocks.find(b => b.id === selectedBlockId);

    return (
        <ToolPageLayout title="PDF Text Editor" description="Select or add text, then submit your changes." longDescription={longDescription}>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-2">
                    <div className="flex justify-between items-center bg-brand-bg p-2 rounded-md">
                        <div className="flex items-center gap-2">
                             {['select', 'addText'].map(mode => (
                                 <button key={mode} onClick={() => { setToolMode(mode as any); setFormatPainter({ active: false, sourceStyle: null }); }} className={`px-3 py-1 text-sm rounded-md ${toolMode === mode ? 'bg-brand-primary text-white' : 'bg-brand-surface hover:bg-brand-border'}`}>
                                     {mode === 'select' ? 'Select' : 'Add Text'}
                                 </button>
                             ))}
                             <button onClick={handleCopyStyle} disabled={!selectedBlock} className="px-3 py-1 text-sm rounded-md bg-brand-surface hover:bg-brand-border disabled:opacity-50">Copy Style</button>
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1 rounded-md hover:bg-brand-border disabled:opacity-50">Prev</button>
                             <span>Page {currentPage} / {processingData?.page_count}</span>
                             <button onClick={() => setCurrentPage(p => Math.min(processingData?.page_count || 1, p+1))} disabled={currentPage === processingData?.page_count} className="px-3 py-1 rounded-md hover:bg-brand-border disabled:opacity-50">Next</button>
                        </div>
                    </div>
                    <div ref={editorContainerRef} onClick={handleAddText} className={`relative bg-gray-900 p-4 rounded-lg overflow-auto h-[75vh] ${toolMode === 'addText' ? 'cursor-crosshair' : ''} ${formatPainter.active ? 'cursor-copy' : ''}`}>
                         {loading && <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center text-white"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-4"></div><span>{loadingMessage}</span></div>}
                        <div className="relative mx-auto" style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }}>
                            <canvas ref={canvasRef} className="shadow-lg" />
                            <div className="absolute top-0 left-0 w-full h-full">
                                {currentPageBlocks.map(block => (
                                    <div key={block.id} onClick={(e) => { e.stopPropagation(); handleBlockClick(block); }}
                                        className={`absolute border-2 transition-colors ${selectedBlockId === block.id ? 'border-brand-primary bg-brand-primary/20' : 'border-transparent hover:border-brand-primary/50'} ${toolMode === 'select' ? 'cursor-pointer' : ''}`}
                                        style={{ left: `${block.x * 1.5}px`, top: `${block.y * 1.5}px`, width: `${block.width * 1.5}px`, height: `${block.height * 1.5}px` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-brand-bg p-4 rounded-md min-h-[70vh]">
                         <h3 className="font-bold text-lg mb-2 border-b border-brand-border pb-2">Properties</h3>
                         {selectedBlock ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-brand-text-secondary">Text Content</label>
                                     <textarea value={selectedBlock.editable_text} onChange={(e) => updateBlock(selectedBlockId!, { editable_text: e.target.value })}
                                        className="w-full h-32 p-2 bg-brand-surface border border-brand-border rounded font-mono text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-brand-text-secondary">Font Size</label>
                                        <input type="number" value={selectedBlock.fontSize} onChange={e => updateBlock(selectedBlockId!, { fontSize: parseFloat(e.target.value) || 12 })} className="w-full p-1 bg-brand-surface border border-brand-border rounded" />
                                    </div>
                                     <div>
                                        <label className="text-xs text-brand-text-secondary">Color</label>
                                        <input type="color" value={rgbLibToHex(selectedBlock.color)} onChange={e => updateBlock(selectedBlockId!, { color: hexToRgbLib(e.target.value) })} className="w-full p-1 h-8 bg-brand-surface border border-brand-border rounded" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-brand-text-secondary">Alignment</label>
                                    <div className="flex border border-brand-border rounded-md mt-1">
                                        {['left', 'center', 'right'].map(align => (
                                            <button key={align} onClick={() => updateBlock(selectedBlockId!, {textAlign: align as any})} className={`flex-1 p-1 text-xs ${selectedBlock.textAlign === align ? 'bg-brand-primary' : 'bg-brand-surface hover:bg-brand-border'}`}>{align}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                         ) : (<p className="text-brand-text-secondary text-sm">Select a text block to edit its properties, or use the 'Add Text' tool.</p>)}
                    </div>

                    <button onClick={handleSubmitEdits} disabled={loading} className="w-full bg-green-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-600">
                        Submit Edits & Get PDF
                    </button>
                    {error && <p className="mt-2 text-center text-red-500">{error}</p>}
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default PdfTextEditor;