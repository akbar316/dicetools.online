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

                    // Replace percent with division by 100 before parsing
                    expr = expr.replace(/%/g, '/100');

                    // Evaluate expression safely using a small local parser/evaluator.
                    const result = evaluateExpression(expr);
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

// Small expression evaluator supporting numbers, + - * / ^ %, parentheses,
// and common functions used by the calculator (sin, cos, tan, sqrt, log, ln).
function evaluateExpression(input: string): number {
    // Tokenize
    const tokens: string[] = [];
    const tokenRe = /([0-9]+\.?[0-9]*|\.?[0-9]+)|([A-Za-zπ]+)|([()+\-*/^%!])/g;
    let m: RegExpExecArray | null;
    while ((m = tokenRe.exec(input)) !== null) {
        if (m[1]) tokens.push(m[1]);
        else if (m[2]) tokens.push(m[2]);
        else if (m[3]) tokens.push(m[3]);
    }

    // Replace constants and normalize function names
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === 'π' || tokens[i] === 'pi' || tokens[i] === 'PI') tokens[i] = String(Math.PI);
        if (tokens[i] === 'e') tokens[i] = String(Math.E);
        // normalize trig/function names to lower case
        if (/^[A-Za-z]+$/.test(tokens[i])) tokens[i] = tokens[i].toLowerCase();
    }

    const isNumber = (t: string) => /^[0-9]+\.?[0-9]*$/.test(t);

    // Shunting-yard to RPN
    const output: string[] = [];
    const ops: string[] = [];
    const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };
    const rightAssoc: Record<string, boolean> = { '^': true };

    const isFunctionName = (s: string) => ['sin', 'cos', 'tan', 'sqrt', 'log', 'ln'].includes(s);

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (isNumber(t)) {
            output.push(t);
        } else if (isFunctionName(t)) {
            ops.push(t);
        } else if (t === ',') {
            while (ops.length && ops[ops.length - 1] !== '(') output.push(ops.pop() as string);
        } else if (t === '(') {
            ops.push(t);
        } else if (t === ')') {
            while (ops.length && ops[ops.length - 1] !== '(') output.push(ops.pop() as string);
            ops.pop(); // remove '('
            if (ops.length && isFunctionName(ops[ops.length - 1])) output.push(ops.pop() as string);
        } else if (t === '!') {
            // postfix factorial - treat as a function
            output.push('!');
        } else if (/^[+\-*/^%]$/.test(t)) {
            while (
                ops.length &&
                ops[ops.length - 1] !== '(' &&
                ((rightAssoc[t] && precedence[t] < (precedence[ops[ops.length - 1]] || 0)) || (!rightAssoc[t] && precedence[t] <= (precedence[ops[ops.length - 1]] || 0)))
            ) {
                output.push(ops.pop() as string);
            }
            ops.push(t);
        } else {
            // unknown token, try to treat as number fallback
            output.push(t);
        }
    }

    while (ops.length) output.push(ops.pop() as string);

    // Evaluate RPN
    const stack: number[] = [];

    const factorialFn = (n: number) => {
        if (n < 0 || n > 170) return Infinity;
        if (n === 0) return 1;
        let r = 1;
        for (let i = 2; i <= Math.floor(n); i++) r *= i;
        return r;
    };

    for (const token of output) {
        if (isNumber(token)) stack.push(parseFloat(token));
        else if (token === '+') {
            const b = stack.pop() as number; const a = stack.pop() as number; stack.push(a + b);
        } else if (token === '-') {
            const b = stack.pop() as number; const a = stack.pop() as number; stack.push(a - b);
        } else if (token === '*') {
            const b = stack.pop() as number; const a = stack.pop() as number; stack.push(a * b);
        } else if (token === '/') {
            const b = stack.pop() as number; const a = stack.pop() as number; stack.push(a / b);
        } else if (token === '%') {
            const b = stack.pop() as number; const a = stack.pop() as number; stack.push(a % b);
        } else if (token === '^') {
            const b = stack.pop() as number; const a = stack.pop() as number; stack.push(Math.pow(a, b));
        } else if (token === '!') {
            const a = stack.pop() as number; stack.push(factorialFn(a));
        } else if (token === 'sin') {
            const a = stack.pop() as number; stack.push(Math.sin(a));
        } else if (token === 'cos') {
            const a = stack.pop() as number; stack.push(Math.cos(a));
        } else if (token === 'tan') {
            const a = stack.pop() as number; stack.push(Math.tan(a));
        } else if (token === 'sqrt') {
            const a = stack.pop() as number; stack.push(Math.sqrt(a));
        } else if (token === 'ln') {
            const a = stack.pop() as number; stack.push(Math.log(a));
        } else if (token === 'log') {
            const a = stack.pop() as number; stack.push(Math.log10 ? Math.log10(a) : Math.log(a) / Math.LN10);
        } else {
            // unrecognized token - try parse as number
            const n = Number(token);
            if (!isNaN(n)) stack.push(n);
            else throw new Error('Invalid expression token: ' + token);
        }
    }

    if (stack.length !== 1) throw new Error('Invalid expression');
    return stack[0];
}