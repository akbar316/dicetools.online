import React, { useState, useEffect, useCallback } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

interface Strength {
    score: number; // 0-4
    text: string;
    color: string;
}

const PasswordStrengthMeter: React.FC<{ strength: Strength | null }> = ({ strength }) => {
    if (!strength) return null;
    const barWidth = `${(strength.score + 1) * 20}%`;
    return (
        <div className="space-y-2">
            <div className="w-full bg-brand-bg rounded-full h-2.5">
                <div className="h-2.5 rounded-full transition-all duration-300" style={{ width: barWidth, backgroundColor: strength.color }}></div>
            </div>
            <p className="text-sm font-semibold text-right" style={{ color: strength.color }}>{strength.text}</p>
        </div>
    );
};


const PasswordGenerator: React.FC = () => {
    const [length, setLength] = useState(16);
    const [includeUppercase, setIncludeUppercase] = useState(true);
    const [includeLowercase, setIncludeLowercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [includeWord, setIncludeWord] = useState('');
    const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
    const [excludeChars, setExcludeChars] = useState('');
    const [password, setPassword] = useState('');
    const [strength, setStrength] = useState<Strength | null>(null);
    const [error, setError] = useState('');

    const calculateStrength = (pass: string): Strength => {
        let score = 0;
        if (pass.length >= 8) score++;
        if (pass.length >= 12) score++;
        const types = {
            upper: /[A-Z]/.test(pass),
            lower: /[a-z]/.test(pass),
            num: /\d/.test(pass),
            sym: /[^A-Za-z0-9]/.test(pass),
        };
        const numTypes = Object.values(types).filter(Boolean).length;
        if (numTypes >= 2) score++;
        if (numTypes >= 4) score++;

        const strengthLevels: { [key: number]: { text: string; color: string } } = {
            0: { text: 'Very Weak', color: '#ef4444' }, // red-500
            1: { text: 'Weak', color: '#f97316' }, // orange-500
            2: { text: 'Medium', color: '#eab308' }, // yellow-500
            3: { text: 'Strong', color: '#84cc16' }, // lime-500
            4: { text: 'Very Strong', color: '#22c55e' }, // green-500
        };
        
        return { score, ...strengthLevels[score] };
    };

    const generatePassword = useCallback(() => {
        setError('');
        const sanitizedWord = includeWord.trim();

        if (sanitizedWord.length > length) {
            setError('Your custom word cannot be longer than the password length.');
            setPassword('');
            setStrength(null);
            return;
        }

        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
        const ambiguous = 'il1LoO0';
        
        const selectedTypes = [];
        if (includeUppercase) selectedTypes.push(upper);
        if (includeLowercase) selectedTypes.push(lower);
        if (includeNumbers) selectedTypes.push(numbers);
        if (includeSymbols) selectedTypes.push(symbols);
        
        if (selectedTypes.length === 0 && !sanitizedWord) {
            setError('Please select at least one character type or provide a word to include.');
            setPassword('');
            setStrength(null);
            return;
        }

        let charset = selectedTypes.join('');
        if (excludeAmbiguous) {
            charset = charset.split('').filter(c => !ambiguous.includes(c)).join('');
        }
        if (excludeChars) {
            charset = charset.split('').filter(c => !excludeChars.includes(c)).join('');
        }
        
        if (charset === '' && length > sanitizedWord.length) {
            setError('Character set is empty. Please select character types to fill the remaining length.');
            setPassword('');
            setStrength(null);
            return;
        }

        let newPasswordArray = [];
        
        if (sanitizedWord) {
            newPasswordArray.push(...sanitizedWord.split(''));
        }
        
        // Guarantee at least one char from each selected type
        selectedTypes.forEach(type => {
            let filteredType = type.split('').filter(c => charset.includes(c)).join('');
            if (filteredType.length > 0) {
                const array = new Uint32Array(1);
                window.crypto.getRandomValues(array);
                newPasswordArray.push(filteredType[array[0] % filteredType.length]);
            }
        });
        
        const remainingLength = length - newPasswordArray.length;
        if (remainingLength > 0 && charset) {
            const array = new Uint32Array(remainingLength);
            window.crypto.getRandomValues(array);
            for (let i = 0; i < remainingLength; i++) {
                newPasswordArray.push(charset[array[i] % charset.length]);
            }
        }
        
        // Shuffle the array to mix guaranteed chars
        for (let i = newPasswordArray.length - 1; i > 0; i--) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            const j = array[0] % (i + 1);
            [newPasswordArray[i], newPasswordArray[j]] = [newPasswordArray[j], newPasswordArray[i]];
        }

        const finalPassword = newPasswordArray.join('').slice(0, length);
        setPassword(finalPassword);
        setStrength(calculateStrength(finalPassword));
    }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeAmbiguous, excludeChars, includeWord]);

    useEffect(() => {
        generatePassword();
    }, [generatePassword]);


    return (
        <ToolPageLayout
            title="Advanced Password Generator"
            description="Create strong, secure, and customizable passwords."
        >
            <div className="max-w-xl mx-auto space-y-6">
                <div className="space-y-2">
                    <div className="flex">
                        <input type="text" readOnly value={password} className="w-full p-3 bg-brand-bg border border-brand-border rounded-l-md font-mono text-xl" />
                        <CopyButton textToCopy={password} />
                    </div>
                    <PasswordStrengthMeter strength={strength} />
                </div>
                
                <div className="bg-brand-bg p-6 rounded-lg space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                             <label className="font-semibold text-brand-text-secondary">Password Length</label>
                             <input 
                                type="number" 
                                min="4" max="64" 
                                value={length} 
                                onChange={e => setLength(parseInt(e.target.value, 10))}
                                className="w-20 p-1 bg-brand-surface border border-brand-border rounded-md text-center"
                            />
                        </div>
                        <input type="range" min="4" max="64" value={length} onChange={e => setLength(parseInt(e.target.value, 10))} className="w-full h-2 bg-brand-surface rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div>
                        <label className="font-semibold text-brand-text-secondary mb-2 block">Character Types</label>
                        <div className="grid grid-cols-2 gap-4">
                            <Checkbox label="Uppercase (A-Z)" checked={includeUppercase} onChange={setIncludeUppercase} />
                            <Checkbox label="Lowercase (a-z)" checked={includeLowercase} onChange={setIncludeLowercase} />
                            <Checkbox label="Numbers (0-9)" checked={includeNumbers} onChange={setIncludeNumbers} />
                            <Checkbox label="Symbols (!@#$)" checked={includeSymbols} onChange={setIncludeSymbols} />
                        </div>
                    </div>

                    <div>
                        <label className="font-semibold text-brand-text-secondary mb-2 block">Customization</label>
                         <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Include a specific word</label>
                                <input 
                                    type="text" 
                                    value={includeWord} 
                                    onChange={e => setIncludeWord(e.target.value)}
                                    placeholder="e.g., sunny"
                                    className="w-full p-2 bg-brand-surface border border-brand-border rounded-md font-mono"
                                />
                                <p className="text-xs text-brand-text-secondary mt-1">Note: Using easily guessable words may reduce security.</p>
                            </div>
                            <Checkbox label="Exclude Ambiguous Characters (i, l, 1, L, o, 0, O)" checked={excludeAmbiguous} onChange={setExcludeAmbiguous} />
                             <div>
                                 <label className="block text-sm font-medium text-brand-text-secondary mb-1">Exclude these characters</label>
                                 <input 
                                    type="text" 
                                    value={excludeChars} 
                                    onChange={e => setExcludeChars(e.target.value)}
                                    placeholder="e.g., {}[]()"
                                    className="w-full p-2 bg-brand-surface border border-brand-border rounded-md font-mono"
                                />
                             </div>
                        </div>
                    </div>
                </div>
                 
                 {error && <p className="text-red-500 text-center">{error}</p>}

                 <button onClick={generatePassword} className="w-full bg-brand-primary text-white py-3 rounded-md hover:bg-brand-primary-hover font-semibold text-lg flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    Regenerate
                 </button>
            </div>
        </ToolPageLayout>
    );
};

const Checkbox: React.FC<{label: string, checked: boolean, onChange: (c: boolean) => void}> = ({label, checked, onChange}) => (
    <label className="flex items-center space-x-3 p-3 bg-brand-surface rounded-md cursor-pointer hover:bg-brand-border">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary bg-brand-bg" />
        <span className="text-sm">{label}</span>
    </label>
);

export default PasswordGenerator;