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


const PdfUnlock: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputFileUrl, setOutputFileUrl] = useState<string | null>(null);
    const [outputFileName, setOutputFileName] = useState<string>('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const longDescription = (
        <>
            <p>
              Regain access to your password-protected PDF files with our straightforward and secure PDF Unlock tool. If you have a PDF that requires a password to open and you know the password, this tool can help you remove the encryption, creating a new, unrestricted version of the document. This is incredibly useful when you need to share a file with others without also having to share the password, or for archiving documents in an accessible format.
            </p>
            <p>
              Simply upload your encrypted PDF, enter the correct password when prompted, and the tool will process the file to remove the opening restrictions. The entire decryption process is handled securely within your browser; your file and your password are never uploaded to our servers, ensuring your sensitive information remains completely private. It’s a fast and reliable way to manage your secured documents, provided you have the authorization to access them.
            </p>
        </>
    );

    const handleProcess = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setOutputFileUrl(null);
        setOutputFileName('');
        setError('');

        try {
            const { PDFDocument } = await loadPdfLib();
            const existingPdfBytes = await files[0].arrayBuffer();
            
            const pdfDoc = await PDFDocument.load(existingPdfBytes, {
                password: password,
                ignoreEncryption: false,
            });

            const pdfBytes = await pdfDoc.save();
            
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            if (outputFileUrl) {
                URL.revokeObjectURL(outputFileUrl);
            }
            const url = URL.createObjectURL(blob);
            
            setOutputFileUrl(url);
            setOutputFileName(`unlocked_${files[0].name}`);

        } catch (e: any) {
            console.error(e);
            if (e.message.includes('password') || e.message.includes('encrypted') || e.message.includes('encryption')) {
                 setError('Failed to unlock. The password may be incorrect, or the PDF uses an unsupported encryption algorithm.');
            } else {
                setError(`An error occurred: ${e.message}`);
            }
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
            {isProcessing ? 'Unlocking...' : 'Unlock PDF'}
        </button>
    );
    
     const Output = (
      <div className="w-full text-center">
          {isProcessing && <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto"></div>}
          
          {!isProcessing && outputFileUrl && (
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-brand-text-primary">PDF Unlocked!</h3>
                  <div className="bg-brand-surface p-4 rounded-md flex items-center justify-between">
                      <span className="truncate">{outputFileName}</span>
                      <a href={outputFileUrl} download={outputFileName} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Download</a>
                  </div>
              </div>
          )}

          {error && <p className="text-red-500 mt-4">{error}</p>}
          
          {!isProcessing && !outputFileUrl && !error && <p className="text-brand-text-secondary">Upload a protected file to unlock it.</p>}
      </div>
  );

    return (
        <PdfToolLayout
            title="PDF Unlock"
            description="Remove password protection from a PDF file."
            onFilesSelected={(f) => { setFiles(f); setOutputFileUrl(null); setError(''); }}
            selectedFiles={files}
            actionButton={ActionButton}
            output={Output}
            longDescription={longDescription}
        >
            <div className="space-y-4 bg-brand-bg p-4 rounded-md">
                <h3 className="font-semibold text-lg text-brand-text-primary">Unlock Password</h3>
                <p className="text-sm text-brand-text-secondary">If the file is encrypted, you must provide the password to unlock it.</p>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full p-2 bg-brand-surface border border-brand-border rounded-md"
                />
            </div>
        </PdfToolLayout>
    );
};

export default PdfUnlock;