import React, { useState } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

type Mode = 'space' | 'join' | 'paragraph';

const RemoveLineBreaks: React.FC = () => {
  const [text, setText] = useState('This is an example\nof some text\nwith line breaks.\n\nIt also has a paragraph break.');
  const [mode, setMode] = useState<Mode>('space');

  const handleApply = () => {
    let result = '';
    switch (mode) {
      case 'space':
        result = text.replace(/(\r\n|\n|\r)/gm, ' ');
        break;
      case 'join':
        result = text.replace(/(\r\n|\n|\r)/gm, '');
        break;
      case 'paragraph':
        // Replace double line breaks with a temporary marker
        result = text.replace(/(\r\n|\n|\r){2,}/g, '##PARAGRAPH##');
        // Remove single line breaks
        result = result.replace(/(\r\n|\n|\r)/g, ' ');
        // Restore paragraph breaks
        result = result.replace(/##PARAGRAPH##/g, '\n\n');
        break;
    }
    setText(result);
  };
  
  const longDescription = (
    <>
      <p>
        Clean up your text formatting in seconds with our Advanced Line Break Remover. This tool is designed for anyone who has ever copied text from a PDF, email, or website and ended up with awkward and unwanted line breaks. Instead of manually deleting each line break, simply paste your text into our tool, choose your desired formatting option, and instantly get clean, properly formatted text. It’s perfect for writers, data entry professionals, and developers who need to quickly normalize text for reports, documents, or code. All processing is done securely in your browser, ensuring your data remains private.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Flexible Formatting Options</h3>
      <p>
        Our tool offers three distinct modes to give you complete control over your text's final structure, ensuring it meets your specific needs.
      </p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Replace with a Space:</strong> This is the most common use case. It removes all single line breaks and replaces them with a single space, effectively joining broken lines into continuous sentences.</li>
        <li><strong>Join All Lines:</strong> This option removes all line breaks entirely, without adding spaces. It's useful for creating a single, uninterrupted block of text or for cleaning up data lists.</li>
        <li><strong>Keep Paragraph Breaks:</strong> Our intelligent paragraph preservation mode removes single line breaks within paragraphs but respects double line breaks (blank lines) that typically separate them.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Advanced Line Break Remover"
      description="Easily remove line breaks from text, with options to preserve paragraphs."
      longDescription={longDescription}
    >
        <div className="space-y-4">
            <div className="bg-brand-bg p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-brand-text-primary">Options</h3>
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center space-x-2">
                        <input type="radio" name="mode" value="space" checked={mode === 'space'} onChange={() => setMode('space')} className="text-brand-primary"/>
                        <span>Replace line breaks with a space</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="radio" name="mode" value="join" checked={mode === 'join'} onChange={() => setMode('join')} className="text-brand-primary"/>
                        <span>Join all lines (remove all breaks)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="radio" name="mode" value="paragraph" checked={mode === 'paragraph'} onChange={() => setMode('paragraph')} className="text-brand-primary"/>
                        <span>Keep paragraph breaks</span>
                    </label>
                </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste text with line breaks here..."
              className="w-full h-72 p-4 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <div className="flex flex-wrap justify-center items-center gap-4">
                <button onClick={handleApply} className="bg-brand-primary text-white px-8 py-2 rounded-md hover:bg-brand-primary-hover transition-colors font-semibold">
                    Apply Changes
                </button>
                <CopyButton textToCopy={text} />
                <button onClick={() => setText('')} className="bg-brand-border text-white px-4 py-2 rounded-md hover:bg-slate-600 transition-colors">Clear</button>
            </div>
        </div>
    </ToolPageLayout>
  );
};

export default RemoveLineBreaks;