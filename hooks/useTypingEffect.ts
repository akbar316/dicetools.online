import { useState, useEffect } from 'react';

export const useTypingEffect = (text: string, duration: number) => {
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        setDisplayText(''); // Reset on text change
        setIsTyping(true);
        if (!text) return;
        
        const interval = duration / text.length;
        let charIndex = 0;

        const typingTimeout = setInterval(() => {
            if (charIndex < text.length) {
                setDisplayText(prev => prev + text[charIndex]);
                charIndex++;
            } else {
                clearInterval(typingTimeout);
                setIsTyping(false);
            }
        }, interval);

        return () => clearInterval(typingTimeout);
    }, [text, duration]);

    return { displayText, isTyping };
};
