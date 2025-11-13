import React, { useState, useMemo } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const QrCodeGenerator: React.FC = () => {
    const [text, setText] = useState('https://dicetools.com');
    const [size, setSize] = useState(256);
    const [color, setColor] = useState('000000');
    const [bgColor, setBgColor] = useState('ffffff');
    const [margin, setMargin] = useState(1);
    const [qzone, setQzone] = useState(0);
    const [ecLevel, setEcLevel] = useState<'L' | 'M' | 'Q' | 'H'>('L');

    const qrCodeUrl = useMemo(() => {
        if (!text) return '';
        const params = new URLSearchParams({
            data: text,
            size: `${size}x${size}`,
            color: color,
            bgcolor: bgColor,
            margin: margin.toString(),
            qzone: qzone.toString(),
            ecc: ecLevel,
        });
        return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
    }, [text, size, color, bgColor, margin, qzone, ecLevel]);

    return (
        <ToolPageLayout
            title="QR Code Generator"
            description="Generate a QR code from any text or URL with advanced customization."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 flex flex-col items-center gap-6">
                    <div className="p-4 bg-white rounded-lg shadow-md">
                        {qrCodeUrl ? (
                             <img src={qrCodeUrl} alt="Generated QR Code" width={size} height={size} />
                        ) : (
                            <div style={{width: size, height: size}} className="flex items-center justify-center text-center text-sm text-gray-500 bg-gray-100">
                                Enter text to generate QR code
                            </div>
                        )}
                    </div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text or URL"
                        rows={3}
                        className="w-full max-w-md p-3 bg-brand-bg border border-brand-border rounded-md"
                    />
                     {qrCodeUrl && (
                        <a 
                            href={qrCodeUrl + '&download=1'}
                            download="qrcode.png"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                            Download QR Code
                        </a>
                    )}
                </div>
                <div className="space-y-4 bg-brand-bg p-4 rounded-lg">
                    <h3 className="font-semibold text-lg text-brand-primary">Options</h3>
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Size ({size}px)</label>
                        <input type="range" min="100" max="500" step="10" value={size} onChange={e => setSize(parseInt(e.target.value))} className="w-full"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Color</label>
                        <div className="flex items-center gap-2">
                            <input type="color" value={`#${color}`} onChange={e => setColor(e.target.value.substring(1))} className="w-10 h-10 p-1 bg-brand-surface border-brand-border rounded"/>
                            <input type="text" value={color} onChange={e => setColor(e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded font-mono"/>
                        </div>
                    </div>
                      <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Background Color</label>
                        <div className="flex items-center gap-2">
                             <input type="color" value={`#${bgColor}`} onChange={e => setBgColor(e.target.value.substring(1))} className="w-10 h-10 p-1 bg-brand-surface border-brand-border rounded"/>
                            <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded font-mono"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Error Correction</label>
                        <select value={ecLevel} onChange={e => setEcLevel(e.target.value as any)} className="w-full p-2 bg-brand-surface border border-brand-border rounded">
                            <option value="L">Low (L)</option>
                            <option value="M">Medium (M)</option>
                            <option value="Q">Quartile (Q)</option>
                            <option value="H">High (H)</option>
                        </select>
                    </div>
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default QrCodeGenerator;
