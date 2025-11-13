import React, { useState } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

type Mode = 'character' | 'word' | 'line';

const TextSeparator: React.FC = () => {
  const [text, setText] = useState('Hello world.\nThis is a test.');
  const [separator, setSeparator] = useState(',');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('word');

  const handleSeparate = () => {
    if (!text) return;
    let items: string[] = [];
    switch (mode) {
        case 'character':
            items = text.split('');
            break;
        case 'word':
            items = text.split(/\s+/).filter(Boolean); // Split by whitespace and remove empty strings
            break;
        case 'line':
            items = text.split(/\r?\n/).filter(Boolean); // Split by newlines
            break;
    }
    const result = items.join(separator);
    setOutput(result);
  };
  
  const longDescription = (
    <>
      <p>
        The Text Extractor & Separator is a powerful tool designed to help you reformat lists and structured text with ease. It allows you to parse text based on characters, words, or lines and then rejoin them using a custom separator of your choice. This is incredibly useful for developers, data analysts, and writers who frequently need to convert data from one format to another. For example, you can quickly transform a multi-line list into a comma-separated string for use in a database or spreadsheet. All processing happens instantly in your browser, ensuring your data remains secure and private while you work.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Flexible Extraction Modes</h3>
      <p>
        Our tool offers three precise modes to handle any text structure, giving you the flexibility to manage your data exactly how you need it.
      </p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>By Character:</strong> This mode splits the entire text into individual characters, allowing you to insert a separator between each one.</li>
        <li><strong>By Word:</strong> The tool intelligently splits your text by whitespace, isolating each word and letting you rejoin them with your chosen delimiter.</li>
        <li><strong>By Line:</strong> Perfect for lists, this mode splits the text by newlines, enabling you to convert a vertical list into a horizontal, separated string.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Text Extractor / Separator"
      description="Extract items from text and join them with a custom separator."
      longDescription={longDescription}
    >
      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your text here..."
          className="w-full h-48 p-4 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <div className="bg-brand-bg p-4 rounded-lg space-y-3">
             <div>
                <h3 className="font-semibold text-brand-text-primary mb-2">Extraction Mode</h3>
                 <div className="flex flex-wrap gap-4">
                    <label className="flex items-center space-x-2"><input type="radio" name="mode" value="character" checked={mode === 'character'} onChange={() => setMode('character')} /><span>By Character</span></label>
                    <label className="flex items-center space-x-2"><input type="radio" name="mode" value="word" checked={mode === 'word'} onChange={() => setMode('word')} /><span>By Word</span></label>
                    <label className="flex items-center space-x-2"><input type="radio" name="mode" value="line" checked={mode === 'line'} onChange={() => setMode('line')} /><span>By Line</span></label>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <label className="text-brand-text-secondary">Join with Separator:</label>
                <input
                    type="text"
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value)}
                    className="w-24 p-2 bg-brand-surface border border-brand-border rounded-md"
                />
            </div>
        </div>
        <button onClick={handleSeparate} className="w-full bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-primary-hover transition-colors">Extract & Separate</button>
        <textarea
          readOnly
          value={output}
          placeholder="Result..."
          className="w-full h-48 p-4 bg-brand-bg border border-brand-border rounded-md"
        />
        <div className="flex justify-end">
            <CopyButton textToCopy={output} />
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default TextSeparator;