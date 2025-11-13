

import React, { useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

// This component is being repurposed as a generic layout for all PDF tools.
// The filename remains for consistency with the existing file structure.

interface PdfToolLayoutProps {
    title: string;
    description: string;
    // FIX: Made children optional as some tools don't have settings.
    children?: ReactNode; // Settings and options for the specific tool
    actionButton: ReactNode; // The main action button
    output: ReactNode; // The output display area
    allowMultiple?: boolean;
    onFilesSelected: (files: File[]) => void;
    selectedFiles: File[];
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};


const FileProgressIndicator: React.FC<{ fileName: string }> = ({ fileName }) => (
    <div className="flex items-center gap-3 w-full min-w-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-brand-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        <div className="flex-grow min-w-0">
            <p className="truncate text-brand-text-primary text-sm">{fileName}</p>
            <div className="w-full bg-brand-border rounded-full h-1.5 mt-1">
                <div className="bg-brand-primary h-1.5 rounded-full animate-progress-bar"></div>
            </div>
        </div>
    </div>
);

const FileListItem: React.FC<{ file: File; onRemove: () => void }> = ({ file, onRemove }) => (
     <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3 w-full min-w-0">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-brand-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <div className="flex-grow min-w-0">
                <p className="truncate text-brand-text-primary">{file.name}</p>
                <p className="text-xs text-brand-text-secondary">{formatBytes(file.size)}</p>
            </div>
        </div>
        <button onClick={onRemove} className="ml-2 text-brand-text-secondary hover:text-red-500 flex-shrink-0 text-xl font-bold">&times;</button>
    </div>
);


const PdfToolPlaceholder: React.FC<PdfToolLayoutProps> = ({
    title,
    description,
    children,
    actionButton,
    output,
    allowMultiple = false,
    onFilesSelected,
    selectedFiles,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [progressFiles, setProgressFiles] = useState<Set<string>>(new Set());
    const statusTimeoutRef = useRef<number | null>(null);
    
    useEffect(() => {
        return () => {
            if (statusTimeoutRef.current) {
                clearTimeout(statusTimeoutRef.current);
            }
        };
    }, []);

    const handleFiles = (incomingFiles: FileList | null) => {
        if (statusTimeoutRef.current) {
            clearTimeout(statusTimeoutRef.current);
        }

        if (incomingFiles && incomingFiles.length > 0) {
            const allFiles = Array.from(incomingFiles);
            const pdfFiles = allFiles.filter(f => f.type === 'application/pdf');
            const nonPdfCount = allFiles.length - pdfFiles.length;

            if (nonPdfCount > 0) {
                const plural = nonPdfCount > 1 ? 's were' : ' was';
                setUploadStatus({ type: 'error', message: `${nonPdfCount} non-PDF file${plural} rejected.` });
            } else if (pdfFiles.length > 0) {
                 const message = allowMultiple ? `${pdfFiles.length} file(s) added.` : `File added successfully.`;
                setUploadStatus({ type: 'success', message });
            }

            statusTimeoutRef.current = window.setTimeout(() => setUploadStatus(null), 4000);

            if (pdfFiles.length > 0) {
                const uniqueFileIds = pdfFiles.map(f => `${f.name}-${f.size}`);
                setProgressFiles(prev => new Set([...prev, ...uniqueFileIds]));

                if (allowMultiple) {
                    const newFilesToAdd = pdfFiles.filter(f1 => !selectedFiles.some(f2 => f1.name === f2.name && f1.size === f2.size));
                    onFilesSelected([...selectedFiles, ...newFilesToAdd]);
                } else {
                    onFilesSelected([pdfFiles[0]]);
                }
                
                setTimeout(() => {
                    setProgressFiles(current => {
                        const next = new Set(current);
                        uniqueFileIds.forEach(id => next.delete(id));
                        return next;
                    });
                }, 1500);
            }
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        e.target.value = ''; // Reset input to allow re-uploading the same file
    };
    
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [allowMultiple, onFilesSelected, selectedFiles]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);
    
    const removeFile = (index: number) => {
        onFilesSelected(selectedFiles.filter((_, i) => i !== index));
    };
    
    return (
        <ToolPageLayout title={title} description={description}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Panel: Upload & Settings */}
                <div className="lg:col-span-2 space-y-6">
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border'}`}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-brand-text-secondary"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M2.5 17a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"></path><path d="M2.5 12a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"></path></svg>
                        <p className="font-semibold text-brand-text-primary">Drag & drop your PDF(s) here</p>
                        <p className="my-2 text-brand-text-secondary">or</p>
                        <label className="cursor-pointer font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover px-5 py-2 rounded-md transition-colors">
                            Select File(s)
                            <input type="file" accept=".pdf" multiple={allowMultiple} onChange={handleFileChange} className="hidden" />
                        </label>
                        {uploadStatus && (
                            <div className={`absolute bottom-4 left-4 right-4 p-2 rounded-md text-sm text-center text-white ${uploadStatus.type === 'success' ? 'bg-green-600/90' : 'bg-red-600/90'} animate-fade-in-up`} style={{animationDuration: '0.3s'}}>
                                {uploadStatus.message}
                            </div>
                        )}
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="space-y-3">
                           <h3 className="font-semibold text-lg text-brand-text-primary">Selected File(s)</h3>
                            {selectedFiles.map((file, index) => {
                                const fileId = `${file.name}-${file.size}`;
                                const isInProgress = progressFiles.has(fileId);
                                return (
                                    <div key={fileId} className="bg-brand-bg p-3 rounded-md overflow-hidden">
                                        {isInProgress ? (
                                            <FileProgressIndicator fileName={file.name} />
                                        ) : (
                                            <FileListItem file={file} onRemove={() => removeFile(index)} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {/* Tool-specific settings go here */}
                    {children}

                </div>

                {/* Right Panel: Action & Output */}
                <div className="lg:col-span-3">
                    <div className="bg-brand-bg p-6 rounded-lg min-h-[30rem] flex flex-col justify-between h-full">
                        <div className="flex-grow flex items-center justify-center">
                            {output}
                        </div>
                        <div className="border-t border-brand-border pt-4 mt-4 space-y-2">
                           {actionButton}
                        </div>
                    </div>
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default PdfToolPlaceholder;
