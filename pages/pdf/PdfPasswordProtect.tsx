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

const PdfPasswordProtect: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputFile, setOutputFile] = useState<{ name: string; url: string } | null>(null);
    const [error, setError] = useState('');

    // Simplified security settings
    const [password, setPassword] = useState('');
    
    const longDescription = (
      <>
        <p>
          Secure your sensitive documents and control access with our robust PDF Password Protect tool. In an age of digital information, protecting your data is paramount, and our tool provides a simple yet powerful way to encrypt your PDF files. Simply upload your document, set a strong password, and our tool will apply industry-standard AES-256 encryption to safeguard its contents. This ensures that only individuals with the correct password can open and view the file.
        </p>
        <p>
          By default, the tool restricts actions like modifying and copying content, adding an extra layer of protection against unauthorized use. It’s the ideal solution for confidential business reports, personal records, and any document that you need to share securely. The entire encryption process happens safely within your browser, meaning your unencrypted file and your password are never sent over the internet. Protect your information with confidence in just a few clicks.
        </p>
      </>
    );

    const handleProcess = async () => {
        if (files.length === 0 || !password) {
            setError('Please upload a file and set a password.');
            return;
        }
        setIsProcessing(true);
        setOutputFile(null);
        setError('');

        try {
            const pdfLib = await loadPdfLib();
            const existingPdfBytes = await files[0].arrayBuffer();
            const pdfDoc = await pdfLib.PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            
            const pdfBytes = await pdfDoc.save({
                userPassword: password,
                ownerPassword: password, // Use the same password for owner permissions
                permissions: {
                    printing: 'high',
                    modifying: false,
                    copying: false,
                    annotating: false,
                    fillingForms: true, // A common use-case to allow
                },
                useAES256: true, // Use strong encryption
            });

            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            if (outputFile?.url) URL.revokeObjectURL(outputFile.url);

            setOutputFile({
                name: `protected_${files[0].name}`,
                url: URL.createObjectURL(blob),
            });

        } catch (e: any) {
            setError(`Failed to protect PDF: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const ActionButton = (
        <button
            onClick={handleProcess}
            disabled={files.length === 0 || isProcessing || !password}
            className="w-full bg-brand-primary text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-brand-primary-hover transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
            {isProcessing ? 'Encrypting...' : 'Protect PDF'}
        </button>
    );
    
     const Output = (
      <div className="w-full text-center">
          {isProcessing && <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto"></div>}
          {error && <p className="text-red-500">{error}</p>}
          {!isProcessing && outputFile && (
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-brand-text-primary">PDF Protected Successfully!</h3>
                  <div className="bg-brand-surface p-4 rounded-md flex items-center justify-between">
                      <span className="truncate">{outputFile.name}</span>
                      <a href={outputFile.url} download={outputFile.name} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Download</a>
                  </div>
              </div>
          )}
          {!isProcessing && !outputFile && !error && <p className="text-brand-text-secondary">Upload a file to add password protection.</p>}
      </div>
  );

    return (
        <PdfToolLayout
            title="PDF Password Protect"
            description="Secure your PDF with a password. Simple and secure."
            onFilesSelected={f => { setFiles(f); setOutputFile(null); setError(''); }}
            selectedFiles={files}
            actionButton={ActionButton}
            output={Output}
            longDescription={longDescription}
        >
            <div className="space-y-4 bg-brand-bg p-4 rounded-md">
                <h3 className="font-semibold text-lg text-brand-text-primary">Set Password</h3>
                <div>
                    <label className="text-sm">Password to open</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password..." className="w-full p-2 bg-brand-surface border border-brand-border rounded-md" />
                </div>
                 <p className="text-xs text-brand-text-secondary pt-2">By default, printing is allowed, but modifying and copying content will be restricted.</p>
            </div>
        </PdfToolLayout>
    );
};

export default PdfPasswordProtect;