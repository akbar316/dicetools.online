
import React, { useState, useEffect } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

const ClipboardManager: React.FC = () => {
    const [history, setHistory] = useState<string[]>([]);
    
    // This is a simplified "manager". It only tracks what's copied from *this page*.
    // A true system clipboard manager requires desktop software.
    const [currentText, setCurrentText] = useState('');

    const handleCopy = () => {
        if (!currentText) return;
        navigator.clipboard.writeText(currentText);
        setHistory(prev => [currentText, ...prev].slice(0, 10)); // Keep last 10
        setCurrentText('');
    }

    return (
        <ToolPageLayout
            title="Clipboard Manager"
            description="A simple session-based clipboard history. Note: This only tracks text copied via this tool."
        >
            <div className="space-y-4">
                <textarea
                    value={currentText}
                    onChange={e => setCurrentText(e.target.value)}
                    placeholder="Type text and click 'Copy to History'..."
                    className="w-full h-32 p-2 bg-brand-bg border border-brand-border rounded-md"
                />
                <button onClick={handleCopy} className="w-full bg-brand-primary text-white py-2 rounded-md hover:bg-brand-primary-hover">Copy to History</button>
                <div>
                    <h3 className="text-lg font-semibold mb-2">History (Last 10)</h3>
                    <div className="space-y-2">
                        {history.map((item, index) => (
                            <div key={index} className="flex items-center bg-brand-bg p-2 rounded-md">
                                <span className="flex-grow truncate">{item}</span>
                                <CopyButton textToCopy={item} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default ClipboardManager;
