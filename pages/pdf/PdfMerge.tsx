import React, { useState, useRef, useCallback } from 'react';
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
    // Using a dynamic import to load the script
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

// --- TYPES & INTERFACES ---
interface PageInfo {
    id: string;
    fileIndex: number;
    originalPageIndex: number; // 0-based
    rotation: 0 | 90 | 180 | 270;
    thumbnailUrl: string | null;
}

// --- MAIN COMPONENT ---
const PdfMerge: React.FC = () => {
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [stagedPages, setStagedPages] = useState<PageInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [outputFileUrl, setOutputFileUrl] = useState<string | null>(null);
  const [outputFileName, setOutputFileName] = useState<string>('');
  const [error, setError] = useState('');
  
  // Drag and drop state for pages
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  const longDescription = (
    <>
      <p>
        Streamline your document management with our Advanced PDF Merge tool, the ultimate solution for combining multiple files into a single, cohesive document. This isn't just a simple merger; it's a complete PDF workstation. Upload multiple PDFs and watch as their pages appear in our intuitive staging area, ready for you to organize. The visual interface allows you to drag and drop individual pages to reorder them, ensuring the final document flows exactly as you need.
      </p>
      <p>
        Need to make a quick adjustment? You can rotate or delete specific pages on the fly before finalizing the merge. This powerful flexibility makes it perfect for compiling reports, creating portfolios, or assembling project documents from various sources. Once you’re satisfied with the arrangement, the tool combines everything into a single, high-quality PDF, ready for download. All processing happens securely in your browser, guaranteeing the privacy of your files.
      </p>
    </>
  );

  const renderPageThumbnail = async (pdfDoc: any, pageNum: number): Promise<string> => {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d')!;
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    return canvas.toDataURL();
  };

  const handleFilesSelected = async (newFiles: File[]) => {
      if (newFiles.length === 0) return;
      
      setLoadingMessage('Processing files...');
      setIsProcessing(true);
      setError('');
      setOutputFileUrl(null);
      setOutputFileName('');
      
      const combinedFiles = [...originalFiles];
      const addedFiles: File[] = [];

      for (const newFile of newFiles) {
          const isDuplicate = originalFiles.some(f => f.name === newFile.name && f.size === newFile.size);
          if (!isDuplicate) {
              combinedFiles.push(newFile);
              addedFiles.push(newFile);
          }
      }
      
      setOriginalFiles(combinedFiles);

      try {
          const pdfjs = await loadPdfJs();
          const newPages: PageInfo[] = [];

          for (const file of addedFiles) {
              const fileIndex = combinedFiles.indexOf(file);
              const arrayBuffer = await file.arrayBuffer();
              const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;

              for (let i = 1; i <= pdfDoc.numPages; i++) {
                  const pageInfo: PageInfo = {
                      id: `file${fileIndex}-page${i}`,
                      fileIndex,
                      originalPageIndex: i - 1,
                      rotation: 0,
                      thumbnailUrl: null, // Will be rendered async
                  };
                  newPages.push(pageInfo);
              }
          }
          
          const allPages = [...stagedPages, ...newPages];
          setStagedPages(allPages);
          
          // Asynchronously render thumbnails
          for (let i = 0; i < allPages.length; i++) {
            if (allPages[i].thumbnailUrl === null) {
                const pageInfo = allPages[i];
                const file = combinedFiles[pageInfo.fileIndex];
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                const url = await renderPageThumbnail(pdfDoc, pageInfo.originalPageIndex + 1);
                
                setStagedPages(prevPages => {
                    const updatedPages = [...prevPages];
                    const targetIndex = updatedPages.findIndex(p => p.id === pageInfo.id);
                    if (targetIndex !== -1) {
                         updatedPages[targetIndex] = { ...updatedPages[targetIndex], thumbnailUrl: url };
                    }
                    return updatedPages;
                });
            }
          }

      } catch (e: any) {
          console.error(e);
          setError("Failed to process one or more PDF files. They may be corrupted or encrypted.");
      } finally {
          setIsProcessing(false);
          setLoadingMessage('');
      }
  };

  const handleProcess = async () => {
    if (stagedPages.length === 0) return;
    setLoadingMessage('Merging PDFs...');
    setIsProcessing(true);
    setOutputFileUrl(null);
    setOutputFileName('');
    setError('');
    
    try {
        const { PDFDocument, degrees } = await loadPdfLib();
        const mergedPdf = await PDFDocument.create();
        const loadedDocs: { [key: number]: any } = {};

        for (const pageInfo of stagedPages) {
            if (!loadedDocs[pageInfo.fileIndex]) {
                const pdfBytes = await originalFiles[pageInfo.fileIndex].arrayBuffer();
                loadedDocs[pageInfo.fileIndex] = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
            }
            const sourceDoc = loadedDocs[pageInfo.fileIndex];
            const [copiedPage] = await mergedPdf.copyPages(sourceDoc, [pageInfo.originalPageIndex]);
            copiedPage.setRotation(degrees(pageInfo.rotation));
            mergedPdf.addPage(copiedPage);
        }

        const mergedPdfBytes = await mergedPdf.save();
        
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        if (outputFileUrl) URL.revokeObjectURL(outputFileUrl);
        
        const url = URL.createObjectURL(blob);
        setOutputFileUrl(url);
        setOutputFileName('merged_document.pdf');
    } catch(e: any) {
        console.error(e);
        setError(`An error occurred during merging: ${e.message}`);
    } finally {
        setIsProcessing(false);
        setLoadingMessage('');
    }
  };

  const deletePage = (id: string) => {
    setStagedPages(stagedPages.filter(p => p.id !== id));
  };
  
  const rotatePage = (id: string) => {
    setStagedPages(stagedPages.map(p => {
        if (p.id === id) {
            const newRotation = (p.rotation + 90) % 360;
            return { ...p, rotation: newRotation as PageInfo['rotation'] };
        }
        return p;
    }));
  };

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newPages = [...stagedPages];
    const draggedItemContent = newPages.splice(dragItem.current, 1)[0];
    newPages.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setStagedPages(newPages);
  };

  return (
    <ToolPageLayout
      title="Advanced PDF Merge"
      description="Combine, reorder, rotate, and delete pages from multiple PDFs."
      longDescription={longDescription}
    >
      <div className="space-y-6">
            <div className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors border-brand-border`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-brand-text-secondary"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M2.5 17a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"></path><path d="M2.5 12a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"></path></svg>
                <p className="font-semibold text-brand-text-primary">Drag & drop your PDF(s) here</p>
                <p className="my-2 text-brand-text-secondary">or</p>
                <label className="cursor-pointer font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover px-5 py-2 rounded-md transition-colors">
                    Select File(s)
                    <input type="file" accept=".pdf" multiple onChange={(e) => handleFilesSelected(Array.from(e.target.files || []))} className="hidden" />
                </label>
            </div>
          
            <div className="bg-brand-bg p-4 rounded-lg min-h-[30rem]">
                <h3 className="font-semibold text-lg text-brand-text-primary mb-2">Staging Area</h3>
                <p className="text-sm text-brand-text-secondary mb-4">Drag and drop pages to reorder them for the final merged document.</p>
                
                {isProcessing && <div className="text-center py-10">{loadingMessage} <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary mx-auto mt-4"></div></div>}

                {!isProcessing && stagedPages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {stagedPages.map((page, index) => (
                            <div 
                                key={page.id} 
                                className="relative group aspect-[2/3] bg-brand-surface rounded-md shadow-md cursor-grab"
                                draggable
                                onDragStart={() => dragItem.current = index}
                                onDragEnter={() => dragOverItem.current = index}
                                onDragEnd={handleSort}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                {page.thumbnailUrl ? (
                                    <img src={page.thumbnailUrl} alt={`Page ${page.originalPageIndex + 1}`} className="w-full h-full object-contain rounded-md" style={{ transform: `rotate(${page.rotation}deg)`}} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-text-secondary"></div></div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between items-center p-2">
                                    <div className="flex justify-end w-full gap-1">
                                        <button onClick={() => rotatePage(page.id)} className="text-white bg-black/50 rounded-full p-1.5 hover:bg-brand-primary"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>
                                        <button onClick={() => deletePage(page.id)} className="text-white bg-black/50 rounded-full p-1.5 hover:bg-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                    </div>
                                    <span className="text-white bg-black/70 px-2 py-1 text-xs rounded-full">{originalFiles[page.fileIndex].name} (P{page.originalPageIndex + 1})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {!isProcessing && stagedPages.length === 0 && (
                    <div className="text-center text-brand-text-secondary py-16">
                        <p>Your pages will appear here for you to manage.</p>
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}
            
            {!isProcessing && outputFileUrl && (
              <div className="space-y-4 text-center bg-brand-bg p-4 rounded-lg animate-fade-in-up">
                  <h3 className="font-semibold text-lg text-green-400">Merge Complete!</h3>
                  <div className="bg-brand-surface p-4 rounded-md flex items-center justify-between">
                      <span className="truncate">{outputFileName}</span>
                      <a href={outputFileUrl} download={outputFileName} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Download</a>
                  </div>
              </div>
            )}
            
             <button
                onClick={handleProcess}
                disabled={stagedPages.length === 0 || isProcessing}
                className="w-full bg-brand-primary text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-brand-primary-hover transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                {isProcessing ? 'Processing...' : 'Merge & Download PDF'}
            </button>
      </div>
    </ToolPageLayout>
  );
};

export default PdfMerge;