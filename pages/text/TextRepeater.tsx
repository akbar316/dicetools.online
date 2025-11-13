import React, { useState } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

const TextRepeater: React.FC = () => {
  const [text, setText] = useState('Hello! ');
  const [times, setTimes] = useState<number | string>(10);
  const [separator, setSeparator] = useState('');
  const [addLineNumbers, setAddLineNumbers] = useState(false);
  const [output, setOutput] = useState('');

  const handleRepeat = () => {
    const numTimes = typeof times === 'string' ? parseInt(times, 10) : times;
    if (isNaN(numTimes) || numTimes <= 0 || !text) return;

    const items = Array(numTimes).fill(null).map((_, i) => {
        return addLineNumbers ? `${i + 1}. ${text}` : text;
    });

    const finalSeparator = addLineNumbers ? '\n' : separator;
    const result = items.join(finalSeparator);
    setOutput(result);
  };
  
  const longDescription = (
    <>
      <p>
        Multiply any piece of text instantly with the Advanced Text Repeater. This tool is a simple yet powerful utility for anyone needing to duplicate text, from developers testing data inputs to marketers creating bulk content. Instead of tedious copy-pasting, just enter your desired text, specify the number of repetitions, and let the tool do the work for you. Whether you're generating test data, creating lists, or just having fun, this repeater streamlines the process. The output is generated instantly and can be copied to your clipboard with a single click, saving you valuable time and effort on repetitive tasks.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Customizable Output Options</h3>
      <p>
        What makes this tool advanced is its flexibility. You have full control over how the repeated text is formatted, making it adaptable to a wide range of applications.
      </p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Custom Separators:</strong> Define exactly what character or string separates each repetition. Use a comma for lists, a space, a newline, or any custom text you need.</li>
        <li><strong>Line Numbering:</strong> With a single checkbox, you can automatically prepend a line number to each repetition. This feature is perfect for creating ordered lists or formatted logs.</li>
        <li><strong>High Volume:</strong> Generate up to 10,000 repetitions at once, making it suitable for stress testing and large-scale data generation.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Advanced Text Repeater"
      description="Repeat text multiple times with custom separators and line numbering."
      longDescription={longDescription}
    >
      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Text to repeat..."
          className="w-full p-4 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Number of Repetitions</label>
                <input
                    type="number"
                    value={times}
                    onChange={(e) => setTimes(e.target.valueAsNumber || '')}
                    min="1"
                    max="10000"
                    className="w-full p-2 bg-brand-bg border border-brand-border rounded-md"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Separator</label>
                <input
                    type="text"
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value)}
                    disabled={addLineNumbers}
                    className="w-full p-2 bg-brand-bg border border-brand-border rounded-md disabled:bg-gray-700"
                />
            </div>
        </div>
         <label className="flex items-center space-x-2 cursor-pointer bg-brand-bg p-2 rounded-md">
            <input type="checkbox" checked={addLineNumbers} onChange={e => setAddLineNumbers(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary bg-brand-surface" />
            <span>Add line numbers (forces newline separator)</span>
        </label>
        <button onClick={handleRepeat} className="w-full bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-primary-hover transition-colors">
            Repeat Text
        </button>
        <textarea
          readOnly
          value={output}
          placeholder="Repeated text will appear here..."
          className="w-full h-48 p-4 bg-brand-bg border border-brand-border rounded-md"
        />
        <div className="flex justify-end">
            <CopyButton textToCopy={output} />
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default TextRepeater;