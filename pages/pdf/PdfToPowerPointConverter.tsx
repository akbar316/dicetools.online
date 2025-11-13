import React, { useState } from 'react';
import PdfToolLayout from './PdfToolPlaceholder';
import { GoogleGenAI, Type } from '@google/genai';

interface Slide {
    slide_number: number;
    title: string;
    content: string[]; // Array of bullet points or paragraphs
    notes?: string;
}

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
};

const PdfToPowerPointConverter: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputSlides, setOutputSlides] = useState<Slide[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const longDescription = (
    <>
      <p>
        Breathe new life into your static PDF presentations with our innovative AI-driven PDF to PowerPoint Converter. This isn't just a conversion tool; it's a content liberation engine. Our advanced AI analyzes the structure of your PDF, intelligently identifying individual slides, titles, bullet points, and speaker notes. It then reconstructs this content into a format that you can easily copy and paste into Microsoft PowerPoint, Google Slides, or any other presentation software. This process saves you from the painstaking task of manually retyping or reformatting your entire presentation.
      </p>
      <p>
        It’s the ideal solution for updating old presentations, collaborating with team members on a PDF draft, or repurposing existing material for a new audience. The tool focuses on extracting the core textual and structural elements, giving you a clean, editable foundation to which you can apply new designs and branding. Experience a smarter, faster way to manage your presentation workflow.
      </p>
    </>
  );

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setOutputSlides(null);
    setError(null);
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const pdfPart = await fileToGenerativePart(files[0]);

        const prompt = "Analyze the provided PDF document, which appears to be a presentation. Infer the structure and break down the content into individual slides. For each slide, identify the main title and summarize the key points as a list of strings. Also, extract any text that seems like speaker notes. Provide the output as a structured JSON array of slide objects.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [pdfPart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        slides: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    slide_number: { type: Type.NUMBER },
                                    title: { type: Type.STRING },
                                    content: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    notes: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });

        const result = JSON.parse(response.text);
        if (result.slides && result.slides.length > 0) {
            setOutputSlides(result.slides);
        } else {
            setError("The AI could not identify a presentation structure in this PDF.");
        }

    } catch (e: any) {
         console.error(e);
         setError(`An AI error occurred: ${e.message || 'Could not process document.'}`);
    } finally {
        setIsProcessing(false);
    }
  };

  const ActionButton = (
    <button
        onClick={handleProcess}
        disabled={files.length === 0 || isProcessing}
        className="w-full bg-brand-primary text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-brand-primary-hover transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
    >
        {isProcessing ? 'Analyzing Structure...' : 'Extract Presentation Content'}
    </button>
  );

  const Output = (
      <div className="w-full h-full flex flex-col items-center justify-center">
          {isProcessing && (
                <div className="text-center text-brand-text-secondary">
                     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto mb-4"></div>
                     <p>AI is structuring your presentation...</p>
                </div>
          )}
          
          {!isProcessing && outputSlides && (
              <div className="w-full space-y-3">
                  <h3 className="font-semibold text-lg text-brand-text-primary text-center">Extracted Content</h3>
                  <p className="text-sm text-brand-text-secondary text-center">Copy and paste this content into your presentation software.</p>
                  <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
                      {outputSlides.map(slide => (
                          <div key={slide.slide_number} className="bg-brand-surface p-3 rounded-md">
                              <p className="font-bold text-brand-primary">Slide {slide.slide_number}: {slide.title}</p>
                              <ul className="list-disc list-inside text-sm mt-1">
                                  {slide.content.map((item, i) => <li key={i}>{item}</li>)}
                              </ul>
                          </div>
                      ))}
                  </div>
              </div>
          )}
          
          {!isProcessing && !outputSlides && (
              <p className="text-brand-text-secondary text-center">
                  {error ? <span className="text-red-500">{error}</span> : "Upload a PDF to extract its content into a PowerPoint-friendly format."}
              </p>
          )}
      </div>
  );
  
  return (
    <PdfToolLayout
      title="PDF to PowerPoint Converter"
      description="Let AI analyze your PDF and structure its content for easy pasting into PowerPoint."
      onFilesSelected={f => { setFiles(f); setOutputSlides(null); setError(null); }}
      selectedFiles={files}
      actionButton={ActionButton}
      output={Output}
      longDescription={longDescription}
    />
  );
};

export default PdfToPowerPointConverter;