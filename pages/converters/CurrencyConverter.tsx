import React, { useState, useEffect } from 'react';
import { ToolPageLayout, CopyButton } from '../../components/ToolPageLayout';
import { GoogleGenAI, Type } from '@google/genai';

const topCurrencies = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'];
type Currency = typeof topCurrencies[number];

const AiLoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        <span>Fetching...</span>
    </div>
);

const CurrencyConverter: React.FC = () => {
    const [amount, setAmount] = useState<string>('100');
    const [fromCurrency, setFromCurrency] = useState<Currency>('USD');
    const [rates, setRates] = useState<Record<string, number> | null>(null);
    const [loadingRates, setLoadingRates] = useState(false);
    const [error, setError] = useState('');
    
    // Historical rates state
    const [histFrom, setHistFrom] = useState<Currency>('USD');
    const [histTo, setHistTo] = useState<Currency>('EUR');
    const [histDate, setHistDate] = useState(new Date().toISOString().split('T')[0]);
    const [histResult, setHistResult] = useState('');
    const [loadingHist, setLoadingHist] = useState(false);

    const fetchRates = async () => {
        setLoadingRates(true);
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const toCurrencies = topCurrencies.filter(c => c !== fromCurrency).join(', ');

            const prompt = `Using Google Search for the latest data, what are the current exchange rates for 1 ${fromCurrency} to the following currencies: ${toCurrencies}? Provide the response as a single JSON object where keys are the currency codes and values are the numerical exchange rates. Do not include any text before or after the JSON object.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: { tools: [{ googleSearch: {} }] },
            });
            
            const jsonString = response.text.match(/\{[\s\S]*\}/)?.[0];
            if (!jsonString) throw new Error("AI did not return a valid JSON object.");

            const parsedRates = JSON.parse(jsonString);
            parsedRates[fromCurrency] = 1; // Add the base currency
            setRates(parsedRates);
            
        } catch (e: any) {
            setError(`Failed to fetch rates: ${e.message}`);
            setRates(null);
        } finally {
            setLoadingRates(false);
        }
    };
    
    useEffect(() => {
        fetchRates();
    }, [fromCurrency]);

    const fetchHistoricalRate = async () => {
        setLoadingHist(true);
        setHistResult('');
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Using Google Search, what was the exchange rate for 1 ${histFrom} to ${histTo} on the date ${histDate}? Respond with only the numerical rate, or "N/A" if data is not available.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { tools: [{ googleSearch: {} }] },
            });
            
            const rate = response.text.trim();
            if (rate.toLowerCase() === 'n/a' || isNaN(parseFloat(rate))) {
                setHistResult(`No data available for that date.`);
            } else {
                 setHistResult(`1 ${histFrom} = ${parseFloat(rate).toFixed(4)} ${histTo}`);
            }
        } catch (e: any) {
             setError(`Historical lookup failed: ${e.message}`);
        } finally {
            setLoadingHist(false);
        }
    };
    
    const currencyOptions = topCurrencies.map(c => <option key={c} value={c}>{c}</option>);
    const numAmount = parseFloat(amount);
    
    const longDescription = (
      <>
        <p>
          Navigate the global financial landscape with our AI-Powered Currency Converter. This advanced tool leverages the power of Google Search to provide near-real-time exchange rates, offering a more dynamic and up-to-date alternative to converters that rely on static or periodically updated APIs. Whether you're a traveler, an online shopper, or a finance professional, you can quickly convert amounts between the world's top currencies. The intuitive interface allows you to set a base amount and currency, and instantly see the converted values across a range of other major currencies, making comparisons simple and fast.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Go Beyond the Present with Historical Data</h3>
        <p>
          Our tool's unique advantage is its ability to look back in time. The Historical Rate Checker, also powered by AI and Google Search, allows you to find the exchange rate between two currencies on any specific date. This is an invaluable feature for financial analysis, invoice verification, or simply satisfying your curiosity about past market conditions. Just select the currencies, pick a date, and let the AI find the historical data for you.
        </p>
      </>
    );

    return (
        <ToolPageLayout
            title="AI-Powered Currency Converter"
            description="Get near-real-time exchange rates and historical data using AI."
            longDescription={longDescription}
        >
            <div className="space-y-8">
                {/* Real-time Converter */}
                <div className="bg-brand-bg p-6 rounded-lg">
                    <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full sm:w-1/3 p-2 bg-brand-surface border border-brand-border rounded-md text-lg"/>
                        <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value as Currency)} className="w-full sm:w-1/3 p-2 bg-brand-surface border border-brand-border rounded-md text-lg">
                            {currencyOptions}
                        </select>
                        <button onClick={fetchRates} disabled={loadingRates} className="w-full sm:w-1/3 bg-brand-primary py-2 rounded-md font-semibold disabled:bg-gray-500">
                            {loadingRates ? <AiLoadingSpinner /> : 'Refresh Rates'}
                        </button>
                    </div>
                    
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rates && !isNaN(numAmount) ? topCurrencies.map(c => {
                            const convertedAmount = numAmount * (rates[c] || 0);
                            return (
                                <div key={c} className="bg-brand-surface p-3 rounded-md">
                                    <p className="text-sm text-brand-text-secondary">{c}</p>
                                    <p className="text-2xl font-bold">{convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                            );
                        }) : !error && (
                             <div className="sm:col-span-2 lg:col-span-3 text-center text-brand-text-secondary">
                                {loadingRates ? 'Fetching latest rates...' : 'Enter an amount to see conversions.'}
                             </div>
                        )}
                    </div>
                </div>

                {/* Historical Rate Checker */}
                <div className="bg-brand-bg p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Historical Rate Checker</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                        <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                             <div><label className="text-xs">From</label><select value={histFrom} onChange={e => setHistFrom(e.target.value as Currency)} className="w-full p-2 bg-brand-surface rounded">{currencyOptions}</select></div>
                             <div><label className="text-xs">To</label><select value={histTo} onChange={e => setHistTo(e.target.value as Currency)} className="w-full p-2 bg-brand-surface rounded">{currencyOptions}</select></div>
                        </div>
                        <div>
                             <label className="text-xs">Date</label>
                             <input type="date" value={histDate} onChange={e => setHistDate(e.target.value)} className="w-full p-2 bg-brand-surface rounded text-brand-text-secondary"/>
                        </div>
                        <button onClick={fetchHistoricalRate} disabled={loadingHist} className="bg-brand-primary p-2 rounded font-semibold disabled:bg-gray-500">
                             {loadingHist ? <AiLoadingSpinner /> : 'Find Rate'}
                        </button>
                    </div>
                    {histResult && <p className="text-center font-semibold text-lg mt-4">{histResult}</p>}
                </div>
                 <p className="text-xs text-center text-brand-text-secondary">Disclaimer: All exchange rates are provided by an AI using Google Search and are for informational purposes only. They should not be used for financial transactions.</p>
            </div>
        </ToolPageLayout>
    );
};

export default CurrencyConverter;