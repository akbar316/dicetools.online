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

interface OutputFile {
    name: string;
    url: string;
}

const parseRanges = (rangeString: string, maxPage: number): number[][] => {
    const ranges: number[][] = [];
    if (!rangeString) return ranges;

    const parts = rangeString.split(',');
    for (const part of parts) {
        const trimmedPart = part.trim();
        if (trimmedPart.includes('-')) {
            const [start, end] = trimmedPart.split('-').map(num => parseInt(num.trim(), 10));
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                 const validEnd = Math.min(end, maxPage);
                 const pageNumbers = [];
                 for(let i = start; i <= validEnd; i++) {
                     pageNumbers.push(i - 1); // 0-indexed
                 }
                 if(pageNumbers.length > 0) ranges.push(pageNumbers);
            }
        } else {
            const num = parseInt(trimmedPart, 10);
            if (!isNaN(num) && num <= maxPage) {
                ranges.push([num - 1]); // 0-indexed
            }
        }
    }
    return ranges;
};

const PdfSplit: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
    const [splitMode, setSplitMode] = useState<'ranges' | 'single'>('ranges');
    const [ranges, setRanges] = useState('1-3, 5');
    const [error, setError] = useState<string | null>(null);
    
    const longDescription = (
        <>
            <p>
              Take full control of your documents with our powerful PDF Split tool. This versatile utility is designed to help you break down large PDF files into smaller, more manageable documents with precision and ease. It offers two convenient modes to suit your needs. Use the 'By Ranges' mode to extract specific pages or page ranges, such as chapters from a book or sections from a report. Simply define the pages you need (e.g., 1-5, 8, 11-12), and the tool will create a new PDF for each specified range.
            </p>
            <p>
              Alternatively, select 'Extract All Pages' to instantly convert every page of your document into its own individual PDF file. This is perfect for separating invoices, creating individual portfolio pages, or isolating specific slides from a presentation. Our PDF Split tool is fast, secure, and operates entirely within your browser, ensuring your documents remain private.
            </p>
        </>
    );

    const handleProcess = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setOutputFiles([]);
        setError(null);
        
        try {
            const { PDFDocument } = await loadPdfLib();
            const originalFile = files[0];
            const existingPdfBytes = await originalFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            const totalPages = pdfDoc.getPageCount();

            let pageGroups: number[][] = [];

            if (splitMode === 'single') {
                pageGroups = Array.from({ length: totalPages }, (_, i) => [i]);
            } else { // ranges
                pageGroups = parseRanges(ranges, totalPages);
            }

            if (pageGroups.length === 0 || pageGroups.every(g => g.length === 0)) {
                throw new Error("Invalid page ranges specified or no pages selected.");
            }

            const newFiles: OutputFile[] = [];
            for (let i = 0; i < pageGroups.length; i++) {
                const group = pageGroups[i];
                if (group.length === 0) continue;

                const newPdf = await PDFDocument.create();
                const copiedPages = await newPdf.copyPages(pdfDoc, group);
                copiedPages.forEach(page => newPdf.addPage(page));
                
                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const rangeName = group.length > 1 ? `${group[0]+1}-${group[group.length-1]+1}` : `${group[0]+1}`;
                const newName = `${originalFile.name.replace(/\.pdf$/i, '')}_pages_${rangeName}.pdf`;

                newFiles.push({ name: newName, url });
            }
            setOutputFiles(newFiles);

        } catch (e: any) {
             console.error(e);
             setError(`Failed to split PDF: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const ActionButton = (
        <button
            onClick={handleProcess}
            disabled={files.length === 0 || isProcessing || (splitMode === 'ranges' && !ranges.trim())}
            className="w-full bg-brand-primary text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-brand-primary-hover transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
            {isProcessing ? 'Splitting...' : 'Split PDF'}
        </button>
    );
    
     const Output = (
      <div className="w-full text-center">
          {isProcessing && <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto"></div>}
          
          {error && <p className="text-red-500">{error}</p>}
          
          {!isProcessing && outputFiles.length > 0 && (
              <div className="space-y-4 w-full">
                  <h3 className="font-semibold text-lg text-brand-text-primary">Split Complete!</h3>
                  <div className="max-h-80 overflow-y-auto space-y-2 bg-brand-surface p-2 rounded-md">
                      {outputFiles.map(file => (
                          <div key={file.name} className="bg-brand-bg p-2 rounded-md flex items-center justify-between text-sm">
                              <span className="truncate pr-4">{file.name}</span>
                              <a href={file.url} download={file.name} className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 whitespace-nowrap">Download</a>
                          </div>
                      ))}
                  </div>
              </div>
          )}
          {!isProcessing && outputFiles.length === 0 && !error && <p className="text-brand-text-secondary">Upload a file to split it.</p>}
      </div>
  );

    return (
        <PdfToolLayout
            title="PDF Split"
            description="Extract pages into multiple new PDF files."
            onFilesSelected={f => { setFiles(f); setOutputFiles([]); setError(null); }}
            selectedFiles={files}
            actionButton={ActionButton}
            output={Output}
            longDescription={longDescription}
        >
            <div className="space-y-4 bg-brand-bg p-4 rounded-md">
                <div className="flex border border-brand-border rounded-md">
                    <button onClick={() => setSplitMode('ranges')} className={`flex-1 p-2 rounded-l-md ${splitMode === 'ranges' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>By Ranges</button>
                    <button onClick={() => setSplitMode('single')} className={`flex-1 p-2 rounded-r-md ${splitMode === 'single' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>Extract All Pages</button>
                </div>
                {splitMode === 'ranges' ? (
                    <div>
                        <p className="text-sm text-brand-text-secondary mb-1">Enter page numbers or ranges, separated by commas. Each range will become a new PDF.</p>
                        <input
                            type="text"
                            value={ranges}
                            onChange={(e) => setRanges(e.target.value)}
                            placeholder="e.g., 1-3, 5, 8-10"
                            className="w-full p-2 bg-brand-surface border border-brand-border rounded-md"
                        />
                    </div>
                ) : (
                    <p className="text-sm text-brand-text-secondary text-center">This will create a separate PDF file for each page.</p>
                )}
            </div>
        </PdfToolLayout>
    );
};

export default PdfSplit;