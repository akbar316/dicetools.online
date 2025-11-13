import React, { useState, useCallback } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

const createAndDownloadFile = (content: string, fileName: string, mimeType: string) => {
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

const flattenObject = (obj: any, parentKey = '', result: { [key: string]: any } = {}) => {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newKey = parentKey ? `${parentKey}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                flattenObject(obj[key], newKey, result);
            } else {
                result[newKey] = obj[key];
            }
        }
    }
    return result;
};


const JsonToCsvConverter: React.FC = () => {
    const [mode, setMode] = useState<'json-csv' | 'csv-json'>('json-csv');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');
    
    // Options
    const [delimiter, setDelimiter] = useState(',');
    const [flatten, setFlatten] = useState(true);

    const convertJsonToCsv = () => {
        try {
            const data = JSON.parse(input);
            if (!Array.isArray(data)) throw new Error('Input must be a JSON array of objects.');
            if (data.length === 0) { setOutput(''); return; }

            const processedData = flatten ? data.map(row => flattenObject(row)) : data;
            const headers = Array.from(new Set(processedData.flatMap(row => Object.keys(row))));
            
            const csvRows = [headers.join(delimiter)];
            for (const row of processedData) {
                const values = headers.map(header => {
                    const value = row[header];
                    const stringValue = value === null || value === undefined ? '' : String(value);
                    const escaped = stringValue.replace(/"/g, '""');
                    return `"${escaped}"`;
                });
                csvRows.push(values.join(delimiter));
            }
            setOutput(csvRows.join('\n'));
            setError('');
        } catch (e: any) {
            setError(`Invalid JSON: ${e.message}`);
        }
    };
    
    const convertCsvToJson = () => {
        try {
            const lines = input.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');
            
            const headers = lines[0].split(delimiter);
            const jsonData = [];

            for(let i = 1; i < lines.length; i++) {
                const values = lines[i].split(delimiter);
                const obj: { [key: string]: string } = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index] || '';
                });
                jsonData.push(obj);
            }
            setOutput(JSON.stringify(jsonData, null, 2));
            setError('');
        } catch (e: any) {
             setError(`Invalid CSV format: ${e.message}`);
        }
    };

    const handleConvert = () => {
        if (!input.trim()) { setError('Input cannot be empty.'); return; }
        if (mode === 'json-csv') convertJsonToCsv();
        else convertCsvToJson();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            setInput(event.target?.result as string);
        };
        reader.readAsText(file);
    };

    const handleDownload = () => {
        const extension = mode === 'json-csv' ? '.csv' : '.json';
        const mimeType = mode === 'json-csv' ? 'text/csv' : 'application/json';
        const baseName = fileName.split('.').slice(0, -1).join('.') || 'converted';
        createAndDownloadFile(output, `${baseName}${extension}`, mimeType);
    };
    
    const longDescription = (
      <>
        <p>
          Bridge the gap between web data and spreadsheets with our Advanced JSON ↔ CSV Converter. This essential tool for developers, data analysts, and marketers provides seamless, bidirectional conversion between JSON (JavaScript Object Notation) and CSV (Comma-Separated Values) formats. Whether you're extracting data from an API and need to analyze it in Excel, or you're preparing spreadsheet data for a web application, this tool streamlines the entire process. The intuitive, four-step workflow guides you from uploading your data to downloading the converted file, with powerful options to customize the output to your exact specifications.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Key Conversion Features</h3>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Bidirectional Conversion:</strong> Effortlessly switch between JSON to CSV and CSV to JSON modes to handle any data transformation task.</li>
          <li><strong>Nested JSON Flattening:</strong> When converting from JSON, our tool can automatically flatten nested objects, creating clear, dot-notation headers (e.g., `user.address.city`) for a spreadsheet-friendly format.</li>
          <li><strong>Custom Delimiters:</strong> Choose from common delimiters like commas, semicolons, or tabs to ensure compatibility with your specific spreadsheet software or database requirements.</li>
          <li><strong>File Handling:</strong> Easily upload your source file and download the converted result, preserving your original filename for better organization. All conversions are performed securely in your browser.</li>
        </ul>
      </>
    );

    return (
        <ToolPageLayout
            title="Advanced JSON ↔ CSV Converter"
            description="Convert between JSON and CSV with support for nested objects and file handling."
            longDescription={longDescription}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                     <div className="flex border-b border-brand-border">
                        <TabButton label="JSON to CSV" isActive={mode === 'json-csv'} onClick={() => setMode('json-csv')} />
                        <TabButton label="CSV to JSON" isActive={mode === 'csv-json'} onClick={() => setMode('csv-json')} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={`Paste your ${mode === 'json-csv' ? 'JSON' : 'CSV'} here...`}
                            className="w-full h-96 p-4 bg-brand-bg border border-brand-border rounded-md font-mono text-sm"
                        />
                        <textarea
                            readOnly
                            value={output}
                            placeholder={`Converted ${mode === 'json-csv' ? 'CSV' : 'JSON'} will appear here...`}
                            className="w-full h-96 p-4 bg-brand-bg border border-brand-border rounded-md font-mono text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                     <div className="bg-brand-bg p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">1. Load Data</h3>
                         <label className="cursor-pointer font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover px-4 py-2 rounded-md transition-colors w-full text-center block">
                            Upload File
                            <input type="file" accept={mode === 'json-csv' ? '.json' : '.csv'} onChange={handleFileChange} className="hidden" />
                        </label>
                        <p className="text-xs text-center mt-2 text-brand-text-secondary">or paste content directly</p>
                    </div>

                    <div className="bg-brand-bg p-4 rounded-lg space-y-3">
                        <h3 className="font-semibold text-lg">2. Options</h3>
                        {mode === 'json-csv' && (
                             <label className="flex items-center space-x-2"><input type="checkbox" checked={flatten} onChange={e => setFlatten(e.target.checked)} /><span>Flatten nested JSON</span></label>
                        )}
                        <div>
                            <label className="text-sm">Delimiter</label>
                            <select value={delimiter} onChange={e => setDelimiter(e.target.value)} className="w-full p-2 mt-1 bg-brand-surface border border-brand-border rounded">
                                <option value=",">Comma (,)</option>
                                <option value=";">Semicolon (;)</option>
                                <option value="\t">Tab</option>
                            </select>
                        </div>
                    </div>
                    
                    <button onClick={handleConvert} className="w-full bg-brand-primary text-white py-3 rounded-md font-semibold text-lg">
                        3. Convert
                    </button>
                    {error && <p className="text-red-500 text-center text-sm">{error}</p>}

                    <div className="bg-brand-bg p-4 rounded-lg space-y-2">
                        <h3 className="font-semibold text-lg">4. Get Result</h3>
                        <div className="flex gap-2">
                            <CopyButton textToCopy={output} />
                            <button onClick={handleDownload} disabled={!output} className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-500">Download File</button>
                        </div>
                    </div>
                </div>
            </div>
        </ToolPageLayout>
    );
};

const TabButton: React.FC<{label: string, isActive: boolean, onClick: () => void}> = ({label, isActive, onClick}) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-semibold text-sm ${isActive ? 'border-b-2 border-brand-primary text-brand-text-primary' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
    >
        {label}
    </button>
);


export default JsonToCsvConverter;