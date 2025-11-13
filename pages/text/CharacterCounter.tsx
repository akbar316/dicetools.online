import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const X_LIMIT = 280;
const SMS_LIMIT = 160;

const SocialPreview: React.FC<{ platform: 'X' | 'SMS', text: string }> = ({ platform, text }) => {
    const limit = platform === 'X' ? X_LIMIT : SMS_LIMIT;
    const isOverLimit = text.length > limit;
    const remaining = limit - text.length;

    return (
        <div className="bg-brand-bg border border-brand-border p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-brand-text-primary">{platform} Preview</h4>
                <p className={`text-sm font-semibold ${isOverLimit ? 'text-red-500' : 'text-brand-text-secondary'}`}>
                    {text.length} / {limit}
                </p>
            </div>
            <div className="bg-brand-surface p-3 rounded-md min-h-[6rem] text-sm whitespace-pre-wrap">
                {isOverLimit ? (
                    <>
                        {text.substring(0, limit)}
                        <span className="bg-red-500/30">{text.substring(limit)}</span>
                    </>
                ) : (
                    text
                )}
            </div>
        </div>
    );
};


const CharacterCounter: React.FC = () => {
  const [text, setText] = useState('');

  const charCount = text.length;
  const charCountNoSpaces = text.replace(/\s/g, '').length;
  
  const longDescription = (
    <>
      <p>
        Master the art of concise communication with our advanced Character Counter. This tool is essential for social media managers, marketers, students, and anyone who needs to write within strict character limits. As you type or paste your text, the tool provides an instant, real-time count of characters both with and without spaces, ensuring you have the precise metrics you need. But it goes beyond simple counting by offering a live preview of your content as it would appear on popular platforms like X (formerly Twitter) and in a standard SMS message, helping you visualize your message before you post.
      </p>
      <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Why Use Our Character Counter?</h3>
      <p>
        In a world of character limits, every letter counts. Our tool helps you craft the perfect message by providing immediate feedback on your text's length.
      </p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Live Social Media Previews:</strong> See exactly how your message will look on X and as an SMS, with visual cues indicating when you've exceeded the character limit.</li>
        <li><strong>Dual Counting:</strong> Get accurate counts for characters with and without spaces, giving you a complete understanding of your text's length.</li>
        <li><strong>Real-Time Feedback:</strong> The counters update instantly as you type, allowing for quick and easy editing to fit any platform's constraints.</li>
        <li><strong>Boost Engagement:</strong> By crafting perfectly sized posts, you ensure your full message is seen, leading to better engagement and clearer communication.</li>
      </ul>
    </>
  );

  return (
    <ToolPageLayout
      title="Character Counter"
      description="Count characters and preview your text for social media."
      longDescription={longDescription}
    >
      <div className="space-y-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here..."
          className="w-full h-48 p-4 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
          <div className="bg-brand-bg p-4 rounded-md">
            <div className="text-3xl font-bold text-brand-primary">{charCount}</div>
            <div className="text-sm text-brand-text-secondary">Characters (with spaces)</div>
          </div>
          <div className="bg-brand-bg p-4 rounded-md">
            <div className="text-3xl font-bold text-brand-primary">{charCountNoSpaces}</div>
            <div className="text-sm text-brand-text-secondary">Characters (no spaces)</div>
          </div>
        </div>
        
        <div className="border-t border-brand-border pt-6">
            <h3 className="text-2xl font-bold text-brand-primary mb-4 text-center">Social Media Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SocialPreview platform="X" text={text} />
                <SocialPreview platform="SMS" text={text} />
            </div>
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default CharacterCounter;