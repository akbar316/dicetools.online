import React, { useState } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

const AiLoadingSpinner: React.FC<{text: string}> = ({ text }) => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>{text}</span>
    </div>
);

const TreeView: React.FC<{ data: any }> = ({ data }) => {
    const renderNode = (key: string, value: any, path: string) => {
        const [isExpanded, setIsExpanded] = useState(true);
        const isObject = typeof value === 'object' && value !== null;

        return (
            <div key={path} className="ml-4">
                <div className="flex items-center">
                    {isObject && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="mr-1 text-sm w-4">
                            {isExpanded ? '▼' : '►'}
                        </button>
                    )}
                    <span className="text-purple-400">{key}:</span>
                    {!isObject && <span className="ml-2 text-green-400">{JSON.stringify(value)}</span>}
                </div>
                {isObject && isExpanded && (
                    <div className="border-l border-gray-600 pl-2">
                        {Object.entries(value).map(([childKey, childValue]) =>
                            renderNode(childKey, childValue, `${path}.${childKey}`)
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="font-mono text-sm bg-brand-bg p-4 rounded-md h-96 overflow-auto">
            {Object.entries(data).map(([key, value]) => renderNode(key, value, key))}
        </div>
    );
};

const JsonFormatter: React.FC = () => {
    const [jsonInput, setJsonInput] = useState('{"name":"DiceTools","version":1,"features":["formatter","validator",{"ai":["query","convert"]}]}');
    const [activeTab, setActiveTab] = useState<'format' | 'tree' | 'query' | 'convert'>('format');
    const [error, setError] = useState('');
    
    // Format tab
    const [formattedJson, setFormattedJson] = useState('');
    
    // Query tab
    const [query, setQuery] = useState('features[2].ai');
    const [queryResult, setQueryResult] = useState('');
    const [isQuerying, setIsQuerying] = useState(false);

    // Convert tab
    const [convertFormat, setConvertFormat] = useState<'YAML' | 'XML'>('YAML');
    const [convertResult, setConvertResult] = useState('');
    const [isConverting, setIsConverting] = useState(false);

    const handleAction = (action: 'format' | 'minify') => {
        if (!jsonInput.trim()) {
            setError('JSON input cannot be empty.');
            setFormattedJson('');
            return;
        }
        try {
            const parsed = JSON.parse(jsonInput);
            setFormattedJson(JSON.stringify(parsed, null, action === 'format' ? 2 : undefined));
            setError('');
        } catch (e) {
            setError('Invalid JSON format. Please check your input.');
            setFormattedJson('');
        }
    };
    
    const handleAiQuery = async () => {
        if (!jsonInput.trim() || !query.trim()) return;
        setIsQuerying(true);
        setQueryResult('');
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as a data query engine. Given the following JSON object, execute a query similar to JMESPath with the expression "${query}". Return the result as a minified JSON string. Do not return any other text, just the JSON result.\n\nJSON:\n${jsonInput}`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setQueryResult(response.text);
        } catch (e: any) {
            setError(`AI query failed: ${e.message}`);
        } finally {
            setIsQuerying(false);
        }
    };
    
    const handleAiConvert = async () => {
        if (!jsonInput.trim()) return;
        setIsConverting(true);
        setConvertResult('');
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Convert the following JSON object to ${convertFormat}. Do not include any commentary or code fences. Return only the raw ${convertFormat} output.\n\nJSON:\n${jsonInput}`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setConvertResult(response.text);
        } catch (e: any) {
            setError(`AI conversion failed: ${e.message}`);
        } finally {
            setIsConverting(false);
        }
    };
    
    let parsedJson: any = null;
    try {
        parsedJson = JSON.parse(jsonInput);
    } catch(e) {
        // ignore for tree view
    }
    
    const longDescription = (
      <>
        <p>
          The JSON Toolkit is an all-in-one solution for developers working with JSON data. This multi-functional tool goes far beyond simple formatting, providing a comprehensive suite of utilities to validate, visualize, query, and transform your JSON. Whether you're debugging an API response, preparing data for a database, or simply trying to understand a complex data structure, this toolkit has you covered. The tab-based interface allows you to seamlessly switch between different functionalities, from beautifying messy code to performing complex AI-powered operations. It’s an indispensable utility for streamlining your development workflow and managing JSON data with efficiency and power.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">A Full-Featured JSON Environment</h3>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Format & Minify:</strong> Instantly beautify your JSON for readability or minify it to reduce file size. The tool also validates your JSON structure, highlighting any errors.</li>
          <li><strong>Tree View:</strong> Visualize your JSON in a collapsible tree structure, making it easy to navigate and understand complex, nested objects and arrays.</li>
          <li><strong>AI-Powered Query:</strong> Use natural language or JMESPath-like expressions to query your data. The AI engine can extract specific values or subsets of your JSON without complex coding.</li>
          <li><strong>AI-Powered Conversion:</strong> Convert your JSON data into other common formats like YAML or XML with a single click, powered by an intelligent AI model.</li>
        </ul>
      </>
    );

    return (
        <ToolPageLayout
            title="JSON Toolkit"
            description="Format, view, query, and convert your JSON data."
            longDescription={longDescription}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder="Paste your JSON here..."
                        className={`w-full h-[30rem] p-4 bg-brand-bg border rounded-md focus:outline-none focus:ring-2 font-mono text-sm ${error ? 'border-red-500 focus:ring-red-500' : 'border-brand-border focus:ring-brand-primary'}`}
                    />
                    {error && <p className="text-red-500 text-center">{error}</p>}
                </div>
                <div className="space-y-2">
                    <div className="flex border-b border-brand-border">
                        {(['format', 'tree', 'query', 'convert'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-semibold text-sm capitalize ${activeTab === tab ? 'border-b-2 border-brand-primary text-brand-text-primary' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}>{tab}</button>
                        ))}
                    </div>
                    <div className="h-[30rem] overflow-auto">
                        {activeTab === 'format' && (
                            <div className="space-y-2">
                                <textarea readOnly value={formattedJson} placeholder="Formatted JSON will appear here..." className="w-full h-96 p-4 bg-brand-bg border border-brand-border rounded-md font-mono text-sm"/>
                                <div className="flex flex-wrap justify-center items-center gap-4">
                                    <button onClick={() => handleAction('format')} className="bg-brand-primary text-white px-4 py-2 rounded-md">Format</button>
                                    <button onClick={() => handleAction('minify')} className="bg-sky-600 text-white px-4 py-2 rounded-md">Minify</button>
                                    <CopyButton textToCopy={formattedJson} />
                                </div>
                            </div>
                        )}
                        {activeTab === 'tree' && (parsedJson ? <TreeView data={parsedJson} /> : <p className="p-4 text-center text-brand-text-secondary">Invalid JSON for Tree View.</p>)}
                        {activeTab === 'query' && (
                            <div className="space-y-2">
                                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Enter JMESPath-like query" className="w-full p-2 bg-brand-bg border border-brand-border rounded font-mono text-sm"/>
                                <button onClick={handleAiQuery} disabled={isQuerying} className="w-full bg-brand-primary text-white p-2 rounded">{isQuerying ? <AiLoadingSpinner text="Querying..." /> : 'Query with AI'}</button>
                                <textarea readOnly value={queryResult} placeholder="Query result..." className="w-full h-80 p-4 bg-brand-bg border border-brand-border rounded font-mono text-sm"/>
                            </div>
                        )}
                        {activeTab === 'convert' && (
                             <div className="space-y-2">
                                <select value={convertFormat} onChange={e => setConvertFormat(e.target.value as any)} className="w-full p-2 bg-brand-bg border border-brand-border rounded">
                                    <option>YAML</option><option>XML</option>
                                </select>
                                <button onClick={handleAiConvert} disabled={isConverting} className="w-full bg-brand-primary text-white p-2 rounded">{isConverting ? <AiLoadingSpinner text="Converting..." /> : `Convert to ${convertFormat}`}</button>
                                <textarea readOnly value={convertResult} placeholder="Converted output..." className="w-full h-80 p-4 bg-brand-bg border border-brand-border rounded font-mono text-sm"/>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default JsonFormatter;