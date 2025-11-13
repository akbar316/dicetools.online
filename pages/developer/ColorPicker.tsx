import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (c: number) => ('0' + Math.round(c).toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const rgbToHsl = (r: number, g: number, b: number): { h: number, s: number, l: number } => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } 
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToRgb = (h: number, s: number, l: number): { r: number, g: number, b: number } => {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; } 
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; } 
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; } 
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; } 
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; } 
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
    r = Math.round((r + m) * 255); g = Math.round((g + m) * 255); b = Math.round((b + m) * 255);
    return { r, g, b };
};

const rgbToCmyk = (r: number, g: number, b: number): { c: number, m: number, y: number, k: number } => {
    if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
    let c = 1 - r / 255, m = 1 - g / 255, y = 1 - b / 255;
    const k = Math.min(c, m, y);
    c = (c - k) / (1 - k); m = (m - k) / (1 - k); y = (y - k) / (1 - k);
    return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
};

// Simplified HWB conversion for display
const rgbToHwb = (h: number, s: number, l: number): { h: number, w: number, b: number } => {
    const w = Math.min(100 - s, l);
    const b = 100 - Math.max(l, s);
    return { h, w: Math.round(w), b: Math.round(b) };
};

// WCAG Contrast Ratio
const getLuminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};
const getContrastRatio = (rgb1: {r:number,g:number,b:number}, rgb2: {r:number,g:number,b:number}) => {
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
};


const ColorPicker: React.FC = () => {
    const [hexColor, setHexColor] = useState('#38bdf8');
    
    const rgb = hexToRgb(hexColor);
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
    const cmyk = rgb ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : null;
    const hwb = hsl ? rgbToHwb(hsl.h, hsl.s, hsl.l) : null;
    
    // Contrast Ratios
    const whiteContrast = rgb ? getContrastRatio(rgb, {r: 255, g: 255, b: 255}) : 1;
    const blackContrast = rgb ? getContrastRatio(rgb, {r: 0, g: 0, b: 0}) : 1;
    
    // Palette Generation
    const palettes: { [key: string]: string[] } = {
        Complementary: [], Monochromatic: [], Analogous: [], Triadic: [],
    };
    if (hsl) {
        // Complementary
        const compHue = (hsl.h + 180) % 360;
        palettes.Complementary.push(hexColor, rgbToHex(hslToRgb(compHue, hsl.s, hsl.l).r, hslToRgb(compHue, hsl.s, hsl.l).g, hslToRgb(compHue, hsl.s, hsl.l).b));
        // Monochromatic
        for (let i = -2; i <= 2; i++) {
            palettes.Monochromatic.push(rgbToHex(hslToRgb(hsl.h, hsl.s, Math.max(0, Math.min(100, hsl.l + i * 15))).r, hslToRgb(hsl.h, hsl.s, Math.max(0, Math.min(100, hsl.l + i * 15))).g, hslToRgb(hsl.h, hsl.s, Math.max(0, Math.min(100, hsl.l + i * 15))).b));
        }
        // Analogous
        for (let i = -1; i <= 1; i++) {
             palettes.Analogous.push(rgbToHex(hslToRgb((hsl.h + i * 30 + 360) % 360, hsl.s, hsl.l).r, hslToRgb((hsl.h + i * 30 + 360) % 360, hsl.s, hsl.l).g, hslToRgb((hsl.h + i * 30 + 360) % 360, hsl.s, hsl.l).b));
        }
        // Triadic
        for (let i = 0; i < 3; i++) {
             palettes.Triadic.push(rgbToHex(hslToRgb((hsl.h + i * 120) % 360, hsl.s, hsl.l).r, hslToRgb((hsl.h + i * 120) % 360, hsl.s, hsl.l).g, hslToRgb((hsl.h + i * 120) % 360, hsl.s, hsl.l).b));
        }
    }
    
    const longDescription = (
      <>
        <p>
          Discover, convert, and harmonize colors with our Advanced Color Utility, the ultimate all-in-one tool for designers, developers, and artists. At its core is an intuitive color picker that allows you to select any hue visually. Once a color is chosen, the tool instantly provides its corresponding values across multiple color models, including HEX, RGB, HSL, CMYK, and HWB. This makes it incredibly easy to translate colors between web design (RGB/HEX), print media (CMYK), and other digital applications. Each value is presented clearly with a one-click copy button, streamlining your workflow.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Inspiration and Accessibility in One Place</h3>
        <p>
          This utility is more than just a converter; it's a creative and practical partner. It automatically generates several color palettes based on your selected hue, including complementary, monochromatic, analogous, and triadic schemes, providing instant inspiration for your projects. Furthermore, the built-in accessibility checker calculates the WCAG contrast ratio of your color against both black and white text. This crucial feature helps you ensure your designs are readable and compliant with accessibility standards, making your work usable for everyone.
        </p>
      </>
    );

    return (
        <ToolPageLayout title="Advanced Color Utility" description="Pick a color, generate palettes, and check accessibility." longDescription={longDescription}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div style={{ backgroundColor: hexColor }} className="w-48 h-48 rounded-full border-8 border-brand-surface shadow-lg"></div>
                            <input type="color" value={hexColor} onChange={(e) => setHexColor(e.target.value)} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"/>
                        </div>
                    </div>
                     <div className="space-y-3 w-full max-w-sm mx-auto">
                        <ColorValue label="HEX" value={hexColor} />
                        {rgb && <ColorValue label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} />}
                        {hsl && <ColorValue label="HSL" value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} />}
                        {cmyk && <ColorValue label="CMYK" value={`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`} />}
                        {hwb && <ColorValue label="HWB" value={`hwb(${hwb.h}, ${hwb.w}%, ${hwb.b}%)`} />}
                    </div>
                    <div className="bg-brand-bg p-4 rounded-lg max-w-sm mx-auto">
                         <h3 className="font-semibold text-center mb-2">Accessibility</h3>
                         <div className="grid grid-cols-2 gap-4 text-center">
                            <ContrastCheck title="vs White Text" contrast={whiteContrast} textColor="#FFF" bgColor={hexColor} />
                            <ContrastCheck title="vs Black Text" contrast={blackContrast} textColor="#000" bgColor={hexColor} />
                         </div>
                    </div>
                </div>
                <div>
                     <h3 className="font-semibold text-lg text-center mb-4">Color Palettes</h3>
                     <div className="space-y-4">
                        {Object.entries(palettes).map(([name, colors]) => (
                            <div key={name}>
                                <h4 className="font-semibold text-brand-text-secondary mb-1">{name}</h4>
                                <div className="flex gap-1 h-12 rounded-lg overflow-hidden">
                                    {colors.map(c => <div key={c} style={{backgroundColor: c}} className="flex-grow" title={c}/>)}
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </ToolPageLayout>
    );
};

const ContrastCheck: React.FC<{title:string, contrast:number, textColor:string, bgColor:string}> = ({title, contrast, textColor, bgColor}) => {
    const getLevel = (c: number) => {
        if (c >= 7) return { text: 'AAA', color: 'text-green-400'};
        if (c >= 4.5) return { text: 'AA', color: 'text-green-400'};
        return { text: 'Fail', color: 'text-red-400'};
    }
    const level = getLevel(contrast);

    return (
        <div>
            <p className="text-xs">{title}</p>
            <div style={{color: textColor, backgroundColor: bgColor}} className="p-1 my-1 rounded-md text-sm font-bold">Aa</div>
            <p className="font-bold">{contrast.toFixed(2)}</p>
            <p className={`text-xs font-semibold ${level.color}`}>{level.text}</p>
        </div>
    );
}

const ColorValue: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div className="flex items-center">
        <span className="w-16 font-semibold text-brand-text-secondary">{label}:</span>
        <input type="text" readOnly value={value} className="flex-grow p-2 bg-brand-bg border border-brand-border rounded-l-md font-mono text-sm"/>
        <CopyButton textToCopy={value} />
    </div>
);

const CopyButton: React.FC<{textToCopy: string}> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => { navigator.clipboard.writeText(textToCopy); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
        <button onClick={handleCopy} className="bg-brand-primary p-2 rounded-r-md hover:bg-brand-primary-hover text-white">
            {copied ? '✔' : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>}
        </button>
    );
}

export default ColorPicker;