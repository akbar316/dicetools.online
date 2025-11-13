import React, { useState, useCallback } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

// Server proxy URL (configure with Vite env or default to localhost:5000)
const AI_PROXY_URL = import.meta.env.VITE_API_PROXY || 'http://localhost:5000/api/ai';

// Utility function to convert a File object to a base64 string for the API
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to read file as data URL."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
    const data = await base64EncodedDataPromise;
    return {
        inlineData: { data, mimeType: file.type },
    };
};

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
  </div>
);

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A photorealistic image of a majestic lion wearing a crown, on a mountain top at sunset.');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

    // New state for image upload
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];

    const handleImageUpload = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setUploadedImage(file);
            setUploadedImageUrl(URL.createObjectURL(file));
            setGeneratedImageUrl(null);
            setError(null);
        } else {
            setError("Please upload a valid image file (e.g., PNG, JPG).");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
        }
    };
    
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const removeImage = () => {
        setUploadedImage(null);
        if (uploadedImageUrl) {
            URL.revokeObjectURL(uploadedImageUrl);
        }
        setUploadedImageUrl(null);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a description for the image.');
            return;
        }
        setLoading(true);
        setError(null);
        setGeneratedImageUrl(null);

        try {
            if (uploadedImage) {
                // Image + Text -> send inline base64 to server proxy
                const imagePart = await fileToGenerativePart(uploadedImage);

                const resp = await fetch(`${AI_PROXY_URL}/image-edit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, inlineImage: imagePart.inlineData }),
                });

                if (!resp.ok) {
                    const text = await resp.text();
                    throw new Error(text || 'Image edit failed');
                }

                const data = await resp.json();
                const resultImagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
                if (resultImagePart && resultImagePart.inlineData) {
                    const { data: b64, mimeType } = resultImagePart.inlineData;
                    setGeneratedImageUrl(`data:${mimeType};base64,${b64}`);
                } else {
                    throw new Error('Image edit failed: no image returned');
                }
            } else {
                // Text to Image -> ask server proxy to call Imagen
                const resp = await fetch(`${AI_PROXY_URL}/text-to-image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, aspectRatio }),
                });

                if (!resp.ok) {
                    const text = await resp.text();
                    throw new Error(text || 'Image generation failed');
                }

                const data = await resp.json();
                if (data.generatedImages && data.generatedImages.length > 0) {
                    const base64ImageBytes: string = data.generatedImages[0].image.imageBytes;
                    const url = `data:image/jpeg;base64,${base64ImageBytes}`;
                    setGeneratedImageUrl(url);
                } else {
                    throw new Error('Image generation failed: no image returned');
                }
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
          Unleash your creativity with our High-Quality AI Image Generator, a versatile tool that brings your imagination to life. This generator offers two powerful modes to suit your creative needs. For generating brand new, stunningly photorealistic images from scratch, we utilize the state-of-the-art Imagen 4 model. Simply describe your vision in detail, select your desired aspect ratio, and watch as the AI crafts a high-resolution masterpiece. This mode is perfect for creating digital art, marketing materials, or concept visualizations with incredible detail and realism.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">Edit and Transform Existing Images</h3>
        <p>
          Want to modify an existing picture? Our tool also integrates the Gemini Flash Image model for powerful image-to-image editing. Upload your own photo or artwork, then provide a text prompt describing the changes you want to make. Whether you want to add an object, change the background, alter the style, or apply creative effects, the AI can intelligently interpret your request and generate a new version of your image. This flexible workflow opens up endless possibilities for photo editing, creative exploration, and content creation, blending your own imagery with the power of artificial intelligence.
        </p>
      </>
    );

    return (
        <ToolPageLayout
            title="High-Quality AI Image Generator"
            description="Generate high-quality images from text, or upload your own to edit with AI."
            longDescription={longDescription}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Controls Panel */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">{uploadedImage ? '1. Your Image' : '1. Upload an Image (Optional)'}</h3>
                        <div
                            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                            className={`relative border-2 border-dashed rounded-lg p-4 transition-colors min-h-[14rem] flex flex-col justify-center items-center ${isDragging ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border'}`}
                        >
                            {uploadedImageUrl ? (
                                <img src={uploadedImageUrl} alt="Uploaded preview" className="max-h-48 w-auto mx-auto rounded-md" />
                            ) : (
                                <div className="text-center text-brand-text-secondary">
                                    <p>Drag & drop an image here</p>
                                    <p className="my-2">or</p>
                                    <label className="cursor-pointer font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover px-5 py-2 rounded-md transition-colors">
                                        Browse File
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>
                            )}
                        </div>
                         {uploadedImageUrl && <button onClick={removeImage} className="w-full text-center text-red-500 hover:underline mt-2">Remove Image</button>}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{uploadedImage ? '2. Describe Your Edits' : '1. Describe Your Image'}</h3>
                         <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={uploadedImage ? "e.g., add a cat wearing a hat" : "Describe the image you want to create..."}
                            className="w-full h-32 p-4 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary text-lg"
                        />
                    </div>
                    
                    {!uploadedImage && (
                         <div className="space-y-2">
                            <h3 className="text-lg font-semibold">2. Select Aspect Ratio</h3>
                             <select
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                className="w-full p-3 bg-brand-bg border border-brand-border rounded-md"
                            >
                                {aspectRatios.map(s => <option key={s} value={s}>Aspect Ratio ({s})</option>)}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-brand-primary text-white px-6 py-3 rounded-md hover:bg-brand-primary-hover transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed font-semibold text-lg"
                    >
                        {loading ? 'Generating...' : (uploadedImage ? 'Generate Edit' : 'Generate Image')}
                    </button>
                    <p className="text-xs text-brand-text-secondary text-center">
                        {uploadedImage
                          ? "Using the creative editing model (Gemini Flash Image)."
                          : "Using the high-quality generation model (Imagen 4)."
                        }
                    </p>
                </div>

                {/* Output Panel */}
                <div className="bg-brand-bg min-h-[30rem] w-full rounded-lg border-2 border-dashed border-brand-border flex items-center justify-center p-4">
                    {loading && <LoadingSpinner />}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {generatedImageUrl && !loading && !error && (
                        <div className="text-center space-y-4">
                             <img src={generatedImageUrl} alt="Generated AI" className="max-w-full max-h-[25rem] rounded-md shadow-lg" />
                             <a 
                                href={generatedImageUrl} 
                                download={uploadedImage ? 'dicetools-ai-edited-image.png' : 'dicetools-imagen-image.jpg'}
                                className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                             >
                                Download Image
                             </a>
                        </div>
                    )}
                     {!loading && !error && !generatedImageUrl && (
                        <p className="text-brand-text-secondary text-center">Your generated image will appear here.</p>
                     )}
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default ImageGenerator;
