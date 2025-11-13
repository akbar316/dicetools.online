
import React, { useState } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

const BinaryTranslator: React.FC = () => {
    const [text, setText] = useState('');
    const [binary, setBinary] = useState('');

    const textToBinary = (str: string) => {
        return str.split('').map(char => {
            return char.charCodeAt(0).toString(2).padStart(8, '0');
        }).join(' ');
    };

    const binaryToText = (bin: string) => {
        return bin.split(' ').map(byte => {
            return String.fromCharCode(parseInt(byte, 2));
        }).join('');
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setText(val);
        setBinary(textToBinary(val));
    };

    const handleBinaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setBinary(val);
        try {
             if (/^[01\s]+$/.test(val) || val === '') {
                setText(binaryToText(val));
             } else {
                setText('Invalid binary string');
             }
        } catch (e) {
            setText('Error decoding binary');
        }
    };

    return (
        <ToolPageLayout
            title="Binary Translator"
            description="Translate text to and from binary code."
        >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Enter Text..."
                    className="w-full h-64 p-4 bg-brand-bg border border-brand-border rounded-md"
                />
                <textarea
                    value={binary}
                    onChange={handleBinaryChange}
                    placeholder="Enter Binary..."
                    className="w-full h-64 p-4 bg-brand-bg border border-brand-border rounded-md font-mono"
                />
            </div>
             <div className="mt-4 flex justify-end gap-4">
                <CopyButton textToCopy={text} />
                <CopyButton textToCopy={binary} />
            </div>
        </ToolPageLayout>
    );
};

export default BinaryTranslator;
