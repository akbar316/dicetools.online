import React from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

const VideoGenerator: React.FC = () => {
    return (
        <ToolPageLayout
            title="AI Video Generator"
            description="Create high-quality videos from text prompts or images."
        >
            <div className="text-center bg-brand-bg p-8 rounded-lg">
                <h2 className="text-2xl font-bold text-brand-primary mb-4">Tool Unavailable</h2>
                <p className="text-brand-text-secondary">
                    This tool is currently unavailable in this environment due to specific API requirements.
                </p>
            </div>
        </ToolPageLayout>
    );
};

export default VideoGenerator;