import React, { useState, useMemo } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

const CaseConverter: React.FC = () => {
  const [text, setText] = useState('Hello World, this is a test.');

  const stats = useMemo(() => {
    const words = text.match(/\b\w+\b/g)?.length || 0;
    const characters = text.length;
    return { words, characters };
  }, [text]);

  const applyCase = (caseType: string) => {
    let newText = '';
    switch (caseType) {
        case 'sentence':
            newText = text.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase());
            break;
        case 'lower':
            newText = text.toLowerCase();
            break;
        case 'upper':
            newText = text.toUpperCase();
            break;
        case 'capitalized':
            newText = text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            break;
        case 'alternating':
            newText = text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
            break;
        case 'inverse':
            newText = text.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
            break;
        case 'camel':
            newText = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
            break;
        case 'pascal':
             newText = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)?/g, (m, chr) => chr ? chr.toUpperCase() : '').replace(/^(.)/, (m, chr) => chr.toUpperCase());
            break;
        case 'snake':
            newText = text.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            break;
        case 'kebab':
            newText = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            break;
        default:
            newText = text;
    }
    setText(newText);
  };

  const conversionButtons = [
    { label: 'Sentence case', type: 'sentence' }, { label: 'lower case', type: 'lower' },
    { label: 'UPPER CASE', type: 'upper' }, { label: 'Capitalized Case', type: 'capitalized' },
    { label: 'aLtErNaTiNg cAsE', type: 'alternating' }, { label: 'iNVERSE cASE', type: 'inverse' },
    { label: 'camelCase', type: 'camel' }, { label: 'PascalCase', type: 'pascal' },
    { label: 'snake_case', type: 'snake' }, { label: 'kebab-case', type: 'kebab' },
  ];
  
  const longDescription = (
    <>
      <p>
        Effortlessly transform your text with our Advanced Case Converter. This versatile tool is an essential utility for writers, developers, editors, and anyone who works with text. Whether you need to format a headline, clean up user-submitted data, or prepare variable names for your code, our converter handles it all with a single click. Simply paste your text into the text area and choose from a wide array of conversion options to instantly reformat your content. The tool is fast, operates entirely within your browser for maximum privacy, and provides real-time word and character counts to help you stay on track.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">A Style for Every Need</h3>
      <p>
        Our converter goes beyond the standard uppercase and lowercase. It includes specialized formats for various professional contexts, making it a truly advanced utility.
      </p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Standard Cases:</strong> Quickly switch between Sentence case, lower case, UPPER CASE, and Capitalized Case (Title Case).</li>
        <li><strong>Creative Cases:</strong> Experiment with aLtErNaTiNg cAsE or iNVERSE cASE for stylistic text effects.</li>
        <li><strong>Developer Cases:</strong> Instantly convert text to camelCase, PascalCase, snake_case, or kebab-case, perfect for naming variables, functions, and CSS classes.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Advanced Case Converter"
      description="Convert text between different letter cases, including developer styles."
      longDescription={longDescription}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {conversionButtons.map(({ label, type }) => (
            <button
              key={type}
              onClick={() => applyCase(type)}
              className="bg-brand-primary text-white px-3 py-1.5 rounded-md hover:bg-brand-primary-hover transition-colors text-sm"
            >
              {label}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here..."
          className="w-full h-72 p-4 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <div className="flex justify-between items-center text-sm text-brand-text-secondary">
            <div>
                <span>Words: {stats.words}</span> | <span>Characters: {stats.characters}</span>
            </div>
            <div className="flex gap-2">
                <CopyButton textToCopy={text} />
                <button onClick={() => setText('')} className="bg-brand-border text-white px-4 py-2 rounded-md hover:bg-slate-600 transition-colors text-sm font-medium">Clear</button>
            </div>
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default CaseConverter;