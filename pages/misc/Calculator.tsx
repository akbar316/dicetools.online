import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const Calculator: React.FC = () => {
    const [display, setDisplay] = useState('0');
    const [mode, setMode] = useState<'standard' | 'scientific'>('standard');
    
    // Helper for factorial
    const factorial = (n: number): number => {
        if (n < 0 || n > 170) return Infinity; // Handle out of range
        if (n === 0) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    };

    const handleButtonClick = (value: string) => {
        if (display === 'Error' || display === 'Infinity') {
            setDisplay(value === 'C' ? '0' : value);
            return;
        }

        switch (value) {
            case 'C':
                setDisplay('0');
                break;
            case '=':
                try {
                    let expr = display;
                    
                    // Replace functions before constants
                    expr = expr.replace(/√/g, 'Math.sqrt');
                    expr = expr.replace(/sin/g, 'Math.sin');
                    expr = expr.replace(/cos/g, 'Math.cos');
                    expr = expr.replace(/tan/g, 'Math.tan');
                    expr = expr.replace(/log/g, 'Math.log10');
                    expr = expr.replace(/ln/g, 'Math.log');
                    
                    // Replace constants
                    expr = expr.replace(/π/g, 'Math.PI');
                    expr = expr.replace(/e/g, 'Math.E');

                    // Replace operators
                    expr = expr.replace(/\^/g, '**');

                    // Factorial: needs to be handled carefully
                    expr = expr.replace(/(\d+)!/g, (_, num) => String(factorial(parseInt(num, 10))));

                    const result = eval(expr.replace(/%/g, '/100'));
                    setDisplay(String(result));
                } catch (e) {
                    setDisplay('Error');
                }
                break;
            case 'DEL':
                setDisplay(display.slice(0, -1) || '0');
                break;
            case 'sin':
            case 'cos':
            case 'tan':
            case 'log':
            case 'ln':
            case '√':
                 if (display === '0') {
                    setDisplay(value + '(');
                } else {
                    setDisplay(display + value + '(');
                }
                break;
            case 'x²':
                setDisplay(display + '^' + '(2)');
                break;
            default:
                if (display === '0' && value !== '.') {
                    setDisplay(value);
                } else {
                    setDisplay(display + value);
                }
                break;
        }
    };
    
    const standardButtons = ['C', '%', 'DEL', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='];
    const scientificButtons = ['sin', 'cos', 'tan', 'log', 'ln', '√', '(', ')', 'π', 'e', '^', 'x²', '!'];

    const operatorButtons = ['/', '*', '-', '+', '='];
    const functionButtons = ['C', '%', 'DEL'];

    return (
        <ToolPageLayout
            title="Calculator"
            description="A versatile calculator for standard and scientific calculations."
        >
            <div className={`mx-auto bg-brand-bg p-4 rounded-lg shadow-inner transition-all duration-300 ${mode === 'standard' ? 'max-w-xs' : 'max-w-lg'}`}>
                <div className="flex justify-center mb-4 bg-brand-surface p-1 rounded-md">
                    <button onClick={() => setMode('standard')} className={`w-1/2 py-1 rounded-md transition-colors ${mode === 'standard' ? 'bg-brand-primary' : 'hover:bg-brand-border'}`}>Standard</button>
                    <button onClick={() => setMode('scientific')} className={`w-1/2 py-1 rounded-md transition-colors ${mode === 'scientific' ? 'bg-brand-primary' : 'hover:bg-brand-border'}`}>Scientific</button>
                </div>
                
                <div className="bg-brand-surface text-right p-4 rounded-md mb-4 text-4xl font-mono break-all overflow-x-auto">
                    {display}
                </div>
                
                <div className="flex gap-2">
                    {mode === 'scientific' && (
                        <div className="grid grid-cols-3 gap-2">
                            {scientificButtons.map(btn => (
                                 <button
                                    key={btn}
                                    onClick={() => handleButtonClick(btn)}
                                    className={`p-4 rounded-md text-lg transition-colors bg-slate-700 hover:bg-slate-600 aspect-square flex items-center justify-center`}
                                >
                                    {btn}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-4 gap-2 flex-grow">
                        {standardButtons.map(btn => {
                            const isOperator = operatorButtons.includes(btn);
                            const isFunction = functionButtons.includes(btn);
                            return (
                                <button
                                    key={btn}
                                    onClick={() => handleButtonClick(btn)}
                                    className={`p-4 rounded-md text-xl transition-colors ${
                                        isOperator ? 'bg-brand-primary hover:bg-brand-primary-hover' : 
                                        isFunction ? 'bg-slate-600 hover:bg-slate-500' : 
                                        'bg-brand-surface hover:bg-brand-border'
                                    } ${btn === '=' ? 'col-span-2' : ''}`}
                                >
                                    {btn}
                                </button>
                            )
                        })}
                    </div>
                </div>
                 {mode === 'scientific' && <p className="text-xs text-center text-brand-text-secondary mt-4">Trigonometry functions use Radians. Factorial is for integers only.</p>}
            </div>
        </ToolPageLayout>
    );
};

export default Calculator;