import React, { useState, useCallback } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};


const Base64Tool: React.FC = () => {
  const [input, setInput] = useState('Hello World!');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  
  const [file, setFile] = useState<File | null>(null);
  const [generateDataUri, setGenerateDataUri] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const processEncoding = () => {
    try {
      let encoded = btoa(input);
      if (generateDataUri) {
          const mimeType = file ? file.type : 'text/plain';
          encoded = `data:${mimeType};base64,${encoded}`;
      }
      setOutput(encoded);
      setError('');
    } catch (e) {
      setError('Could not encode text to Base64.');
      setOutput('');
    }
  };

  const processDecoding = () => {
    try {
      let toDecode = input;
      // Strip data URI prefix if it exists
      if (input.startsWith('data:')) {
          toDecode = input.split(',')[1];
      }
      setOutput(atob(toDecode));
      setError('');
    } catch (e) {
      setError('Invalid Base64 string.');
      setOutput('');
    }
  };
  
  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        setInput(text);
        setMode('encode');
        // Automatically encode file content
        try {
            // We need the raw bytes, not the data URL for btoa
            const fileReaderForBytes = new FileReader();
            fileReaderForBytes.onload = (event) => {
                const binaryStr = event.target?.result as string;
                let encoded = btoa(binaryStr);
                 if (generateDataUri) {
                    encoded = `data:${selectedFile.type};base64,${encoded}`;
                }
                setOutput(encoded);
                setInput(`File: ${selectedFile.name} (${formatBytes(selectedFile.size)})`);
            };
            fileReaderForBytes.readAsBinaryString(selectedFile);
        } catch (err) {
            setError('Could not process file.');
        }
    };
    reader.onerror = () => setError('Error reading file.');
    reader.readAsDataURL(selectedFile); // We only use this reader to trigger the process
  };
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  }, []);
  
  const longDescription = (
    <>
      <p>
        Our Advanced Base64 Tool is a comprehensive utility for developers, data scientists, and anyone needing to encode or decode data. Base64 is a common encoding scheme that represents binary data in a text format, making it safe for transmission over systems that are designed to handle text. This tool provides a simple yet powerful interface to seamlessly convert between raw text or files and their Base64 string representation. With its intuitive design, you can quickly switch between encoding and decoding modes, handle various inputs, and generate web-ready data formats, all securely within your browser.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Key Features</h3>
      <ul className="list-disc list-inside space-y-2">
        <li><strong>Text & File Support:</strong> Paste any text or simply drag and drop a file directly into the tool. The content will be read and prepared for encoding automatically.</li>
        <li><strong>Data URI Generation:</strong> With a single click, you can generate a Base64 Data URI, which is perfect for embedding images, fonts, or other assets directly into HTML and CSS files.</li>
        <li><strong>Smart Decoding:</strong> The decoder automatically detects and strips the `data:[MIME_type];base64,` prefix from Data URIs, allowing you to paste the entire string without manual editing.</li>
        <li><strong>Secure & Client-Side:</strong> All encoding and decoding operations are performed directly in your browser. Your data is never sent to a server, ensuring complete privacy and security.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Advanced Base64 Tool"
      description="Encode/decode text or files, with support for Data URI generation."
      longDescription={longDescription}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
            className={`space-y-4 p-4 rounded-lg bg-brand-bg border-2 border-dashed ${isDragging ? 'border-brand-primary' : 'border-brand-border'}`}
            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
        >
             <div className="flex border border-brand-border rounded-md">
                <button onClick={() => setMode('encode')} className={`flex-1 p-2 rounded-l-md ${mode === 'encode' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>Encode</button>
                <button onClick={() => setMode('decode')} disabled={!!file} className={`flex-1 p-2 rounded-r-md ${mode === 'decode' ? 'bg-brand-primary' : 'bg-brand-surface'} disabled:bg-gray-700 disabled:cursor-not-allowed`}>Decode</button>
            </div>
            <textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); setFile(null); }}
              placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
              className="w-full h-48 p-4 bg-brand-surface border border-brand-border rounded-md"
            />
            <div className="text-center text-brand-text-secondary">
                or drop a file here to encode
            </div>
            {mode === 'encode' && (
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={generateDataUri} onChange={e => setGenerateDataUri(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary bg-brand-surface" />
                    <span>Generate Data URI</span>
                </label>
            )}
        </div>
        <div className="space-y-4">
            <div className="flex justify-center gap-4">
              <button onClick={mode === 'encode' ? processEncoding : processDecoding} className="bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-primary-hover transition-colors w-full">
                {mode === 'encode' ? 'Encode' : 'Decode'}
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              placeholder="Result..."
              className={`w-full h-64 p-4 bg-brand-bg border rounded-md ${error ? 'border-red-500' : 'border-brand-border'}`}
            />
            {error && <p className="text-red-500 text-center">{error}</p>}
            <div className="flex justify-end">
                <CopyButton textToCopy={output} />
            </div>
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default Base64Tool;