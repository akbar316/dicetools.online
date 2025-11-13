import React, { useState, useEffect } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

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

interface FormField {
    name: string;
    type: 'TextField' | 'CheckBox' | 'Button' | 'Dropdown' | 'RadioGroup' | 'Signature' | 'OptionList';
    options?: string[];
}

const PdfFormFiller: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [formFields, setFormFields] = useState<FormField[]>([]);
    const [formData, setFormData] = useState<{ [key: string]: string | boolean }>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    
    const longDescription = (
      <>
        <p>
          Fill out PDF forms directly in your browser with our convenient and easy-to-use PDF Form Filler. Say goodbye to the hassle of printing, filling by hand, and scanning, or the need for expensive desktop software. Simply upload your fillable PDF, and our tool will automatically detect all the interactive fields, including text boxes, checkboxes, radio buttons, and dropdown menus. You can then navigate through the form and enter your information with ease.
        </p>
        <p>
          Once you're finished, apply your changes, and the tool will generate a new PDF with your data embedded. You can then download the completed form, ready to be saved or shared. The entire process is secure and private, as your document and the information you enter are never uploaded to our servers. It’s the fastest and simplest way to handle your PDF forms online.
        </p>
      </>
    );

    const handleFileChange = async (selectedFile: File | null) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        setFormFields([]);
        setFormData({});
        setError('');
        setOutputUrl(null);
        setIsProcessing(true);
        try {
            const { PDFDocument } = await loadPdfLib();
            const existingPdfBytes = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            const form = pdfDoc.getForm();
            const fields = form.getFields();

            const extractedFields: FormField[] = fields.map(field => {
                const name = field.getName();
                const type = field.constructor.name;
                let options: string[] | undefined;
                
                if (type === 'PDFDropdown' || type === 'PDFRadioGroup' || type === 'PDFOptionList') {
                    options = (field as any).getOptions();
                }

                return { name, type, options };
            }).filter(f => f.type !== 'PDFButton'); // Exclude buttons

            if (extractedFields.length === 0) {
                setError("No fillable form fields were found in this PDF.");
            }
            setFormFields(extractedFields);
        } catch (e: any) {
            setError(`Failed to load PDF: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleInputChange = (name: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleApply = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError('');
        try {
            const { PDFDocument } = await loadPdfLib();
            const existingPdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            const form = pdfDoc.getForm();

            for (const field of form.getFields()) {
                const name = field.getName();
                const value = formData[name];
                
                if (value === undefined) continue;

                const type = field.constructor.name;
                if (type === 'PDFTextField') {
                    (field as any).setText(value as string);
                } else if (type === 'PDFCheckBox') {
                    if (value) (field as any).check(); else (field as any).uncheck();
                } else if (type === 'PDFDropdown' || type === 'PDFRadioGroup' || type === 'PDFOptionList') {
                    (field as any).select(value as string);
                }
            }
            // form.flatten(); // Uncomment this to make fields non-editable in the output
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            if (outputUrl) URL.revokeObjectURL(outputUrl);
            setOutputUrl(URL.createObjectURL(blob));

        } catch (e: any) {
            setError(`Failed to apply form data: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const renderField = (field: FormField) => {
        const value = formData[field.name];
        switch (field.type) {
            case 'TextField':
                return <input type="text" value={(value as string) || ''} onChange={e => handleInputChange(field.name, e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded" />;
            case 'CheckBox':
                return <input type="checkbox" checked={!!value} onChange={e => handleInputChange(field.name, e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary bg-brand-bg"/>;
            case 'Dropdown':
                return (
                    <select value={(value as string) || ''} onChange={e => handleInputChange(field.name, e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded">
                        <option value="">Select...</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                );
             case 'RadioGroup':
                return (
                    <div className="flex flex-wrap gap-4">
                        {field.options?.map(opt => (
                            <label key={opt} className="flex items-center gap-2">
                                <input type="radio" name={field.name} value={opt} checked={value === opt} onChange={e => handleInputChange(field.name, e.target.value)} />
                                {opt}
                            </label>
                        ))}
                    </div>
                );
            default:
                return <p className="text-sm text-gray-500">Unsupported field type: {field.type}</p>;
        }
    };

    return (
        <ToolPageLayout title="PDF Form Filler" description="Fill out your PDF forms online and download the result." longDescription={longDescription}>
            {!file ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] bg-brand-surface p-10 rounded-lg text-center">
                    <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} className="block w-full max-w-sm text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20"/>
                     {isProcessing && <p className="mt-4">Analyzing PDF...</p>}
                     {error && <p className="mt-4 text-red-500">{error}</p>}
                </div>
            ) : (
                <div className="space-y-4">
                     {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
                     {formFields.length > 0 && (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4 bg-brand-bg rounded-lg">
                            {formFields.map(field => (
                                <div key={field.name}>
                                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">{field.name}</label>
                                    {renderField(field)}
                                </div>
                            ))}
                        </div>
                     )}
                     
                    <button onClick={handleApply} disabled={isProcessing || formFields.length === 0} className="w-full bg-brand-primary text-white font-semibold px-6 py-3 rounded-md hover:bg-brand-primary-hover disabled:bg-gray-600">
                        {isProcessing ? 'Applying...' : 'Apply & Download'}
                    </button>

                    {outputUrl && (
                        <div className="bg-green-500/10 border border-green-500 p-4 rounded-lg text-center">
                            <a href={outputUrl} download={`filled_${file.name}`} className="font-semibold text-green-300">Download Filled PDF</a>
                        </div>
                    )}
                </div>
            )}
        </ToolPageLayout>
    );
};

export default PdfFormFiller;