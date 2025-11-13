import React, { useState, useCallback } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const units = {
  milligram: 0.000001,
  gram: 0.001,
  kilogram: 1,
  tonne: 1000,
  carat: 0.0002,
  ounce: 0.0283495,
  'troy ounce': 0.0311035,
  pound: 0.453592,
  stone: 6.35029,
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

const WeightConverter: React.FC = () => {
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

    const valueInKilograms = numValue * units[changedUnit];

    const newValues = unitNames.reduce((acc, unit) => {
      const convertedValue = valueInKilograms / units[unit];
      const formattedValue = parseFloat(convertedValue.toPrecision(10)).toString();
      return { ...acc, [unit]: formattedValue };
    }, {} as Record<Unit, string>);

    newValues[changedUnit] = newValue;
    setValues(newValues);
  }, []);
  
  const longDescription = (
    <>
      <p>
        Navigate the complexities of weight and mass conversion with our intuitive and powerful Advanced Weight Converter. This tool is meticulously designed for a wide range of users, including chefs, engineers, scientists, and anyone needing to convert between different weight systems. Featuring a dynamic interface, every field updates in real-time as you type, providing instant, accurate conversions across all listed units simultaneously. There's no need to select "from" and "to" units repeatedly; simply enter your value in the known unit and see the equivalent in all others. This makes comparing multiple units effortless and efficient.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Comprehensive Unit Support</h3>
      <ul className="list-disc list-inside space-y-2">
        <li><strong>Metric System:</strong> Seamlessly convert between milligrams, grams, kilograms, and tonnes.</li>
        <li><strong>Imperial & US Units:</strong> Instantly switch between ounces, pounds, and stones.</li>
        <li><strong>Precious Metals & Gems:</strong> Includes specialized units like carats for gemstones and troy ounces for precious metals, ensuring accuracy for jewelers and investors.</li>
        <li><strong>Live Updates:</strong> The multi-field display updates as you type, offering an unparalleled user experience for quick comparisons and conversions.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Advanced Weight & Mass Converter"
      description="Convert between various units of weight instantly. All fields are updated live."
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

export default WeightConverter;