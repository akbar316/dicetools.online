import React, { useState } from 'react';
import PdfToolLayout from './PdfToolPlaceholder'; // Using the layout for structure, but with custom content

const createAndDownloadBlob = (content: string, fileName: string, mimeType: string) => {
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

const FileDropZone: React.FC<{file: File | null, onFileSelected: (f: File | null) => void, title: string}> = ({ file, onFileSelected, title }) => {
    const handleFile = (files: FileList | null) => {
        if (files && files.length > 0 && files[0].type === 'application/pdf') {
            onFileSelected(files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        handleFile(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFile(e.target.files);
    };

    return (
        <div onDrop={handleDrop} onDragOver={handleDragOver} className="border-2 border-dashed border-brand-border rounded-lg p-4 text-center h-48 flex flex-col justify-center">
            {file ? (
                <div>
                    <p className="font-semibold text-brand-text-primary truncate">{file.name}</p>
                    <button onClick={() => onFileSelected(null)} className="text-sm text-red-500 mt-2">Remove</button>
                </div>
            ) : (
                <>
                    <p className="font-semibold text-brand-text-primary">{title}</p>
                    <p className="text-sm text-brand-text-secondary">Drag & drop or <label className="text-brand-primary cursor-pointer">browse<input type="file" accept=".pdf" onChange={handleFileChange} className="hidden"/></label></p>
                </>
            )}
        </div>
    );
};


const PdfComparisonTool: React.FC = () => {
    const [file1, setFile1] = useState<File | null>(null);
    const [file2, setFile2] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputFile, setOutputFile] = useState<{name: string} | null>(null);
    
    const longDescription = (
        <>
            <p>
              Quickly identify changes between two versions of a PDF document with our powerful PDF Comparison Tool. This utility is an essential asset for legal professionals, editors, and anyone involved in collaborative document review. Instead of manually scanning for differences, which can be time-consuming and error-prone, simply upload the original and revised versions of your PDF. Our tool will analyze both files and generate a new document that visually highlights the changes, showing you exactly what text has been added, removed, or altered.
            </p>
            <p>
              This makes it incredibly easy to track revisions, verify changes, and streamline your review process. (Note: This is a demonstration tool; the output is a placeholder). In a full version, you would receive a detailed, color-coded report of all modifications, saving you valuable time and ensuring no change goes unnoticed. All files are processed securely in your browser.
            </p>
        </>
    );

    const handleCompare = () => {
        if (!file1 || !file2) return;
        setIsProcessing(true);
        setOutputFile(null);
        setTimeout(() => {
            setOutputFile({ name: `comparison_${file1.name}_vs_${file2.name}.pdf`});
            setIsProcessing(false);
        }, 2000);
    };

  return (
    <PdfToolLayout
        title="PDF Comparison Tool"
        description="Compare two PDF files and highlight the differences."
        allowMultiple={false}
        selectedFiles={[]}
        onFilesSelected={() => {}} // This is handled internally now
        longDescription={longDescription}
        actionButton={(
            <button onClick={handleCompare} disabled={!file1 || !file2 || isProcessing} className="w-full bg-brand-primary text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-brand-primary-hover disabled:bg-gray-600">
                {isProcessing ? 'Comparing...' : 'Compare PDFs'}
            </button>
        )}
        output={(
             <div className="w-full text-center">
                {isProcessing && <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto"></div>}
                {outputFile && !isProcessing && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-brand-text-primary">Comparison Complete!</h3>
                         <div className="bg-brand-surface p-4 rounded-md flex items-center justify-between">
                            <span className="truncate">{outputFile.name}</span>
                            <button onClick={() => createAndDownloadBlob('This is a dummy PDF file.', outputFile.name, 'application/pdf')} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Download</button>
                        </div>
                    </div>
                )}
                {!outputFile && !isProcessing && <p className="text-brand-text-secondary">Upload two files to compare.</p>}
            </div>
        )}
    >
        <div className="space-y-4 bg-brand-bg p-4 rounded-md">
            <FileDropZone file={file1} onFileSelected={setFile1} title="Original PDF" />
            <FileDropZone file={file2} onFileSelected={setFile2} title="Revised PDF" />
        </div>
    </PdfToolLayout>
  );
};

export default PdfComparisonTool;