import React, { useState } from 'react';
import PdfToolLayout from './PdfToolPlaceholder';

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
// --- END DYNAMIC LIBRARY LOADING ---

const PdfWatermarkAdder: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputFile, setOutputFile] = useState<{ name: string; url: string } | null>(null);
    const [error, setError] = useState('');
    
    // Watermark settings
    const [text, setText] = useState('CONFIDENTIAL');
    const [font, setFont] = useState('Helvetica');
    const [color, setColor] = useState('#ff0000');
    const [opacity, setOpacity] = useState(0.5);
    const [size, setSize] = useState(50);
    const [position, setPosition] = useState('center');
    
    const longDescription = (
        <>
            <p>
              Protect and brand your documents with our versatile PDF Watermark Adder. Whether you want to mark a document as 'Confidential', add a 'Draft' label, or place your company's name across your pages, this tool provides a flexible and professional solution. You have complete control over the appearance of your watermark. Customize the text, choose from a variety of fonts, select the perfect color, and adjust the opacity to make it subtle or prominent.
            </p>
            <p>
              Our tool also offers multiple positioning options, allowing you to place the watermark in a corner, at the center, or even diagonally across the page for maximum visibility. This is an essential utility for photographers, designers, and businesses looking to protect their intellectual property or maintain brand consistency across their documents. The process is fast, secure, and performed entirely in your browser, so your files are never uploaded to a server.
            </p>
        </>
    );

    const handleProcess = async () => {
        if (files.length === 0 || !text.trim()) return;
        setIsProcessing(true);
        setOutputFile(null);
        setError('');

        try {
            const { PDFDocument, StandardFonts, rgb, degrees } = await loadPdfLib();
            const existingPdfBytes = await files[0].arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            
            const fontMap = {
                'Helvetica': StandardFonts.Helvetica,
                'Helvetica-Bold': StandardFonts.HelveticaBold,
                'Times-Roman': StandardFonts.TimesRoman,
                'Courier': StandardFonts.Courier,
            };
            const embeddedFont = await pdfDoc.embedFont(fontMap[font as keyof typeof fontMap] || StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();
            const rgbColor = {
                r: parseInt(color.slice(1, 3), 16) / 255,
                g: parseInt(color.slice(3, 5), 16) / 255,
                b: parseInt(color.slice(5, 7), 16) / 255,
            };
            
            for (const page of pages) {
                const { width, height } = page.getSize();
                const textWidth = embeddedFont.widthOfTextAtSize(text, size);
                const textHeight = embeddedFont.heightAtSize(size);

                let x, y, rotate;
                switch (position) {
                    case 'top-left': x = 20; y = height - textHeight - 20; rotate = degrees(0); break;
                    case 'top-center': x = width / 2 - textWidth / 2; y = height - textHeight - 20; rotate = degrees(0); break;
                    case 'top-right': x = width - textWidth - 20; y = height - textHeight - 20; rotate = degrees(0); break;
                    case 'bottom-left': x = 20; y = 20; rotate = degrees(0); break;
                    case 'bottom-center': x = width / 2 - textWidth / 2; y = 20; rotate = degrees(0); break;
                    case 'bottom-right': x = width - textWidth - 20; y = 20; rotate = degrees(0); break;
                    case 'diagonal': x = width / 2 - textWidth / 2; y = height / 2 - textHeight / 2; rotate = degrees(Math.atan(height / width) * 180 / Math.PI); break;
                    case 'center':
                    default: x = width / 2 - textWidth / 2; y = height / 2 - textHeight / 2; rotate = degrees(0); break;
                }

                page.drawText(text, { x, y, font: embeddedFont, size, color: rgb(rgbColor.r, rgbColor.g, rgbColor.b), opacity, rotate });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            if (outputFile?.url) URL.revokeObjectURL(outputFile.url);

            setOutputFile({
                name: `watermarked_${files[0].name}`,
                url: URL.createObjectURL(blob),
            });

        } catch (e: any) {
            setError(`Failed to add watermark: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const ActionButton = (
        <button
            onClick={handleProcess}
            disabled={files.length === 0 || isProcessing || !text.trim()}
            className="w-full bg-brand-primary text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-brand-primary-hover transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
            {isProcessing ? 'Applying Watermark...' : 'Add Watermark'}
        </button>
    );
    
     const Output = (
      <div className="w-full text-center">
          {isProcessing && <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto"></div>}
          {error && <p className="text-red-500">{error}</p>}
          {!isProcessing && outputFile && (
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-brand-text-primary">Watermark Added!</h3>
                  <div className="bg-brand-surface p-4 rounded-md flex items-center justify-between">
                      <span className="truncate">{outputFile.name}</span>
                      <a href={outputFile.url} download={outputFile.name} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Download</a>
                  </div>
              </div>
          )}
          {!isProcessing && !outputFile && !error && <p className="text-brand-text-secondary">Upload a file to add a watermark.</p>}
      </div>
  );

    return (
        <PdfToolLayout
            title="PDF Watermark Adder"
            description="Add a text watermark to your PDF."
            onFilesSelected={f => { setFiles(f); setOutputFile(null); setError(''); }}
            selectedFiles={files}
            actionButton={ActionButton}
            output={Output}
            longDescription={longDescription}
        >
            <div className="space-y-4 bg-brand-bg p-4 rounded-md">
                <h3 className="font-semibold text-lg text-brand-text-primary">Watermark Settings</h3>
                <div>
                    <label className="text-sm">Text</label>
                    <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm">Font</label>
                        <select value={font} onChange={e => setFont(e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md">
                            <option>Helvetica</option><option>Helvetica-Bold</option><option>Times-Roman</option><option>Courier</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm">Color</label>
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 p-1 bg-brand-surface border border-brand-border rounded-md" />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                         <label className="text-sm">Size</label>
                         <input type="number" value={size} onChange={e => setSize(parseInt(e.target.value))} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md" />
                    </div>
                     <div>
                        <label className="text-sm">Opacity ({Math.round(opacity * 100)}%)</label>
                        <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} className="w-full" />
                    </div>
                </div>
                 <div>
                    <label className="text-sm">Position</label>
                    <select value={position} onChange={e => setPosition(e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md">
                        <option value="center">Center</option><option value="diagonal">Diagonal</option>
                        <option value="top-left">Top Left</option><option value="top-center">Top Center</option><option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option><option value="bottom-center">Bottom Center</option><option value="bottom-right">Bottom Right</option>
                    </select>
                </div>
            </div>
        </PdfToolLayout>
    );
};

export default PdfWatermarkAdder;