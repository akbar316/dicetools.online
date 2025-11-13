import React, { useState, useEffect } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

type Mode = 'encode' | 'decode';
type EncodeMode = 'component' | 'uri';

const UrlEncoder: React.FC = () => {
  const [input, setInput] = useState('https://example.com/path?q=test value');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [encodeMode, setEncodeMode] = useState<EncodeMode>('component');
  const [liveMode, setLiveMode] = useState(true);

  const process = (text: string, currentMode: Mode, currentEncodeMode: EncodeMode) => {
    if (!text.trim()) {
      setOutput('');
      return;
    }
    try {
      if (currentMode === 'encode') {
        setOutput(currentEncodeMode === 'component' ? encodeURIComponent(text) : encodeURI(text));
      } else {
        setOutput(decodeURIComponent(text));
      }
    } catch (e) {
      setOutput('Invalid string');
    }
  };

  useEffect(() => {
    if (liveMode) {
      process(input, mode, encodeMode);
    }
  }, [input, mode, encodeMode, liveMode]);
  
  const handleProcessClick = () => {
      process(input, mode, encodeMode);
  };
  
  const longDescription = (
    <>
      <p>
        The Advanced URL Encoder/Decoder is an essential tool for web developers, SEO specialists, and anyone working with URLs. It allows you to convert strings into a valid URL format, ensuring that special characters are correctly interpreted by web browsers and servers. This is crucial for passing data in query parameters or creating correctly formatted links. Our tool provides a simple dual-pane interface to instantly see the input and output. With Live Mode enabled, your text is converted as you type, providing immediate feedback. All operations are performed client-side, guaranteeing your data remains private and secure.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Understanding Encoding Types</h3>
      <p>
        Different situations require different types of URL encoding. Our tool gives you the control to choose the right one for your needs.
      </p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>encodeURIComponent:</strong> This is the most common choice. It encodes all special characters, making it perfect for query string values (e.g., the part after `?q=`).</li>
        <li><strong>encodeURI:</strong> This function is less aggressive and does not encode reserved characters like `/`, `?`, `:`, `@`, `&`, `=`, `+`, `$`, and `#`. It's suitable for encoding a full URL that already contains these separators.</li>
        <li><strong>Decode:</strong> Easily reverse the process, converting a percent-encoded URL back into its human-readable form to analyze its contents.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Advanced URL Encoder / Decoder"
      description="Encode/decode URI components, with live mode and different encoding types."
      longDescription={longDescription}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text or URL string..."
              className="w-full h-48 p-4 bg-brand-bg border border-brand-border rounded-md"
            />
            <textarea
              readOnly
              value={output}
              placeholder="Result..."
              className="w-full h-48 p-4 bg-brand-bg border border-brand-border rounded-md"
            />
        </div>
        <div className="bg-brand-bg p-4 rounded-lg space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex border border-brand-border rounded-md">
                    <button onClick={() => setMode('encode')} className={`px-4 py-2 rounded-l-md ${mode === 'encode' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>Encode</button>
                    <button onClick={() => setMode('decode')} className={`px-4 py-2 rounded-r-md ${mode === 'decode' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>Decode</button>
                </div>
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={liveMode} onChange={e => setLiveMode(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary bg-brand-surface" />
                    <span>Live Mode</span>
                </label>
            </div>
            {mode === 'encode' && (
                <div className="border-t border-brand-border pt-4">
                    <h4 className="font-semibold mb-2">Encoding Type</h4>
                    <div className="flex gap-4">
                         <label className="flex items-center space-x-2">
                            <input type="radio" name="enc-mode" value="component" checked={encodeMode === 'component'} onChange={() => setEncodeMode('component')} className="text-brand-primary"/>
                            <div>
                                <span className="font-semibold">encodeURIComponent</span>
                                <p className="text-xs text-brand-text-secondary">Encodes everything. Use for query string parts.</p>
                            </div>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input type="radio" name="enc-mode" value="uri" checked={encodeMode === 'uri'} onChange={() => setEncodeMode('uri')} className="text-brand-primary"/>
                            <div>
                                <span className="font-semibold">encodeURI</span>
                                <p className="text-xs text-brand-text-secondary">Skips reserved characters (;,/?:@&=+$#). Use for full URLs.</p>
                            </div>
                        </label>
                    </div>
                </div>
            )}
        </div>
        <div className="flex justify-center gap-4">
          {!liveMode && <button onClick={handleProcessClick} className="bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-primary-hover transition-colors">Process</button>}
          <CopyButton textToCopy={output} />
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default UrlEncoder;