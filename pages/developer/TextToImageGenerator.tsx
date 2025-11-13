import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';
import { GoogleGenAI, Modality } from '@google/genai';

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
  </div>
);

const TextToImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A majestic lion wearing a crown, on a mountain top');
    const [style, setStyle] = useState('Photorealistic');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const imageStyles = [
        'Photorealistic', 'Anime', 'Digital Art', 'Cartoon',
        'Fantasy', 'Cyberpunk', 'Steampunk', 'Vintage', 'Minimalist'
    ];

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a description for the image.');
            return;
        }
        setLoading(true);
        setError(null);
        setImageUrl(null);

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

            const fullPrompt = `${prompt}, in a ${style} style.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{ text: fullPrompt }],
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

            if (imagePart && imagePart.inlineData) {
                const base64ImageBytes: string = imagePart.inlineData.data;
                const mimeType = imagePart.inlineData.mimeType;
                const url = `data:${mimeType};base64,${base64ImageBytes}`;
                setImageUrl(url);
            } else {
                throw new Error('Image generation failed. The model did not return an image.');
            }

        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };
    
    const longDescription = (
      <>
        <p>
          Transform your words into captivating visuals with our AI Text to Image Generator. Powered by the creative and efficient NanoBanana (Gemini Flash Image) model, this tool allows anyone to become a digital artist. Simply type a description of the image you envision, select an artistic style, and watch as the AI brings your concept to life in seconds. It’s perfect for generating unique social media content, blog post illustrations, creative inspiration, or just for fun. The intuitive interface makes it easy for both beginners and experienced users to craft detailed prompts and explore a wide range of visual styles.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Explore a Universe of Styles</h3>
        <p>
          Don't just describe what you want to see—define how you want to see it. Our generator includes a curated list of popular artistic styles to give your creations a distinct look and feel.
        </p>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li><strong>Realism and Art:</strong> Choose from Photorealistic for lifelike images or Digital Art for a more illustrative feel.</li>
          <li><strong>Animation & Illustration:</strong> Generate images in classic Cartoon or Japanese Anime styles.</li>
          <li><strong>Genre & Thematic Styles:</strong> Instantly apply aesthetics like Fantasy, Cyberpunk, Steampunk, or Vintage to your creations for a unique thematic flair.</li>
          <li><strong>Minimalist:</strong> Create clean, simple, and impactful visuals with the Minimalist style option.</li>
        </ul>
      </>
    );

    return (
        <ToolPageLayout
            title="AI Text to Image Generator"
            description="Create stunning images from text descriptions using the NanoBanana AI model."
            longDescription={longDescription}
        >
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="space-y-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the image you want to create..."
                        className="w-full h-32 p-4 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary text-lg"
                    />
                    <div className="flex flex-col sm:flex-row gap-4">
                        <select
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            className="w-full sm:w-1/2 p-3 bg-brand-bg border border-brand-border rounded-md"
                        >
                            {imageStyles.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full sm:w-1/2 bg-brand-primary text-white px-6 py-3 rounded-md hover:bg-brand-primary-hover transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed font-semibold text-lg"
                        >
                            {loading ? 'Generating...' : 'Generate Image'}
                        </button>
                    </div>
                </div>

                <div className="bg-brand-bg min-h-[30rem] w-full rounded-lg border-2 border-dashed border-brand-border flex items-center justify-center p-4">
                    {loading && <LoadingSpinner />}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {imageUrl && !loading && !error && (
                        <div className="text-center space-y-4">
                             <img src={imageUrl} alt="Generated AI" className="max-w-full max-h-[25rem] rounded-md shadow-lg" />
                             <a 
                                href={imageUrl} 
                                download="dicetools-ai-image.png"
                                className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                             >
                                Download Image
                             </a>
                        </div>
                    )}
                     {!loading && !error && !imageUrl && (
                        <p className="text-brand-text-secondary text-center">Your generated image will appear here.</p>
                     )}
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default TextToImageGenerator;
