import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';
import { GoogleGenAI } from '@google/genai';

interface BmiResult {
    bmi: number;
    category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity';
    idealWeight: string;
}

const AiLoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2 text-sm text-brand-text-secondary">
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-brand-primary"></div>
        <span>Generating AI summary...</span>
    </div>
);


const BmiGauge: React.FC<{ bmi: number }> = ({ bmi }) => {
    const getRotation = (value: number) => {
        if (value < 15) return -80;
        if (value > 40) return 80;
        // Map BMI from 15-40 to rotation -80 to 80 degrees
        return ((value - 15) / (40 - 15)) * 160 - 80;
    };
    const rotation = getRotation(bmi);

    return (
        <div className="relative w-64 h-32 mx-auto">
            <svg viewBox="0 0 100 50" className="w-full h-full">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" strokeWidth="10" className="stroke-blue-500" />
                <path d="M 10 50 A 40 40 0 0 1 43 12" fill="none" strokeWidth="10" className="stroke-green-500" />
                <path d="M 43 12 A 40 40 0 0 1 73 18" fill="none" strokeWidth="10" className="stroke-yellow-500" />
                <path d="M 73 18 A 40 40 0 0 1 90 50" fill="none" strokeWidth="10" className="stroke-red-500" />
            </svg>
            <div
                className="absolute bottom-0 left-1/2 w-0.5 h-1/2 bg-brand-text-primary transition-transform duration-1000 ease-out origin-bottom"
                style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
            ></div>
            <div className="absolute bottom-[-10px] left-1/2 w-4 h-4 bg-brand-bg border-2 border-brand-text-primary rounded-full -translate-x-1/2"></div>
        </div>
    );
};


const BmiCalculator: React.FC = () => {
    const [height, setHeight] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
    
    const [result, setResult] = useState<BmiResult | null>(null);
    const [aiSummary, setAiSummary] = useState<string>('');
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState('');

    const calculateBmi = async () => {
        const h = parseFloat(height);
        const w = parseFloat(weight);

        if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
            setError('Please enter valid, positive numbers for height and weight.');
            setResult(null);
            return;
        }
        
        setError('');
        setIsCalculating(true);
        setResult(null);
        setAiSummary('');

        let bmiValue;
        let heightInMeters;

        if (unitSystem === 'metric') {
            heightInMeters = h / 100;
            bmiValue = w / (heightInMeters * heightInMeters);
        } else {
            heightInMeters = h * 0.0254;
            bmiValue = (w / (h * h)) * 703;
        }
        
        let category: BmiResult['category'];
        if (bmiValue < 18.5) category = 'Underweight';
        else if (bmiValue < 25) category = 'Normal weight';
        else if (bmiValue < 30) category = 'Overweight';
        else category = 'Obesity';

        // Calculate ideal weight range
        const lowerBmi = 18.5;
        const upperBmi = 24.9;
        let lowerWeight = lowerBmi * (heightInMeters * heightInMeters);
        let upperWeight = upperBmi * (heightInMeters * heightInMeters);
        
        let idealWeight;
        if (unitSystem === 'imperial') {
            lowerWeight *= 2.20462; // kg to lbs
            upperWeight *= 2.20462;
            idealWeight = `${lowerWeight.toFixed(1)} - ${upperWeight.toFixed(1)} lbs`;
        } else {
             idealWeight = `${lowerWeight.toFixed(1)} - ${upperWeight.toFixed(1)} kg`;
        }

        setResult({
            bmi: parseFloat(bmiValue.toFixed(1)),
            category,
            idealWeight,
        });

        // AI Summary Generation
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as a helpful health and wellness guide. Based on a BMI of ${bmiValue.toFixed(1)} which falls into the '${category}' category, provide a brief (2-3 sentences), encouraging, and general summary. Do NOT give medical advice. Focus on positive lifestyle suggestions like balanced diet and regular physical activity.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setAiSummary(response.text);

        } catch (e: any) {
            console.error("AI summary failed:", e);
            // Fail silently, the main calculator result is still useful.
        } finally {
            setIsCalculating(false);
        }
    };
    
    const handleUnitChange = (system: 'metric' | 'imperial') => {
        setUnitSystem(system);
        setHeight('');
        setWeight('');
        setResult(null);
        setError('');
    }

    return (
        <ToolPageLayout
            title="Advanced BMI Calculator"
            description="Get a detailed analysis of your Body Mass Index with AI-powered insights."
        >
            <div className="max-w-xl mx-auto space-y-6">
                <div className="bg-brand-bg p-6 rounded-lg space-y-4">
                    <div className="flex justify-center gap-4">
                        <button onClick={() => handleUnitChange('metric')} className={`px-4 py-2 rounded-md ${unitSystem === 'metric' ? 'bg-brand-primary' : 'bg-brand-border'}`}>Metric</button>
                        <button onClick={() => handleUnitChange('imperial')} className={`px-4 py-2 rounded-md ${unitSystem === 'imperial' ? 'bg-brand-primary' : 'bg-brand-border'}`}>Imperial</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Height ({unitSystem === 'metric' ? 'cm' : 'in'})</label>
                            <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})</label>
                            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md" />
                        </div>
                    </div>
                     {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </div>
                
                <button onClick={calculateBmi} disabled={isCalculating} className="w-full bg-brand-primary text-white py-3 rounded-md hover:bg-brand-primary-hover font-semibold text-lg disabled:bg-gray-500">
                    {isCalculating ? 'Calculating...' : 'Calculate BMI'}
                </button>

                {isCalculating && !result && (
                     <div className="flex justify-center items-center h-40">
                         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
                    </div>
                )}
                
                {result && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="bg-brand-bg p-6 rounded-lg text-center">
                            <h3 className="text-lg text-brand-text-secondary">Your BMI Result</h3>
                            <p className="text-6xl font-bold text-brand-primary my-2">{result.bmi}</p>
                            <p className="font-semibold text-xl">{result.category}</p>
                            <BmiGauge bmi={result.bmi} />
                            <div className="flex justify-between text-xs text-brand-text-secondary px-2 mt-1">
                                <span>Underweight</span>
                                <span>Normal</span>
                                <span>Overweight</span>
                                <span>Obese</span>
                            </div>
                        </div>
                        
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div className="bg-brand-bg p-6 rounded-lg text-center">
                                 <h3 className="font-semibold text-brand-primary mb-2">Ideal Weight Range</h3>
                                 <p className="text-2xl font-bold">{result.idealWeight}</p>
                                 <p className="text-xs text-brand-text-secondary mt-1">Based on a healthy BMI of 18.5 - 24.9 for your height.</p>
                             </div>
                              <div className="bg-brand-bg p-6 rounded-lg">
                                 <h3 className="font-semibold text-brand-primary mb-2 text-center">AI Health Summary</h3>
                                 {aiSummary ? (
                                    <p className="text-sm text-brand-text-secondary text-center">{aiSummary}</p>
                                 ) : (
                                    <AiLoadingSpinner />
                                 )}
                             </div>
                         </div>

                        <div className="text-xs text-brand-text-secondary text-center bg-brand-bg p-3 rounded-lg">
                            <strong>Disclaimer:</strong> The BMI calculator and AI summary are for informational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for any health concerns.
                        </div>
                    </div>
                )}
            </div>
        </ToolPageLayout>
    );
};

export default BmiCalculator;
