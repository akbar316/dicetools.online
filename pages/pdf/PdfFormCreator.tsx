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

// --- TYPES ---
type FieldType = 'TextField' | 'CheckBox' | 'StaticText';
interface FormField {
    id: number;
    page: number;
    type: FieldType;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    // Static Text properties
    text?: string;
    font?: string;
    color?: string;
    fontSize?: number;
}

const RENDER_SCALE = 1.5;

const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
    } : { r: 0, g: 0, b: 0 };
};


const PdfFormCreator: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [fields, setFields] = useState<FormField[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
    const [activeTool, setActiveTool] = useState<'select' | FieldType>('select');

    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pdfDocRef = useRef<any>(null);
    
    const longDescription = (
      <>
        <p>
          Transform your static PDFs into interactive, fillable forms with our powerful PDF Form Creator. This advanced tool empowers you to add professional form fields directly onto your existing documents, making them easy for others to fill out digitally. Whether you're creating contracts, application forms, or surveys, you can enhance your PDFs with a variety of field types, including text fields for written responses and checkboxes for simple selections.
        </p>
        <p>
          The intuitive visual editor allows you to place, resize, and configure each field with precision. You can also add non-interactive static text to provide instructions or labels. Once you've designed your form, apply the changes to generate a new, fully interactive PDF ready for distribution. This tool is perfect for businesses, educators, and anyone looking to streamline their data collection process and create more professional, user-friendly documents.
        </p>
      </>
    );

    const resetState = () => {
        setFile(null);
        setTotalPages(0);
        setCurrentPage(1);
        setFields([]);
        setSelectedFieldId(null);
        setActiveTool('select');
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
            setError(`Failed to load PDF: ${e.message}.`);
            resetState();
        } finally {
            setLoading(false);
        }
    };

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
    
    const invalidateOutput = () => {
        if (outputUrl) {
            URL.revokeObjectURL(outputUrl);
            setOutputUrl(null);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (activeTool === 'select' || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let newField: FormField;
        if (activeTool === 'StaticText') {
            newField = {
                id: Date.now(),
                page: currentPage,
                type: activeTool,
                x: x - 75,
                y: y - 20,
                width: 150,
                height: 40,
                name: `static_text_${Date.now()}`,
                text: 'Your Text Here',
                font: 'Helvetica',
                color: '#000000',
                fontSize: 12,
            };
        } else {
             newField = {
                id: Date.now(),
                page: currentPage,
                type: activeTool,
                x: x - (activeTool === 'TextField' ? 75 : 10), // Center the new field
                y: y - 10,
                width: activeTool === 'TextField' ? 150 : 20,
                height: 20,
                name: `${activeTool.toLowerCase()}_${Date.now()}`
            };
        }
        
        setFields(prev => [...prev, newField]);
        setActiveTool('select');
        invalidateOutput();
    };

    const updateField = (id: number, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
        invalidateOutput();
    };

    const deleteField = (id: number) => {
        setFields(fields.filter(f => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
        invalidateOutput();
    };

    const handleApplyChanges = async () => {
        if (!file) return;
        setLoading(true);
        setLoadingMessage('Applying changes...');
        setError('');

        try {
            const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
            const existingPdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            const form = pdfDoc.getForm();

            const fontMap = {
                'Helvetica': StandardFonts.Helvetica,
                'Times-Roman': StandardFonts.TimesRoman,
                'Courier': StandardFonts.Courier,
            };

            for (const field of fields) {
                const page = pdfDoc.getPage(field.page - 1);
                const { height: pageHeight } = page.getSize();
                
                const x = field.x / RENDER_SCALE;
                const fieldHeight = field.height / RENDER_SCALE;
                const y = pageHeight - (field.y / RENDER_SCALE) - fieldHeight;

                switch(field.type) {
                    case 'TextField':
                        const textField = form.createTextField(field.name);
                        textField.setText('');
                        textField.addToPage(page, {
                            x, y,
                            width: field.width / RENDER_SCALE,
                            height: fieldHeight,
                            font: await pdfDoc.embedFont(StandardFonts.Helvetica),
                            borderWidth: 1,
                            borderColor: rgb(0,0,0),
                        });
                        break;
                    case 'CheckBox':
                        const checkBox = form.createCheckBox(field.name);
                        checkBox.addToPage(page, {
                             x, y,
                            width: field.width / RENDER_SCALE,
                            height: fieldHeight,
                            borderWidth: 1,
                            borderColor: rgb(0,0,0),
                        });
                        break;
                    case 'StaticText':
                        if (field.text && field.font && field.fontSize && field.color) {
                            const embeddedFont = await pdfDoc.embedFont(fontMap[field.font as keyof typeof fontMap] || StandardFonts.Helvetica);
                            const colorRgb = hexToRgb(field.color);
                            
                            const text_y_pdf = pageHeight - (field.y / RENDER_SCALE) - (field.fontSize / RENDER_SCALE);

                            page.drawText(field.text, {
                                x: x,
                                y: text_y_pdf,
                                font: embeddedFont,
                                size: field.fontSize / RENDER_SCALE,
                                color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
                                lineHeight: (field.fontSize * 1.2) / RENDER_SCALE,
                            });
                        }
                        break;
                }
            }
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            if (outputUrl) URL.revokeObjectURL(outputUrl);
            setOutputUrl(URL.createObjectURL(blob));

        } catch(e: any) {
            setError(`Failed to save PDF: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!outputUrl || !file) return;
        const a = document.createElement('a');
        a.href = outputUrl;
        a.download = `form_${file.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    
    if (!file) return (
         <ToolPageLayout title="PDF Form Creator" description="Create fillable forms in your PDF documents." longDescription={longDescription}>
             <div className="flex flex-col items-center justify-center min-h-[40vh] bg-brand-surface p-10 rounded-lg shadow-xl text-center">
                <h2 className="text-xl font-bold text-brand-primary mb-4">Upload your PDF</h2>
                <input type="file" accept=".pdf" onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)} className="block w-full max-w-sm text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20"/>
                {loading && <p className="mt-4">{loadingMessage}</p>}
                {error && <p className="mt-4 text-red-500">{error}</p>}
            </div>
        </ToolPageLayout>
    );

    const selectedField = fields.find(f => f.id === selectedFieldId);

    return (
        <ToolPageLayout title="PDF Form Creator" description="Add fields, apply changes, then download your fillable PDF." longDescription={longDescription}>
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-2">
                    <div className="flex justify-between items-center bg-brand-bg p-2 rounded-md">
                        <div className="flex items-center gap-2">
                             <button onClick={() => setActiveTool('select')} className={`px-3 py-1 text-sm rounded-md ${activeTool === 'select' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>Select</button>
                             <button onClick={() => setActiveTool('TextField')} className={`px-3 py-1 text-sm rounded-md ${activeTool === 'TextField' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>+ Text Field</button>
                             <button onClick={() => setActiveTool('CheckBox')} className={`px-3 py-1 text-sm rounded-md ${activeTool === 'CheckBox' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>+ Checkbox</button>
                             <button onClick={() => setActiveTool('StaticText')} className={`px-3 py-1 text-sm rounded-md ${activeTool === 'StaticText' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>+ Static Text</button>
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>Prev</button>
                             <span>Page {currentPage} / {totalPages}</span>
                             <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>Next</button>
                        </div>
                    </div>
                    <div onClick={handleCanvasClick} className={`relative bg-gray-900 p-4 rounded-lg overflow-auto h-[75vh] ${activeTool !== 'select' ? 'cursor-crosshair' : ''}`}>
                         {loading && <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center text-white">{loadingMessage}</div>}
                        <div className="relative mx-auto" style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }}>
                            <canvas ref={canvasRef} className="shadow-lg" />
                             <div className="absolute top-0 left-0 w-full h-full">
                                {fields.filter(f => f.page === currentPage).map(field => (
                                    <DraggableResizableField
                                        key={field.id}
                                        field={field}
                                        isSelected={selectedFieldId === field.id}
                                        onSelect={() => setSelectedFieldId(field.id)}
                                        onUpdate={updateField}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="bg-brand-bg p-4 rounded-md min-h-[65vh]">
                         <h3 className="font-bold text-lg mb-2">Properties</h3>
                         {selectedField ? (
                            <div className="space-y-4">
                                {selectedField.type === 'StaticText' ? (
                                    <>
                                        <div><label className="text-xs">Text</label><textarea value={selectedField.text} onChange={e => updateField(selectedFieldId!, { text: e.target.value })} className="w-full h-24 p-1 bg-brand-surface border-brand-border rounded text-sm" /></div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><label className="text-xs">Font Size</label><input type="number" value={Math.round(selectedField.fontSize || 12)} onChange={e => updateField(selectedFieldId!, { fontSize: parseInt(e.target.value)})} className="w-full p-1 bg-brand-surface border-brand-border rounded" /></div>
                                            <div><label className="text-xs">Color</label><input type="color" value={selectedField.color} onChange={e => updateField(selectedFieldId!, { color: e.target.value })} className="w-full p-1 h-8 bg-brand-surface border-brand-border rounded" /></div>
                                        </div>
                                        <div><label className="text-xs">Font</label>
                                            <select value={selectedField.font} onChange={e => updateField(selectedFieldId!, { font: e.target.value })} className="w-full p-1 bg-brand-surface border-brand-border rounded">
                                                <option value="Helvetica">Helvetica</option>
                                                <option value="Times-Roman">Times New Roman</option>
                                                <option value="Courier">Courier</option>
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div><label className="text-xs">Field Name</label><input type="text" value={selectedField.name} onChange={e => updateField(selectedFieldId!, { name: e.target.value })} className="w-full p-1 bg-brand-surface border-brand-border rounded" /></div>
                                        <div><label className="text-xs">Type</label><p>{selectedField.type}</p></div>
                                    </>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-xs">Width</label><input type="number" value={Math.round(selectedField.width)} onChange={e => updateField(selectedFieldId!, { width: parseInt(e.target.value)})} className="w-full p-1 bg-brand-surface border-brand-border rounded" /></div>
                                    <div><label className="text-xs">Height</label><input type="number" value={Math.round(selectedField.height)} onChange={e => updateField(selectedFieldId!, { height: parseInt(e.target.value)})} className="w-full p-1 bg-brand-surface border-brand-border rounded" /></div>
                                </div>
                                <button onClick={() => deleteField(selectedFieldId!)} className="w-full text-sm text-red-500 hover:underline mt-4">Delete Field</button>
                            </div>
                         ) : <p className="text-sm text-brand-text-secondary">Select a field to edit its properties.</p>}
                    </div>
                    <button onClick={handleApplyChanges} disabled={loading || fields.length === 0} className="w-full bg-brand-primary text-white font-semibold px-6 py-3 rounded-md hover:bg-brand-primary-hover disabled:bg-gray-600">
                        {loading ? 'Applying...' : 'Apply Changes'}
                    </button>
                    <button onClick={handleDownload} disabled={!outputUrl || loading} className="w-full bg-green-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        Download PDF
                    </button>
                    {error && <p className="text-center text-red-500">{error}</p>}
                    {outputUrl && !loading && <p className="text-center text-green-400 text-sm font-semibold">Your form is ready to download.</p>}
                </div>
            </div>
        </ToolPageLayout>
    );
};

// --- Draggable & Resizable Field Component ---
interface DraggableFieldProps {
    field: FormField;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (id: number, updates: Partial<FormField>) => void;
}
const DraggableResizableField: React.FC<DraggableFieldProps> = ({ field, isSelected, onSelect, onUpdate }) => {
    const interactionRef = useRef({ type: '', startX: 0, startY: 0, startW: 0, startH: 0, startFieldX: 0, startFieldY: 0 });

    const handleMouseDown = (e: React.MouseEvent, type: string) => {
        e.stopPropagation();
        onSelect();
        interactionRef.current = {
            type,
            startX: e.clientX,
            startY: e.clientY,
            startW: field.width,
            startH: field.height,
            startFieldX: field.x,
            startFieldY: field.y
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const { type, startX, startY, startW, startH, startFieldX, startFieldY } = interactionRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (type === 'move') {
            onUpdate(field.id, { x: startFieldX + dx, y: startFieldY + dy });
        } else { // Resizing
            let newX = startFieldX;
            let newY = startFieldY;
            let newW = startW;
            let newH = startH;

            if (type.includes('right')) newW = startW + dx;
            if (type.includes('left')) { newW = startW - dx; newX = startFieldX + dx; }
            if (type.includes('bottom')) newH = startH + dy;
            if (type.includes('top')) { newH = startH - dy; newY = startFieldY + dy; }

            onUpdate(field.id, {
                x: newW > 10 ? newX : field.x,
                y: newH > 10 ? newY : field.y,
                width: Math.max(10, newW),
                height: Math.max(10, newH),
            });
        }
    }, [field.id, onUpdate]);

    const handleMouseUp = useCallback(() => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);
    
    const fontMap: { [key: string]: string } = {
        'Helvetica': 'sans-serif',
        'Times-Roman': 'serif',
        'Courier': 'monospace',
    };

    return (
        <div
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            className={`absolute border-2 transition-colors p-1 box-border overflow-hidden ${isSelected ? 'border-brand-primary bg-brand-primary/20' : 'border-dashed border-brand-border/50 hover:border-brand-primary/50'} cursor-move`}
            style={{ left: field.x, top: field.y, width: field.width, height: field.height }}
        >
            {field.type === 'StaticText' && field.text && (
                 <span style={{
                     fontFamily: fontMap[field.font!] || 'sans-serif',
                     fontSize: field.fontSize,
                     color: field.color,
                     whiteSpace: 'pre-wrap',
                     wordBreak: 'break-word',
                 }}>
                    {field.text}
                 </span>
            )}
            {isSelected && (
                <>
                    {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
                         <div key={pos} onMouseDown={(e) => handleMouseDown(e, pos)}
                             className={`absolute w-3 h-3 bg-brand-primary border border-white -m-1.5 cursor-nwse-resize
                                ${pos.includes('top') ? 'top-0' : 'bottom-0'}
                                ${pos.includes('left') ? 'left-0' : 'right-0'}
                                ${pos === 'top-right' || pos === 'bottom-left' ? 'cursor-nesw-resize' : ''}`}
                         />
                    ))}
                </>
            )}
        </div>
    );
};

export default PdfFormCreator;