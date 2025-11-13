import React, { useState, useCallback } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const units = {
  'meters/sec': 1,
  'km/h': 0.277778,
  'miles/h': 0.44704,
  'feet/sec': 0.3048,
  knots: 0.514444,
  mach: 343,
  'speed of light (c)': 299792458,
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

const SpeedConverter: React.FC = () => {
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

    const valueInMetersPerSec = numValue * units[changedUnit];

    const newValues = unitNames.reduce((acc, unit) => {
      const convertedValue = valueInMetersPerSec / units[unit];
      const formattedValue = parseFloat(convertedValue.toPrecision(10)).toString();
      return { ...acc, [unit]: formattedValue };
    }, {} as Record<Unit, string>);

    newValues[changedUnit] = newValue;
    setValues(newValues);
  }, []);
  
  const longDescription = (
    <>
      <p>
        Accelerate your calculations with our Advanced Speed Converter. This tool is expertly engineered for engineers, pilots, scientists, and anyone needing to perform swift and precise speed conversions. Its defining feature is a dynamic, live-updating interface that converts your input across all supported units simultaneously. Simply enter a value in one field—be it kilometers per hour, miles per hour, or even Mach—and watch as every other field instantly displays the equivalent speed. This eliminates guesswork and manual calculations, providing a comprehensive overview at a glance. All conversions happen securely in your browser for maximum speed and privacy.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">From Everyday to Extraordinary Speeds</h3>
      <p>
        Our converter supports a broad spectrum of velocity units, catering to both common and highly specialized applications.
      </p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Standard Units:</strong> Includes meters per second (m/s), kilometers per hour (km/h), miles per hour (mph), and feet per second (ft/sec).</li>
        <li><strong>Specialized Units:</strong> Convert to and from knots for maritime and aviation purposes, or Mach for supersonic and hypersonic speeds.</li>
        <li><strong>Scientific Reference:</strong> For physicists and enthusiasts, the tool includes the speed of light (c) as a conversion unit, putting cosmic speeds at your fingertips.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Advanced Speed Converter"
      description="Convert between various units of speed instantly. All fields are updated live."
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

export default SpeedConverter;