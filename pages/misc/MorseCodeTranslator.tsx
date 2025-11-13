
import React, { useState } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';

const morseCodeMap: { [key: string]: string } = { 'A':'.-', 'B':'-...', 'C':'-.-.', 'D':'-..', 'E':'.', 'F':'..-.', 'G':'--.', 'H':'....', 'I':'..', 'J':'.---', 'K':'-.-', 'L':'.-..', 'M':'--', 'N':'-.', 'O':'---', 'P':'.--.', 'Q':'--.-', 'R':'.-.', 'S':'...', 'T':'-', 'U':'..-', 'V':'...-', 'W':'.--', 'X':'-..-', 'Y':'-.--', 'Z':'--..', '1':'.----', '2':'..---', '3':'...--', '4':'....-', '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.', '0':'-----', ' ':'/' };
const textMap = Object.fromEntries(Object.entries(morseCodeMap).map(([k, v]) => [v, k]));

const MorseCodeTranslator: React.FC = () => {
    const [text, setText] = useState('');
    const [morse, setMorse] = useState('');

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value.toUpperCase();
        setText(val);
        const translated = val.split('').map(char => morseCodeMap[char] || '').join(' ');
        setMorse(translated);
    };
    
    const handleMorseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setMorse(val);
        const translated = val.split(' ').map(code => textMap[code] || '').join('');
        setText(translated);
    }

    return (
        <ToolPageLayout
            title="Morse Code Translator"
            description="Translate text to and from Morse code."
        >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Enter Text..."
                    className="w-full h-64 p-4 bg-brand-bg border border-brand-border rounded-md"
                />
                <textarea
                    value={morse}
                    onChange={handleMorseChange}
                    placeholder="Enter Morse Code..."
                    className="w-full h-64 p-4 bg-brand-bg border border-brand-border rounded-md font-mono"
                />
            </div>
            <div className="mt-4 flex justify-end gap-4">
                <CopyButton textToCopy={text} />
                <CopyButton textToCopy={morse} />
            </div>
        </ToolPageLayout>
    );
};

export default MorseCodeTranslator;
