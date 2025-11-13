import React, { useState, useEffect, useCallback } from 'react';
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

interface Metadata {
    title: string;
    author: string;
    subject: string;
    keywords: string;
    creator: string;
    producer: string;
    language: string;
    trapped: 'True' | 'False' | 'Unknown';
}

interface CustomMetadata {
    id: number;
    key: string;
    value: string;
}

const initialMetadataState: Metadata = {
    title: '', author: '', subject: '', keywords: '', creator: '', producer: '', language: '', trapped: 'Unknown'
};

const PdfMetadataEditor: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputFile, setOutputFile] = useState<{ name: string, url: string } | null>(null);
    const [error, setError] = useState('');
    
    const [originalMetadata, setOriginalMetadata] = useState<Metadata>(initialMetadataState);
    const [metadata, setMetadata] = useState<Metadata>(initialMetadataState);
    const [customMetadata, setCustomMetadata] = useState<CustomMetadata[]>([]);
    
    const [activeTab, setActiveTab] = useState<'core' | 'advanced' | 'custom'>('core');
    
    const longDescription = (
        <>
            <p>
              Take control of your document's hidden properties with our comprehensive PDF Metadata Editor. Metadata, such as the title, author, subject, and keywords, plays a crucial role in how your document is indexed by search engines and organized in file systems. Our tool provides a user-friendly interface to view and edit all the core metadata fields of your PDF. You can correct author information, add a descriptive subject, and insert relevant keywords to improve searchability (SEO).
            </p>
            <p>
              Beyond the standard properties, our advanced editor also allows you to add your own custom metadata fields, perfect for internal tracking codes or specialized information. Whether you're preparing a document for public distribution or simply want to ensure your files are professionally organized, this tool gives you the power to manage your PDF's properties with ease. All edits are performed securely in your browser.
            </p>
        </>
    );

    const isDirty = JSON.stringify(metadata) !== JSON.stringify(originalMetadata) || customMetadata.some(cm => cm.key || cm.value);

    const loadMetadata = useCallback(async (file: File) => {
        setIsProcessing(true);
        setError('');
        try {
            const { PDFDocument, PDFName, PDFString } = await loadPdfLib();
            const existingPdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            
            const langNode = pdfDoc.catalog.get(PDFName.of('Lang'));
            const language = langNode instanceof PDFString ? langNode.decodeText() : '';

            const trappedNode = pdfDoc.catalog.get(PDFName.of('Trapped'));
            const trappedValue = trappedNode instanceof PDFName ? trappedNode.asString().substring(1) : 'Unknown';
            const trapped = ['True', 'False', 'Unknown'].includes(trappedValue) ? trappedValue as Metadata['trapped'] : 'Unknown';
            
            const loadedMeta = {
                title: pdfDoc.getTitle() || '',
                author: pdfDoc.getAuthor() || '',
                subject: pdfDoc.getSubject() || '',
                keywords: (pdfDoc.getKeywords() || '').replace(/, /g, ','),
                creator: pdfDoc.getCreator() || '',
                producer: pdfDoc.getProducer() || '',
                language: language,
                trapped: trapped,
            };
            setMetadata(loadedMeta);
            setOriginalMetadata(loadedMeta);
            setCustomMetadata([]); // Reset custom fields for new file
        } catch(e: any) {
            setError(`Failed to read metadata: ${e.message}`);
            setMetadata(initialMetadataState);
            setOriginalMetadata(initialMetadataState);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    useEffect(() => {
        if (files.length > 0) {
            loadMetadata(files[0]);
        } else {
            setMetadata(initialMetadataState);
            setOriginalMetadata(initialMetadataState);
            setCustomMetadata([]);
        }
    }, [files, loadMetadata]);

    const handleProcess = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setOutputFile(null);
        setError('');
        try {
            const { PDFDocument, PDFName } = await loadPdfLib();
            const existingPdfBytes = await files[0].arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            
            pdfDoc.setTitle(metadata.title);
            pdfDoc.setAuthor(metadata.author);
            pdfDoc.setSubject(metadata.subject);
            pdfDoc.setKeywords(metadata.keywords.split(',').map(k => k.trim()));
            pdfDoc.setCreator(metadata.creator);
            pdfDoc.setProducer(metadata.producer);
            if (metadata.language) pdfDoc.setLanguage(metadata.language);
            if (metadata.trapped !== 'Unknown') pdfDoc.setTrapped(PDFName.of(metadata.trapped));
            
            customMetadata.forEach(item => {
                if (item.key.trim()) {
                    pdfDoc.setCustomMetadata(item.key.trim(), item.value);
                }
            });

            pdfDoc.setModificationDate(new Date());

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            if (outputFile?.url) URL.revokeObjectURL(outputFile.url);

            setOutputFile({
                name: `metadata-edited_${files[0].name}`,
                url: URL.createObjectURL(blob),
            });
        } catch (e: any) {
            setError(`Failed to save metadata: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const addCustomField = () => {
        setCustomMetadata([...customMetadata, { id: Date.now(), key: '', value: '' }]);
    };
    
    const updateCustomField = (id: number, field: 'key' | 'value', val: string) => {
        setCustomMetadata(customMetadata.map(cm => cm.id === id ? { ...cm, [field]: val } : cm));
    };

    const removeCustomField = (id: number) => {
        setCustomMetadata(customMetadata.filter(cm => cm.id !== id));
    };

    const ActionButton = (
        <button
            onClick={handleProcess}
            disabled={files.length === 0 || isProcessing || !isDirty}
            className="w-full bg-brand-primary text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-brand-primary-hover transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
            {isProcessing ? 'Saving...' : 'Save Metadata & Download'}
        </button>
    );
    
    const Output = (
        <div className="w-full text-center">
            {isProcessing && !metadata.title && <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto"></div>}
            {error && <p className="text-red-500">{error}</p>}
            {!isProcessing && outputFile && (
                <div className="space-y-4 animate-fade-in-up">
                    <h3 className="font-semibold text-lg text-green-400">Metadata Saved Successfully!</h3>
                    <div className="bg-brand-surface p-4 rounded-md flex items-center justify-between">
                        <span className="truncate">{outputFile.name}</span>
                        <a href={outputFile.url} download={outputFile.name} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Download</a>
                    </div>
                </div>
            )}
            {!isProcessing && !outputFile && !error && <p className="text-brand-text-secondary">Upload a file to view and edit its properties.</p>}
        </div>
    );

    return (
        <PdfToolLayout
            title="Advanced PDF Metadata Editor"
            description="View, edit, and add custom properties to your PDF file."
            onFilesSelected={f => { setFiles(f); setOutputFile(null); setError(''); }}
            selectedFiles={files}
            actionButton={ActionButton}
            output={Output}
            longDescription={longDescription}
        >
            {files.length > 0 && (
                <div className="bg-brand-bg p-4 rounded-md">
                    <div className="flex border-b border-brand-border mb-4">
                        <TabButton label="Core" isActive={activeTab === 'core'} onClick={() => setActiveTab('core')} />
                        <TabButton label="Advanced" isActive={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} />
                        <TabButton label="Custom" isActive={activeTab === 'custom'} onClick={() => setActiveTab('custom')} />
                    </div>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {activeTab === 'core' && (
                            <>
                                <MetaInput label="Title" name="title" value={metadata.title} onChange={e => setMetadata({...metadata, title: e.target.value})} />
                                <MetaInput label="Author" name="author" value={metadata.author} onChange={e => setMetadata({...metadata, author: e.target.value})} />
                                <MetaInput label="Subject" name="subject" value={metadata.subject} onChange={e => setMetadata({...metadata, subject: e.target.value})} />
                                <MetaInput label="Keywords" name="keywords" value={metadata.keywords} onChange={e => setMetadata({...metadata, keywords: e.target.value})} placeholder="comma,separated,values"/>
                            </>
                        )}
                        {activeTab === 'advanced' && (
                             <>
                                <MetaInput label="Creator Application" name="creator" value={metadata.creator} onChange={e => setMetadata({...metadata, creator: e.target.value})} />
                                <MetaInput label="PDF Producer" name="producer" value={metadata.producer} onChange={e => setMetadata({...metadata, producer: e.target.value})} />
                                <MetaInput label="Language" name="language" value={metadata.language} onChange={e => setMetadata({...metadata, language: e.target.value})} placeholder="e.g., en-US"/>
                                <div>
                                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Trapped Status</label>
                                    <select name="trapped" value={metadata.trapped} onChange={e => setMetadata({...metadata, trapped: e.target.value as Metadata['trapped']})} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md">
                                        <option>Unknown</option><option>True</option><option>False</option>
                                    </select>
                                </div>
                            </>
                        )}
                         {activeTab === 'custom' && (
                             <div>
                                {customMetadata.map((cm, index) => (
                                    <div key={cm.id} className="grid grid-cols-12 gap-2 items-center mb-2">
                                        <input type="text" value={cm.key} onChange={e => updateCustomField(cm.id, 'key', e.target.value)} placeholder="Key" className="col-span-5 p-2 bg-brand-surface border-brand-border rounded"/>
                                        <input type="text" value={cm.value} onChange={e => updateCustomField(cm.id, 'value', e.target.value)} placeholder="Value" className="col-span-6 p-2 bg-brand-surface border-brand-border rounded"/>
                                        <button onClick={() => removeCustomField(cm.id)} className="col-span-1 text-red-500 font-bold text-center">✕</button>
                                    </div>
                                ))}
                                <button onClick={addCustomField} className="text-brand-primary text-sm mt-2">+ Add Custom Property</button>
                             </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 border-t border-brand-border mt-4 pt-4">
                        <button onClick={() => setMetadata(initialMetadataState)} className="text-sm bg-brand-surface px-3 py-1 rounded-md hover:bg-brand-border">Clear All</button>
                        <button onClick={() => setMetadata(originalMetadata)} className="text-sm bg-brand-surface px-3 py-1 rounded-md hover:bg-brand-border">Reset</button>
                    </div>
                </div>
            )}
        </PdfToolLayout>
    );
};

const MetaInput: React.FC<{label: string, name: string, value: string, onChange: (e:any) => void, placeholder?: string}> = ({label, name, value, onChange, placeholder}) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-1">{label}</label>
        <input 
            type="text"
            name={name}
            value={value} 
            onChange={onChange}
            placeholder={placeholder}
            className="w-full p-2 bg-brand-surface border border-brand-border rounded-md" 
        />
    </div>
);

const TabButton: React.FC<{label: string, isActive: boolean, onClick: () => void}> = ({label, isActive, onClick}) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-semibold text-sm ${isActive ? 'border-b-2 border-brand-primary text-brand-text-primary' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
    >
        {label}
    </button>
);

export default PdfMetadataEditor;