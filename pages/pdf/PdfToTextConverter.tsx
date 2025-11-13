import React, { useState } from 'react';
import PdfToolLayout from './PdfToolPlaceholder';
import { CopyButton } from '../../components/ToolPageLayout';

// --- DYNAMIC LIBRARY LOADING ---
declare global {
    interface Window {
        pdfjsLib: any;
    }
}
const loadPdfJs = async () => {
    if (window.pdfjsLib) return window.pdfjsLib;
    const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;
    window.pdfjsLib = pdfjs;
    return window.pdfjsLib;
};
// --- END DYNAMIC LIBRARY LOADING ---

const createAndDownloadBlob = (content: string, fileName: string, mimeType: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const PdfToTextConverter: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputText, setOutputText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const longDescription = (
      <>
        <p>
          Quickly and efficiently extract all the text from your PDF documents with our straightforward PDF to Text Converter. This tool is designed for speed and simplicity, making it the perfect solution when you need to access the raw textual content of a file without any of the formatting. It's ideal for developers who need to parse data, writers who want to repurpose content, or anyone who needs to copy large amounts of text from a PDF without the hassle of dealing with awkward line breaks and formatting issues.
        </p>
        <p>
          The tool processes standard (text-based) PDFs, reading through each page and compiling all the text into a single, clean block. The extracted content can then be easily copied to your clipboard or downloaded as a .txt file. For scanned or image-based PDFs, we recommend using our dedicated PDF OCR tool for the best results.
        </p>
      </>
  );

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setOutputText(null);
    setError(null);
    
    try {
      const pdfjs = await loadPdfJs();
      const arrayBuffer = await files[0].arrayBuffer();
      const pdf = await pdfjs.getDocument({data: arrayBuffer}).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      setOutputText(fullText);

    } catch (e: any) {
      setError(`Failed to extract text: ${e.message}. The file may be scanned or corrupted.`);
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
        {isProcessing ? 'Extracting Text...' : 'Convert to Text'}
    </button>
  );

  const Output = (
       <div className="w-full h-full flex flex-col">
          {isProcessing && <div className="m-auto animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>}
          
          {!isProcessing && outputText !== null && (
              <>
                <textarea
                    readOnly
                    value={outputText}
                    className="w-full flex-grow bg-brand-surface border-brand-border rounded-md p-4 font-mono text-sm"
                />
                <div className="flex justify-end pt-4 gap-2">
                    <button onClick={() => createAndDownloadBlob(outputText, `${files[0]?.name.replace(/\.pdf$/i, '')}.txt`, 'text/plain')} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium">Download .txt</button>
                    <CopyButton textToCopy={outputText} />
                </div>
              </>
          )}
          
          {!isProcessing && outputText === null && (
              <p className="m-auto text-brand-text-secondary text-center">
                  {error ? <span className="text-red-500">{error}</span> : "Upload a standard PDF to extract its text content. For scanned PDFs, use our OCR tool."}
              </p>
          )}
      </div>
  );
  
  return (
    <PdfToolLayout
      title="PDF to Text Converter"
      description="Quickly extract all plain text from your PDF file."
      onFilesSelected={f => { setFiles(f); setOutputText(null); setError(null); }}
      selectedFiles={files}
      actionButton={ActionButton}
      output={Output}
      longDescription={longDescription}
    />
  );
};

export default PdfToTextConverter;