import React, { useState, useCallback, ChangeEvent } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const units = {
  nanometer: 1e-9,
  micrometer: 1e-6,
  millimeter: 0.001,
  centimeter: 0.01,
  meter: 1,
  kilometer: 1000,
  inch: 0.0254,
  foot: 0.3048,
  yard: 0.9144,
  mile: 1609.34,
  'nautical mile': 1852,
};
type Unit = keyof typeof units;

const unitNames = Object.keys(units) as Unit[];

const ConversionInput: React.FC<{
  unit: Unit;
  value: string;
  onValueChange: (unit: Unit, value: string) => void;
}> = ({ unit, value, onValueChange }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={unit} className="w-32 text-right text-brand-text-secondary capitalize">{unit}</label>
      <input
        id={unit}
        type="number"
        value={value}
        onChange={(e) => onValueChange(unit, e.target.value)}
        className="flex-grow p-2 bg-brand-bg border border-brand-border rounded-md"
      />
      <button onClick={handleCopy} className="w-20 bg-brand-surface text-sm p-2 rounded-md hover:bg-brand-border">
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
};

const LengthConverter: React.FC = () => {
  const [values, setValues] = useState<Record<Unit, string>>(
    unitNames.reduce((acc, unit) => ({ ...acc, [unit]: '' }), {} as Record<Unit, string>)
  );

  const handleValueChange = useCallback((changedUnit: Unit, newValue: string) => {
    const numValue = parseFloat(newValue);
    if (isNaN(numValue) && newValue !== '' && newValue !== '-') {
      return;
    }

    if (newValue === '' || newValue === '-') {
        const emptyValues = unitNames.reduce((acc, unit) => ({ ...acc, [unit]: unit === changedUnit ? newValue : '' }), {} as Record<Unit, string>);
        setValues(emptyValues);
        return;
    }

    const valueInMeters = numValue * units[changedUnit];

    const newValues = unitNames.reduce((acc, unit) => {
      const convertedValue = valueInMeters / units[unit];
      // Format to a reasonable number of decimal places without trailing zeros
      const formattedValue = parseFloat(convertedValue.toPrecision(10)).toString();
      return { ...acc, [unit]: formattedValue };
    }, {} as Record<Unit, string>);
    
    // Ensure the input field shows exactly what the user typed
    newValues[changedUnit] = newValue;

    setValues(newValues);
  }, []);
  
  const longDescription = (
    <>
      <p>
        Experience seamless and instantaneous length conversions with our Advanced Length Converter. This powerful tool is designed for professionals, students, and anyone who needs to switch between different units of measurement quickly and accurately. Whether you're a scientist working with nanometers, a contractor measuring in feet and inches, or a traveler calculating distances in miles and kilometers, this converter has you covered. Its intuitive interface updates all fields in real time as you type, providing immediate results across a comprehensive range of units without needing to click a "convert" button.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Key Features</h3>
      <ul className="list-disc list-inside space-y-2">
        <li><strong>Live Conversions:</strong> Enter a value in any field, and all other units update instantly, saving you time and effort.</li>
        <li><strong>Wide Range of Units:</strong> Convert between metric and imperial systems, from microscopic nanometers and micrometers to vast distances like miles and nautical miles.</li>
        <li><strong>High Precision:</strong> Our calculations are performed with high precision to ensure you get the most accurate results for both scientific and everyday use.</li>
        <li><strong>One-Click Copy:</strong> Each conversion result has its own copy button, making it easy to grab the specific value you need for your work.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Advanced Length Converter"
      description="Convert between various units of length instantly. All fields are updated live."
      longDescription={longDescription}
    >
      <div className="max-w-xl mx-auto space-y-3">
        {unitNames.map(unit => (
          <ConversionInput
            key={unit}
            unit={unit}
            value={values[unit]}
            onValueChange={handleValueChange}
          />
        ))}
      </div>
    </ToolPageLayout>
  );
};

export default LengthConverter;