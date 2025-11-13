import React, { useState } from 'react';
import PdfToolLayout from './PdfToolPlaceholder';

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

interface ImageOutput {
    url: string;
    pageNumber: number;
}

const PdfToImageConverter: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputImages, setOutputImages] = useState<ImageOutput[]>([]);
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  
  const longDescription = (
    <>
        <p>
          Convert your PDF documents into high-quality images with our versatile and easy-to-use PDF to Image Converter. Whether you need to share a document on social media, embed a page into a website, or create a visual preview for a project, this tool provides a fast and reliable solution. It processes each page of your PDF and transforms it into a crisp, clear image, available in either JPG or PNG format.
        </p>
        <p>
          Choose JPG for smaller file sizes perfect for web use, or select PNG to maintain transparency and ensure the highest possible quality. Our converter is designed for simplicity and speed, allowing you to get the images you need in just a few clicks. The tool operates entirely in your browser, ensuring your documents remain private and secure. It’s an essential utility for designers, marketers, and anyone who needs to work with PDF content in a visual format.
        </p>
    </>
  );

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setOutputImages([]);
    setError(null);
    setProgress('');
    
    try {
        const pdfjs = await loadPdfJs();
        const arrayBuffer = await files[0].arrayBuffer();
        const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        const images: ImageOutput[] = [];
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            setProgress(`Processing page ${i} of ${pdfDoc.numPages}...`);
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // High resolution
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d');
            if (!context) throw new Error("Could not get canvas context");
            
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            const url = canvas.toDataURL(`image/${format}`);
            images.push({ url, pageNumber: i });
        }
        setOutputImages(images);

    } catch (e: any) {
        console.error(e);
        setError(`Failed to convert PDF: ${e.message}`);
    } finally {
        setIsProcessing(false);
        setProgress('');
    }
  };

  const ActionButton = (
    <button
        onClick={handleProcess}
        disabled={files.length === 0 || isProcessing}
        className="w-full bg-brand-primary text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-brand-primary-hover transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
    >
        {isProcessing ? 'Converting...' : 'Convert to Image'}
    </button>
  );

  const Output = (
      <div className="w-full text-center">
          {isProcessing && (
            <div>
                 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto"></div>
                 <p className="mt-4 text-brand-text-secondary">{progress}</p>
            </div>
          )}
          
          {error && <p className="text-red-500">{error}</p>}

          {!isProcessing && outputImages.length > 0 && (
              <div className="w-full space-y-4">
                  <h3 className="font-semibold text-lg text-brand-text-primary">Conversion Complete!</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto bg-brand-surface p-4 rounded-md">
                      {outputImages.map(img => (
                          <div key={img.pageNumber} className="group relative">
                              <img src={img.url} alt={`Page ${img.pageNumber}`} className="rounded-md border border-brand-border" />
                              <a href={img.url} download={`${files[0].name.replace(/\.pdf$/i, '')}_page_${img.pageNumber}.${format}`} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">
                                  Download
                              </a>
                          </div>
                      ))}
                  </div>
              </div>
          )}
          
          {!isProcessing && outputImages.length === 0 && !error && (
              <p className="text-brand-text-secondary">Upload a file to convert it to images.</p>
          )}
      </div>
  );
  
  return (
    <PdfToolLayout
      title="PDF to Image Converter"
      description="Convert each page of your PDF into a high-quality image."
      onFilesSelected={f => { setFiles(f); setOutputImages([]); setError(null); }}
      selectedFiles={files}
      actionButton={ActionButton}
      output={Output}
      longDescription={longDescription}
    >
         <div className="space-y-4 bg-brand-bg p-4 rounded-md">
            <h3 className="font-semibold text-lg text-brand-text-primary">Output Format</h3>
            <div className="flex border border-brand-border rounded-md">
                <button onClick={() => setFormat('jpeg')} className={`flex-1 p-2 rounded-l-md ${format === 'jpeg' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>JPG</button>
                <button onClick={() => setFormat('png')} className={`flex-1 p-2 rounded-r-md ${format === 'png' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>PNG</button>
            </div>
        </div>
    </PdfToolLayout>
  );
};

export default PdfToImageConverter;