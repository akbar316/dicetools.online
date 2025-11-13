import React, { useState, useEffect } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

interface Rule {
    id: number;
    userAgent: string;
    type: 'Allow' | 'Disallow';
    path: string;
}

const createAndDownloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};


const RobotsTxtGenerator: React.FC = () => {
    const [defaultPolicy, setDefaultPolicy] = useState<'allow' | 'disallow'>('allow');
    const [rules, setRules] = useState<Rule[]>([]);
    const [sitemap, setSitemap] = useState('');
    const [generatedTxt, setGeneratedTxt] = useState('');

    useEffect(() => {
        let content = '';
        const groupedRules: { [key: string]: Rule[] } = rules.reduce((acc, rule) => {
            (acc[rule.userAgent] = acc[rule.userAgent] || []).push(rule);
            return acc;
        }, {});
        
        if (Object.keys(groupedRules).length === 0) {
            content += 'User-agent: *\n';
            content += defaultPolicy === 'allow' ? 'Disallow:\n' : 'Disallow: /\n';
        } else {
             content += `User-agent: *\n`;
             content += defaultPolicy === 'allow' ? `Disallow:\n` : `Disallow: /\n`;
        }

        for (const userAgent in groupedRules) {
            content += `\nUser-agent: ${userAgent}\n`;
            groupedRules[userAgent].forEach(rule => {
                content += `${rule.type}: ${rule.path}\n`;
            });
        }
        
        if (sitemap.trim()) {
            content += `\nSitemap: ${sitemap.trim()}\n`;
        }

        setGeneratedTxt(content);

    }, [defaultPolicy, rules, sitemap]);
    
    const addRule = () => {
        setRules([...rules, { id: Date.now(), userAgent: '*', type: 'Disallow', path: '/private' }]);
    };
    
    const updateRule = (id: number, field: keyof Rule, value: string) => {
        setRules(rules.map(r => r.id === id ? { ...r, [field]: value } as Rule : r));
    };

    const removeRule = (id: number) => {
        setRules(rules.filter(r => r.id !== id));
    };

    return (
        <ToolPageLayout
            title="Robots.txt Generator"
            description="Create a valid robots.txt file to guide search engine crawlers."
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">Default Policy for All Crawlers</h3>
                        <select value={defaultPolicy} onChange={e => setDefaultPolicy(e.target.value as any)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md">
                            <option value="allow">Allow All</option>
                            <option value="disallow">Disallow All</option>
                        </select>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Specific Crawler Rules</h3>
                        <div className="space-y-2">
                        {rules.map(rule => (
                            <div key={rule.id} className="grid grid-cols-12 gap-2 items-center bg-brand-bg p-2 rounded-md">
                                <input type="text" value={rule.userAgent} onChange={e => updateRule(rule.id, 'userAgent', e.target.value)} placeholder="User-agent" className="col-span-3 p-1 bg-brand-surface rounded" />
                                <select value={rule.type} onChange={e => updateRule(rule.id, 'type', e.target.value)} className="col-span-3 p-1 bg-brand-surface rounded">
                                    <option>Allow</option>
                                    <option>Disallow</option>
                                </select>
                                <input type="text" value={rule.path} onChange={e => updateRule(rule.id, 'path', e.target.value)} placeholder="/path/" className="col-span-5 p-1 bg-brand-surface rounded" />
                                <button onClick={() => removeRule(rule.id)} className="col-span-1 text-red-500 font-bold text-center">✕</button>
                            </div>
                        ))}
                        </div>
                        <button onClick={addRule} className="text-brand-primary mt-2">+ Add Rule</button>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Sitemap URL</h3>
                        <input type="url" value={sitemap} onChange={e => setSitemap(e.target.value)} placeholder="https://www.example.com/sitemap.xml" className="w-full p-2 bg-brand-bg border border-brand-border rounded-md" />
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold mb-2">Generated robots.txt</h3>
                    <div className="relative">
                        <textarea readOnly value={generatedTxt} className="w-full h-96 p-4 bg-brand-bg border border-brand-border rounded-md font-mono text-sm" />
                        <div className="absolute top-2 right-2 flex gap-2">
                            <CopyButton textToCopy={generatedTxt} />
                            <button
                                onClick={() => createAndDownloadFile(generatedTxt, 'robots.txt', 'text/plain')}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default RobotsTxtGenerator;