import React from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const PrivacyPolicy: React.FC = () => {
  return (
    <ToolPageLayout
      title="Privacy Policy"
      description="Last updated: July 29, 2024"
    >
      <div className="space-y-4 text-brand-text-secondary">
        <p>Your privacy is important to us. It is DiceTools' policy to respect your privacy regarding any information we may collect from you across our website.</p>

        <h2 className="text-xl font-semibold text-brand-text-primary pt-4">1. Information We Collect</h2>
        <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
        <p>For tools that require input, the data you provide is processed in your browser or sent to an API for processing. We do not store your input data on our servers unless explicitly stated for a specific tool (e.g., a "Notes" tool that saves to local storage).</p>

        <h2 className="text-xl font-semibold text-brand-text-primary pt-4">2. How We Use Your Information</h2>
        <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>

        <h2 className="text-xl font-semibold text-brand-text-primary pt-4">3. Cookies</h2>
        <p>We may use cookies to store information about your preferences and to personalize the content you see. You can choose to disable cookies through your browser settings, but this may affect your ability to use some of our website's features.</p>

        <h2 className="text-xl font-semibold text-brand-text-primary pt-4">4. Links to Other Sites</h2>
        <p>Our website may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.</p>

        <h2 className="text-xl font-semibold text-brand-text-primary pt-4">5. Changes to This Privacy Policy</h2>
        <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>

      </div>
    </ToolPageLayout>
  );
};

export default PrivacyPolicy;
