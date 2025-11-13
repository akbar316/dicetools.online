import React, { useState } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

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

const SitemapGenerator: React.FC = () => {
    const [url, setUrl] = useState('https://dicetools.com');
    const [sitemapXml, setSitemapXml] = useState('');
    const [loading, setLoading] = useState(false);

    const generateSitemap = () => {
        if (!url.trim()) return;
        setLoading(true);
        setSitemapXml('');

        // Simulate crawling process
        setTimeout(() => {
            const baseUrl = new URL(url).origin;
            const today = new Date().toISOString().split('T')[0];
            const pages = ['/', '/about', '/contact', '/privacy-policy', '/tools/json-formatter'];

            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

            setSitemapXml(xml);
            setLoading(false);
        }, 1500);
    };

    return (
        <ToolPageLayout
            title="Sitemap Generator"
            description="Enter your website URL to generate a basic XML sitemap."
        >
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.example.com"
                        className="flex-grow p-3 bg-brand-bg border border-brand-border rounded-md text-lg"
                    />
                    <button
                        onClick={generateSitemap}
                        disabled={loading}
                        className="bg-brand-primary text-white px-8 py-3 rounded-md hover:bg-brand-primary-hover transition-colors disabled:bg-gray-500 font-semibold"
                    >
                        {loading ? 'Generating...' : 'Generate Sitemap'}
                    </button>
                </div>
                 {loading ? (
                    <div className="flex justify-center items-center h-64">
                         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
                    </div>
                ) : sitemapXml && (
                    <div>
                         <div className="relative">
                            <textarea
                                readOnly
                                value={sitemapXml}
                                className="w-full h-80 p-4 bg-brand-bg border border-brand-border rounded-md font-mono text-sm"
                            />
                             <div className="absolute top-2 right-2 flex gap-2">
                                <CopyButton textToCopy={sitemapXml} />
                                <button
                                    onClick={() => createAndDownloadFile(sitemapXml, 'sitemap.xml', 'application/xml')}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                 <p className="text-xs text-center text-brand-text-secondary">Note: This is a simplified generator and does not crawl your website.</p>
            </div>
        </ToolPageLayout>
    );
};

export default SitemapGenerator;