import React, { useState } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

const HtmlFormatter: React.FC = () => {
    const [htmlInput, setHtmlInput] = useState('<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1><p>World</p></body></html>');
    const [formattedHtml, setFormattedHtml] = useState('');
    const [indentSize, setIndentSize] = useState(2);

    const format = (minify = false) => {
        if (minify) {
            const minified = htmlInput
                .replace(/<!--[\s\S]*?-->/g, '') // remove comments
                .replace(/\s{2,}/g, ' ') // collapse whitespace
                .replace(/>\s+</g, '><') // remove space between tags
                .trim();
            setFormattedHtml(minified);
            return;
        }

        let indent = 0;
        const indentChar = ' '.repeat(indentSize);
        const result = htmlInput
            .replace(/></g, '>\n<')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .map(line => {
                let i = indent;
                if (line.match(/^<\//) && !line.match(/<br>|<hr>|<input>|<link>|<meta>/)) { // Closing tag
                    indent--;
                    i = indent;
                }
                
                const indentedLine = indentChar.repeat(i) + line;
                
                if (line.match(/^<[^\/]/) && !line.match(/\/>$/) && !line.match(/<!/) && !line.match(/<br>|<hr>|<input>|<link>|<meta>/)) { // Opening tag, not self-closing
                    indent++;
                }
                
                return indentedLine;
            })
            .join('\n');
        setFormattedHtml(result);
    };
    
    const longDescription = (
      <>
        <p>
          Bring clarity and efficiency to your web development workflow with our HTML Formatter & Minifier. This dual-purpose tool is designed for front-end developers, web designers, and students who need to manage their HTML code effectively. Paste your messy or unformatted HTML into the editor, and with a single click, our beautifier will transform it into clean, perfectly indented, and readable code. This is invaluable for debugging, code reviews, and maintaining a clean project structure. The tool also features a live preview pane, allowing you to see exactly how your HTML renders in a browser as you edit.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Optimize for Performance</h3>
        <p>
          When you're ready to deploy your website, switch to the minifier mode. This function strips out all unnecessary characters from your code, such as whitespace, line breaks, and comments, without affecting the structure or functionality. The result is a compact, lightweight file that reduces your page's load time, improves performance, and can even have a positive impact on your SEO rankings. With customizable indentation options and a simple interface, this tool is your go-to solution for both developing and optimizing HTML.
        </p>
      </>
    );

    return (
        <ToolPageLayout
            title="HTML Formatter & Minifier"
            description="Beautify or minify your HTML code with a live preview."
            longDescription={longDescription}
        >
            <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-4 bg-brand-bg p-2 rounded-md">
                    <div className="flex gap-2">
                        <button onClick={() => format()} className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-primary-hover">Format</button>
                        <button onClick={() => format(true)} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700">Minify</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm">Indent Size:</label>
                        <select value={indentSize} onChange={e => setIndentSize(parseInt(e.target.value))} className="p-2 bg-brand-surface border border-brand-border rounded">
                            <option value="2">2 spaces</option>
                            <option value="4">4 spaces</option>
                        </select>
                    </div>
                     <CopyButton textToCopy={formattedHtml} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea
                        value={htmlInput}
                        onChange={(e) => setHtmlInput(e.target.value)}
                        placeholder="Paste your HTML here..."
                        className="w-full h-[60vh] p-4 bg-brand-bg border border-brand-border rounded-md font-mono text-sm"
                    />
                    <div className="flex flex-col h-[60vh]">
                        <h3 className="font-semibold mb-2">Formatted / Minified</h3>
                        <textarea
                            readOnly
                            value={formattedHtml}
                            placeholder="Output will appear here..."
                            className="w-full flex-grow p-4 bg-brand-bg border border-brand-border rounded-md font-mono text-sm"
                        />
                         <h3 className="font-semibold my-2">Live Preview</h3>
                         <iframe srcDoc={htmlInput} title="Live Preview" className="w-full h-1/2 bg-white border border-brand-border rounded-md"/>
                    </div>
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default HtmlFormatter;