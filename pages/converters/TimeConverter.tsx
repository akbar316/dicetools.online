import React, { useState, useCallback } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const units = {
  nanosecond: 1e-9,
  microsecond: 1e-6,
  millisecond: 0.001,
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
  month: 2628000, // Average
  year: 31536000,
  decade: 315360000,
  century: 3153600000,
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

const TimeConverter: React.FC = () => {
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

    const valueInSeconds = numValue * units[changedUnit];

    const newValues = unitNames.reduce((acc, unit) => {
      const convertedValue = valueInSeconds / units[unit];
      const formattedValue = parseFloat(convertedValue.toPrecision(10)).toString();
      return { ...acc, [unit]: formattedValue };
    }, {} as Record<Unit, string>);

    newValues[changedUnit] = newValue;
    setValues(newValues);
  }, []);
  
  const longDescription = (
    <>
      <p>
        Master the dimension of time with our Advanced Time Converter. This dynamic tool is designed for project managers, scientists, students, and anyone who needs to translate between different units of time. From the fleeting nanosecond to the expansive century, our converter provides a comprehensive solution for all your temporal calculations. The powerful live-update feature means you only need to enter a value once; all other fields populate with the correct conversions instantly. This makes comparing different time scales incredibly fast and intuitive. All calculations are performed directly in your browser, ensuring both speed and the complete privacy of your data.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">A Comprehensive Spectrum of Time</h3>
      <p>
        Our tool covers an extensive range of units to handle any conversion need, from the microscopic to the historic.
      </p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Micro Time:</strong> Convert with precision between nanoseconds, microseconds, and milliseconds for scientific and computational tasks.</li>
        <li><strong>Standard Time:</strong> Easily switch between seconds, minutes, hours, days, and weeks for everyday planning and scheduling.</li>
        <li><strong>Macro Time:</strong> Explore longer durations by converting between months, years, decades, and centuries.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Advanced Time Converter"
      description="Convert between various units of time instantly. All fields are updated live."
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

export default TimeConverter;