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

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const PdfSizeOptimizer: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [output, setOutput] = useState<{ name: string; url: string; originalSize: number; newSize: number; reduction: number; } | null>(null);
    const [error, setError] = useState('');
    
    // Settings state
    const [flattenForms, setFlattenForms] = useState(false);
    const [removeAnnotations, setRemoveAnnotations] = useState(false);
    const [removeMetadata, setRemoveMetadata] = useState(true);

    const handleProcess = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setOutput(null);
        setError('');

        try {
            const { PDFDocument } = await loadPdfLib();
            const originalFile = files[0];
            const existingPdfBytes = await originalFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            
            if (flattenForms) {
                const form = pdfDoc.getForm();
                try {
                    form.flatten();
                } catch (e) {
                    console.warn("Could not flatten form, maybe no form exists.");
                }
            }

            if (removeMetadata) {
                pdfDoc.setTitle('');
                pdfDoc.setAuthor('');
                pdfDoc.setSubject('');
                pdfDoc.setKeywords([]);
                pdfDoc.setProducer('');
                pdfDoc.setCreator('');
                pdfDoc.setCreationDate(new Date(0));
                pdfDoc.setModificationDate(new Date(0));
            }
            
            if (removeAnnotations) {
                const pages = pdfDoc.getPages();
                pages.forEach(page => {
                    const annotations = page.node.Annots();
                    if (annotations) {
                         while (annotations.size() > 0) {
                            annotations.remove(0);
                        }
                    }
                });
            }

            const pdfBytes = await pdfDoc.save();

            const originalSize = originalFile.size;
            const newSize = pdfBytes.byteLength;
            const reduction = originalSize > 0 ? Math.round((1 - newSize / originalSize) * 100) : 0;
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            setOutput({
                name: `optimized_${originalFile.name}`,
                url: URL.createObjectURL(blob),
                originalSize,
                newSize,
                reduction: Math.max(0, reduction), // Ensure reduction is not negative
            });

        } catch (e: any) {
            console.error(e);
            setError(`Failed to optimize PDF: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const ActionButton = (
        <button
            onClick={handleProcess}
            disabled={files.length === 0 || isProcessing}
            className="w-full bg-brand-primary text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-brand-primary-hover transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
            {isProcessing ? 'Optimizing...' : 'Optimize PDF'}
        </button>
    );
    
     const Output = (
      <div className="w-full text-center">
          {isProcessing && <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto"></div>}
          
          {error && <p className="text-red-500">{error}</p>}

          {!isProcessing && output && (
               <div className="space-y-4 text-center">
                  <h3 className="font-semibold text-lg text-brand-text-primary">Optimization Complete!</h3>
                  <div className="text-left text-sm space-y-2 bg-brand-surface p-4 rounded-lg">
                      <p>Original Size: <span className="font-semibold">{formatBytes(output.originalSize)}</span></p>
                      <p>New Size: <span className="font-semibold text-brand-primary">{formatBytes(output.newSize)}</span></p>
                      <p>Reduction: <span className="font-semibold text-green-500">{output.reduction}%</span></p>
                  </div>
                  <a href={output.url} download={output.name} className="block w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 font-semibold">
                    Download Optimized PDF
                  </a>
              </div>
          )}
          {!isProcessing && !output && !error && <p className="text-brand-text-secondary">Upload a file to optimize its size.</p>}
      </div>
  );

    return (
        <PdfToolLayout
            title="PDF Size Optimizer"
            description="Reduce file size by removing unnecessary data and flattening content."
            onFilesSelected={f => { setFiles(f); setOutput(null); setError(''); }}
            selectedFiles={files}
            actionButton={ActionButton}
            output={Output}
        >
            <div className="space-y-4 bg-brand-bg p-4 rounded-md">
                <h3 className="font-semibold text-lg text-brand-text-primary">Optimization Settings</h3>
                <Checkbox label="Remove metadata" checked={removeMetadata} onChange={setRemoveMetadata} />
                <Checkbox label="Flatten form fields" checked={flattenForms} onChange={setFlattenForms} />
                <Checkbox label="Remove annotations" checked={removeAnnotations} onChange={setRemoveAnnotations} />
                 <p className="text-xs text-brand-text-secondary pt-2">Note: Image quality options are not yet available. The primary optimization comes from restructuring the PDF and removing unnecessary data.</p>
            </div>
        </PdfToolLayout>
    );
};

const Checkbox: React.FC<{label: string, checked: boolean, onChange: (c: boolean) => void}> = ({ label, checked, onChange }) => (
    <label className="flex items-center space-x-2 p-2 bg-brand-surface rounded-md cursor-pointer">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary bg-brand-bg" />
        <span>{label}</span>
    </label>
);

export default PdfSizeOptimizer;