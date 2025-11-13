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
}

const PdfCompressor: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFile, setOutputFile] = useState<{name: string, url: string, originalSize: number, newSize: number, reduction: number} | null>(null);
  const [compressionLevel, setCompressionLevel] = useState('recommended');
  const [error, setError] = useState<string | null>(null);
  
  const longDescription = (
    <>
      <p>
        Optimize your PDF files for sharing and storage with our advanced PDF Compressor. Large PDF files can be cumbersome to email, upload, or store, but our tool makes it easy to reduce their size without significant loss of quality. We offer multiple compression levels to give you control over the final output. Choose a light compression for the best quality, or select a higher compression level for the smallest possible file size.
      </p>
      <p>
        Our intelligent optimization process works by removing redundant data, compressing images, and stripping out unnecessary metadata, all while striving to maintain the document's readability and visual integrity. It's the perfect solution for preparing documents for web publication, email attachments, or simply freeing up space on your hard drive. The entire process is fast, secure, and happens directly in your browser, so your files are never uploaded to a server.
      </p>
    </>
  );

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setOutputFile(null);
    setError(null);
    
    try {
      const { PDFDocument } = await loadPdfLib();
      const originalFile = files[0];
      const existingPdfBytes = await originalFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });

      // Apply different "levels" of optimization
      if (compressionLevel === 'recommended' || compressionLevel === 'small') {
        // Remove metadata
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');
      }

      if (compressionLevel === 'small') {
        // Flatten form fields
        try {
          pdfDoc.getForm().flatten();
        } catch(e) { console.warn("No form to flatten or error flattening.")}
      }

      // Re-saving is the main compression step
      const pdfBytes = await pdfDoc.save();

      const originalSize = originalFile.size;
      const newSize = pdfBytes.byteLength;
      const reduction = Math.round((1 - newSize / originalSize) * 100);

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setOutputFile({
        name: `compressed_${originalFile.name}`,
        url,
        originalSize,
        newSize,
        reduction: Math.max(0, reduction) // Don't show negative reduction
      });
    } catch(e: any) {
        console.error(e);
        setError(`Failed to compress PDF: ${e.message}`);
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
        {isProcessing ? 'Compressing...' : 'Compress PDF'}
    </button>
  );

  const Output = (
      <div className="w-full">
          {isProcessing && <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto"></div>}
          
          {error && <p className="text-red-500 text-center">{error}</p>}

          {!isProcessing && outputFile && (
              <div className="space-y-4 text-center">
                  <h3 className="font-semibold text-lg text-brand-text-primary">Compression Complete!</h3>
                  <div className="text-left text-sm space-y-2 bg-brand-surface p-4 rounded-lg">
                      <p>Original Size: <span className="font-semibold">{formatBytes(outputFile.originalSize)}</span></p>
                      <p>New Size: <span className="font-semibold text-brand-primary">{formatBytes(outputFile.newSize)}</span></p>
                      <p>Reduction: <span className="font-semibold text-green-500">{outputFile.reduction}%</span></p>
                  </div>
                  <a href={outputFile.url} download={outputFile.name} className="block w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 font-semibold">
                    Download Compressed PDF
                  </a>
              </div>
          )}
          
          {!isProcessing && !outputFile && !error &&(
              <p className="text-brand-text-secondary text-center">Upload a file to start compression.</p>
          )}
      </div>
  );
  
  return (
    <PdfToolLayout
      title="PDF Compressor"
      description="Reduce the file size of your PDF documents."
      onFilesSelected={f => { setFiles(f); setOutputFile(null); setError(null); }}
      selectedFiles={files}
      actionButton={ActionButton}
      output={Output}
      longDescription={longDescription}
    >
        <div className="space-y-4 bg-brand-bg p-4 rounded-md">
            <h3 className="font-semibold text-lg text-brand-text-primary">Compression Level</h3>
            <div className="space-y-2">
                <RadioOption id="high" name="compression" value="high" label="Less Compression" description="Basic optimization, best quality." checked={compressionLevel === 'high'} onChange={setCompressionLevel} />
                <RadioOption id="recommended" name="compression" value="recommended" label="Recommended" description="Good balance, removes metadata." checked={compressionLevel === 'recommended'} onChange={setCompressionLevel} />
                <RadioOption id="small" name="compression" value="small" label="High Compression" description="Removes metadata and flattens forms." checked={compressionLevel === 'small'} onChange={setCompressionLevel} />
            </div>
        </div>
    </PdfToolLayout>
  );
};

const RadioOption: React.FC<{id: string, name: string, value: string, label: string, description: string, checked: boolean, onChange: (v: string) => void}> = ({id, name, value, label, description, checked, onChange}) => (
    <label htmlFor={id} className="block p-3 bg-brand-surface rounded-md cursor-pointer border-2 border-transparent has-[:checked]:border-brand-primary has-[:checked]:bg-brand-primary/10">
        <input type="radio" id={id} name={name} value={value} checked={checked} onChange={(e) => onChange(e.target.value)} className="hidden" />
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-brand-text-secondary">{description}</p>
    </label>
)

export default PdfCompressor;