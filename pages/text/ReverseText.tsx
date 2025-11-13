import React, { useState, useMemo } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

type Mode = 'text' | 'words' | 'lines';

const ReverseText: React.FC = () => {
  const [text, setText] = useState('Hello world.\nThis is a test.');
  const [mode, setMode] = useState<Mode>('text');

  const reversedText = useMemo(() => {
    switch (mode) {
        case 'text':
            return text.split('').reverse().join('');
        case 'words':
            return text.split(/\s+/).reverse().join(' ');
        case 'lines':
            return text.split(/\r?\n/).reverse().join('\n');
        default:
            return '';
    }
  }, [text, mode]);
  
  const longDescription = (
    <>
      <p>
        Flip your text in multiple ways with our Advanced Text Reverser. This handy tool is perfect for creating fun text effects, preparing data, or simply looking at your words from a different perspective. Whether you need to reverse an entire sentence, shuffle the order of words, or invert the lines of a poem or list, our tool provides the flexibility to do it all. The live preview updates instantly as you type, allowing you to see the result in real time. It's a simple, fast, and secure way to manipulate your text directly in your browser without any server-side processing.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Choose Your Reversal Style</h3>
      <p>
        Our tool offers three distinct modes, each designed for a specific reversal task, giving you precise control over the output.
      </p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Reverse Text:</strong> This mode reverses the order of every character in your string. For example, "hello world" becomes "dlrow olleh". It's great for creating mirror text or simple text-based puzzles.</li>
        <li><strong>Reverse Words:</strong> Instead of characters, this mode reverses the order of the words themselves, while keeping the letters in each word intact. "Hello world" becomes "world Hello".</li>
        <li><strong>Reverse Lines:</strong> This mode is perfect for lists or code. It reverses the order of each line of text, so the last line becomes the first, the second-to-last becomes the second, and so on.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Advanced Text Reverser"
      description="Reverse text, words, or lines instantly."
      longDescription={longDescription}
    >
        <div className="space-y-4">
            <div className="bg-brand-bg p-4 rounded-lg">
                <h3 className="font-semibold text-brand-text-primary mb-2">Reversal Mode</h3>
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center space-x-2">
                        <input type="radio" name="mode" value="text" checked={mode === 'text'} onChange={() => setMode('text')} />
                        <span>Reverse Text</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="radio" name="mode" value="words" checked={mode === 'words'} onChange={() => setMode('words')} />
                        <span>Reverse Words</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="radio" name="mode" value="lines" checked={mode === 'lines'} onChange={() => setMode('lines')} />
                        <span>Reverse Lines</span>
                    </label>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text to reverse..."
                  className="w-full h-64 p-4 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <textarea
                  readOnly
                  value={reversedText}
                  placeholder="Reversed text..."
                  className="w-full h-64 p-4 bg-brand-bg border border-brand-border rounded-md"
                />
            </div>
            <div className="mt-4 flex justify-end">
                <CopyButton textToCopy={reversedText} />
            </div>
        </div>
    </ToolPageLayout>
  );
};

export default ReverseText;