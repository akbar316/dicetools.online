import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const ContactUs: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would handle form submission here (e.g., send an email, save to a database).
    // For this demo, we'll just show a success message.
    setSubmitted(true);
  };

  return (
    <ToolPageLayout
      title="Contact Us"
      description="Have a question, suggestion, or feedback? We'd love to hear from you."
    >
      <div className="max-w-xl mx-auto">
        {submitted ? (
          <div className="text-center bg-brand-bg p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-brand-primary mb-2">Thank You!</h3>
            <p className="text-brand-text-secondary">Your message has been received. We'll get back to you as soon as possible.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary mb-1">Your Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-3 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-1">Your Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-brand-text-secondary mb-1">Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className="w-full p-3 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full bg-brand-primary text-white px-6 py-3 rounded-md hover:bg-brand-primary-hover transition-colors font-semibold text-lg"
              >
                Send Message
              </button>
            </div>
             <p className="text-xs text-center text-brand-text-secondary">Note: This is a demonstration form and does not actually send messages.</p>
          </form>
        )}
      </div>
    </ToolPageLayout>
  );
};

export default ContactUs;