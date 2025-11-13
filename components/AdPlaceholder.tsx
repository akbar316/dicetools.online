
import React from 'react';

// FIX: The component now accepts any props that a div can accept (including 'style'), fixing the type error.
const AdPlaceholder: React.FC<React.ComponentProps<'div'>> = ({className, ...props}) => {
  return (
    <div {...props} className={`bg-brand-surface border-2 border-dashed border-brand-border rounded-lg flex items-center justify-center min-h-[80px] text-brand-text-secondary ${className || ''}`}>
      Ad Placeholder
    </div>
  );
};

export default AdPlaceholder;