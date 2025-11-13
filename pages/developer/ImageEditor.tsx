import React, { useState, useCallback } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';
import { GoogleGenAI, Modality } from '@google/genai';

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

const ActionButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, disabled?: boolean }> = ({ icon, label, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="flex flex-col items-center justify-center gap-2 bg-brand-surface p-3 rounded-lg hover:bg-brand-border hover:text-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center"
    >
        {icon}
        <span className="text-xs font-semibold">{label}</span>
    </button>
);

const PromptButton: React.FC<{ label: string, onClick: () => void, disabled?: boolean }> = ({ label, onClick, disabled }) => (
     <button
        onClick={onClick}
        disabled={disabled}
        className="text-left text-sm bg-brand-surface p-2 rounded-md hover:bg-brand-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
    >
        {label}
    </button>
);


const ImageEditor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Prompt State
    const [customPrompt, setCustomPrompt] = useState('make it black and white');
    const [replaceTarget, setReplaceTarget] = useState('');
    const [replaceWith, setReplaceWith] = useState('');

    const handleImageUpload = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setOriginalImage(file);
            setOriginalImageUrl(URL.createObjectURL(file));
            setEditedImageUrl(null);
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

    const handleGenerate = async (prompt: string) => {
        if (!originalImage) {
            setError('Please upload an image first.');
            return;
        }
        if (!prompt.trim()) {
            setError('Please provide an editing instruction.');
            return;
        }

        setLoading(true);
        setError(null);
        setEditedImageUrl(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const imagePart = await fileToGenerativePart(originalImage);
            const textPart = { text: prompt };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            const resultImagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

            if (resultImagePart && resultImagePart.inlineData) {
                const { data, mimeType } = resultImagePart.inlineData;
                const url = `data:${mimeType};base64,${data}`;
                setEditedImageUrl(url);
            } else {
                throw new Error('Image editing failed. The model did not return a new image.');
            }
        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };
    
    const quickActions = {
        removeBg: "Professionally remove the background from this image. Make the background transparent. Preserve the main subject with clean edges.",
        enhance: "Analyze this image and significantly enhance its quality. Sharpen the details, improve the resolution as if upscaling it, and correct any noise or artifacts. Make it look like a high-resolution photograph.",
        lighting: "Re-light this image with dramatic, cinematic lighting. Add deep shadows and bright highlights to create a moody and professional look.",
        sketch: "Convert this image into a highly detailed, realistic black and white pencil sketch on white paper. Capture the textures and shading accurately.",
        cartoonify: "Convert this image into a vibrant, colorful cartoon style with bold outlines."
    };
    
    const promptLibrary = {
        "Change background to a sunny beach": "Realistically change the background of this image to a sunny beach with palm trees and an ocean.",
        "Add sunglasses to the person": "Add a pair of stylish, dark sunglasses to the main person in the image.",
        "Make the sky a sunset": "Change the sky in this image to a beautiful, dramatic sunset with orange and purple clouds.",
        "Convert to a watercolor painting": "Transform this image into a beautiful watercolor painting with soft edges and blended colors."
    };
    
    const handleReplace = () => {
        if (replaceTarget && replaceWith) {
            handleGenerate(`In the image, replace the ${replaceTarget} with a ${replaceWith}.`);
        }
    };
    
    const longDescription = (
      <>
        <p>
          Revolutionize the way you edit photos with our AI Image Editing Studio. This powerful tool puts the capabilities of a professional photo editor into a simple, text-based interface. Forget complex sliders and tools; simply upload your image and describe the changes you want to make in plain English. Powered by the Gemini Flash Image model, the AI intelligently interprets your commands to perform a wide range of edits, from simple color adjustments to complex object manipulation. The studio is designed to be intuitive and fast, providing a streamlined workflow for both quick fixes and creative transformations.
        </p>
        <h3 className="text-xl font-bold text-brand-text-primary mt-4 mb-2">A Complete Creative Suite</h3>
        <p>
          Our editor is equipped with multiple features to help you achieve your desired result quickly and easily, whether you're a beginner or a pro.
        </p>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li><strong>Quick Actions:</strong> Perform common, complex tasks like background removal, quality enhancement, and style conversion with a single click.</li>
          <li><strong>Prompt Library:</strong> Get inspired with a collection of pre-made prompts for creative effects like changing the background or adding objects.</li>
          <li><strong>Replace Tool:</strong> Intuitively replace an object in your photo by simply describing what to replace and what to replace it with.</li>
          <li><strong>Custom Prompts:</strong> For ultimate control, use the custom prompt box to describe any edit you can imagine, from "make the sky purple" to "add a futuristic city in the background."</li>
        </ul>
      </>
    );

    return (
        <ToolPageLayout
            title="AI Image Editing Studio"
            description="Use one-click Quick Actions or our AI Prompting Studio for powerful edits."
            longDescription={longDescription}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Control Panel */}
                <div className="space-y-6">
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors min-h-[16rem] flex flex-col justify-center items-center ${isDragging ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border'}`}
                    >
                        {originalImageUrl ? (
                             <img src={originalImageUrl} alt="Original upload" className="max-h-56 w-auto mx-auto rounded-md" />
                        ) : (
                            <div className="text-center text-brand-text-secondary">
                                <p>Drag & drop an image here</p>
                                <p className="my-2">or</p>
                                <label className="cursor-pointer font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover px-5 py-2 rounded-md transition-colors">
                                    Browse Files
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                        )}
                    </div>
                     {originalImageUrl && (
                        <label className="block text-center cursor-pointer font-semibold text-brand-primary hover:text-brand-primary-hover py-1">
                            Change Image
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                    )}

                    <div className="bg-brand-bg p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3 text-brand-primary">Quick Actions</h3>
                        <div className="grid grid-cols-5 gap-3">
                             <ActionButton label="Remove BG" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0 2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>} onClick={() => handleGenerate(quickActions.removeBg)} disabled={!originalImage || loading} />
                             <ActionButton label="Enhance" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>} onClick={() => handleGenerate(quickActions.enhance)} disabled={!originalImage || loading} />
                             <ActionButton label="Lighting" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>} onClick={() => handleGenerate(quickActions.lighting)} disabled={!originalImage || loading} />
                             <ActionButton label="Sketch" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>} onClick={() => handleGenerate(quickActions.sketch)} disabled={!originalImage || loading} />
                             <ActionButton label="Cartoonify" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 20v-6m0-4V4m8 16v-2m0-4V4m-4 16v-4m0-4V4M4 20v-4m0-4V4"/></svg>} onClick={() => handleGenerate(quickActions.cartoonify)} disabled={!originalImage || loading} />
                        </div>
                    </div>

                     <div className="bg-brand-bg p-4 rounded-lg space-y-4">
                        <h3 className="font-semibold text-lg text-brand-primary">AI Prompting Studio</h3>
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Prompt Library</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(promptLibrary).map(([label, prompt]) => (
                                    <PromptButton key={label} label={label} onClick={() => handleGenerate(prompt)} disabled={!originalImage || loading} />
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Replace Tool</h4>
                            <div className="flex gap-2 items-center">
                                <span className="text-sm">Replace</span>
                                <input type="text" value={replaceTarget} onChange={e => setReplaceTarget(e.target.value)} placeholder="e.g., the blue car" className="flex-grow p-1 text-sm bg-brand-surface rounded-md border border-brand-border" disabled={!originalImage || loading} />
                                <span className="text-sm">with a</span>
                                <input type="text" value={replaceWith} onChange={e => setReplaceWith(e.target.value)} placeholder="e.g., red bicycle" className="flex-grow p-1 text-sm bg-brand-surface rounded-md border border-brand-border" disabled={!originalImage || loading} />
                                <button onClick={handleReplace} disabled={!originalImage || loading || !replaceTarget || !replaceWith} className="bg-brand-primary p-1 rounded-md text-white disabled:opacity-50">Go</button>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Custom Prompt</h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="Or describe your own edits..."
                                    className="w-full p-2 bg-brand-surface border border-brand-border rounded-md text-sm"
                                    disabled={!originalImage || loading}
                                />
                                <button
                                    onClick={() => handleGenerate(customPrompt)}
                                    disabled={loading || !originalImage || !customPrompt}
                                    className="bg-brand-primary text-white px-4 rounded-md hover:bg-brand-primary-hover transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed font-semibold"
                                >
                                    Generate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Output Panel */}
                 <div className="bg-brand-bg min-h-[30rem] w-full rounded-lg border-2 border-dashed border-brand-border flex items-center justify-center p-4">
                    {loading && <LoadingSpinner />}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {editedImageUrl && !loading && !error && (
                         <div className="w-full">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <h4 className="font-semibold mb-2">Original</h4>
                                    <img src={originalImageUrl!} alt="Original upload" className="w-full rounded-md shadow-lg" />
                                </div>
                                <div className="text-center">
                                    <h4 className="font-semibold mb-2">Edited</h4>
                                    <img src={editedImageUrl} alt="Edited result" className="w-full rounded-md shadow-lg" />
                                </div>
                            </div>
                             <a 
                                href={editedImageUrl} 
                                download="dicetools-ai-edited-image.png"
                                className="block text-center mt-6 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors w-full max-w-xs mx-auto"
                             >
                                Download Edited Image
                             </a>
                        </div>
                    )}
                     {!loading && !error && !editedImageUrl && (
                        <p className="text-brand-text-secondary text-center">Your edited image will appear here.</p>
                     )}
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default ImageEditor;