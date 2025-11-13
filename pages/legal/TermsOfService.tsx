import React from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const TermsOfService: React.FC = () => {
  return (
    <ToolPageLayout
      title="Terms of Service"
      description="Please read these terms and conditions carefully before using Our Service."
    >
      <div className="space-y-4 text-brand-text-secondary">
        <h2 className="text-xl font-semibold text-brand-text-primary pt-4">1. Acceptance of Terms</h2>
        <p>By accessing and using DiceTools (the "Website"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this Website's particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>

        <h2 className="text-xl font-semibold text-brand-text-primary pt-4">2. Use of Our Services</h2>
        <p>The tools and services provided on DiceTools are for your personal and non-commercial use. You agree not to use the service for any illegal or unauthorized purpose. You must not, in the use of the Service, violate any laws in your jurisdiction.</p>

        <h2 className="text-xl font-semibold text-brand-text-primary pt-4">3. User Conduct</h2>
        <p>You agree not to submit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable. We are not responsible for user-submitted content, but we reserve the right to remove it if it violates our policies.</p>
        
        <h2 className="text-xl font-semibold text-brand-text-primary pt-4">4. Disclaimer of Warranties</h2>
        <p>The tools on this Website are provided "as is". DiceTools makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
        
        <h2 className="text-xl font-semibold text-brand-text-primary pt-4">5. Limitation of Liability</h2>
        <p>In no event shall DiceTools or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on DiceTools' website, even if DiceTools or a DiceTools authorized representative has been notified orally or in writing of the possibility of such damage.</p>
        
        <h2 className="text-xl font-semibold text-brand-text-primary pt-4">6. Changes to Terms</h2>
        <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion. It is your responsibility to check these Terms periodically for changes.</p>
      </div>
    </ToolPageLayout>
  );
};

export default TermsOfService;
