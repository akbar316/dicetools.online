import React, { useState, useCallback } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

type Unit = 'celsius' | 'fahrenheit' | 'kelvin' | 'rankine' | 'réaumur';
const units: Unit[] = ['celsius', 'fahrenheit', 'kelvin', 'rankine', 'réaumur'];

// Conversion functions to and from a base unit (Kelvin)
const toKelvin = (value: number, from: Unit): number => {
  switch (from) {
    case 'celsius': return value + 273.15;
    case 'fahrenheit': return (value - 32) * 5 / 9 + 273.15;
    case 'kelvin': return value;
    case 'rankine': return value * 5 / 9;
    case 'réaumur': return value * 5 / 4 + 273.15;
    default: return NaN;
  }
};

const fromKelvin = (value: number, to: Unit): number => {
  switch (to) {
    case 'celsius': return value - 273.15;
    case 'fahrenheit': return (value - 273.15) * 9 / 5 + 32;
    case 'kelvin': return value;
    case 'rankine': return value * 9 / 5;
    case 'réaumur': return (value - 273.15) * 4 / 5;
    default: return NaN;
  }
};

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

const TemperatureConverter: React.FC = () => {
  const [values, setValues] = useState<Record<Unit, string>>(
    units.reduce((acc, unit) => ({ ...acc, [unit]: '' }), {} as Record<Unit, string>)
  );

  const handleValueChange = useCallback((changedUnit: Unit, newValue: string) => {
    const numValue = parseFloat(newValue);
    if (isNaN(numValue) && newValue !== '' && newValue !== '-') {
      return;
    }
    
    if (newValue === '' || newValue === '-') {
        const emptyValues = units.reduce((acc, unit) => ({ ...acc, [unit]: unit === changedUnit ? newValue : '' }), {} as Record<Unit, string>);
        setValues(emptyValues);
        return;
    }

    const valueInKelvin = toKelvin(numValue, changedUnit);

    const newValues = units.reduce((acc, unit) => {
      const convertedValue = fromKelvin(valueInKelvin, unit);
      const formattedValue = parseFloat(convertedValue.toPrecision(10)).toString();
      return { ...acc, [unit]: formattedValue };
    }, {} as Record<Unit, string>);
    
    newValues[changedUnit] = newValue;
    setValues(newValues);
  }, []);
  
  const longDescription = (
    <>
      <p>
        Effortlessly convert temperatures between multiple scales with our Advanced Temperature Converter. This tool is an indispensable resource for students, scientists, travelers, and home cooks who need to perform accurate temperature conversions on the fly. Its standout feature is the live-updating interface; simply enter a temperature in any of the available scales, and all other fields populate instantly with the correct conversions. This eliminates the need for manual calculations or repetitive selections, providing a fast and seamless user experience. All conversions are processed client-side, ensuring your inputs are private and the tool is exceptionally responsive.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Supported Temperature Scales</h3>
      <p>
        Our converter supports a comprehensive range of both common and historical temperature scales to meet diverse needs.
      </p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Celsius (°C):</strong> The standard metric unit used globally for most scientific and general purposes.</li>
        <li><strong>Fahrenheit (°F):</strong> Primarily used in the United States for weather and everyday temperature measurements.</li>
        <li><strong>Kelvin (K):</strong> The base unit of thermodynamic temperature in the International System of Units (SI).</li>
        <li><strong>Rankine (°R):</strong> A thermodynamic temperature scale used in engineering systems in the United States.</li>
        <li><strong>Réaumur (°Ré):</strong> A historical scale where the freezing and boiling points of water are defined as 0 and 80 degrees.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Advanced Temperature Converter"
      description="Convert between various temperature scales instantly. All fields are updated live."
      longDescription={longDescription}
    >
      <div className="max-w-xl mx-auto space-y-3">
        {units.map(unit => (
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

export default TemperatureConverter;