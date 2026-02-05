
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export type ColoringStyle = 
  | 'standard' | 'bold' | 'detailed' | 'cute' | 'vintage' | 'sketchy' | 'comic' 
  | 'popart' | 'zentangle' | 'stencil' | 'minimalist' | 'blueprint'
  | 'bold_geometric' | 'bold_sticker' | 'detailed_micro' | 'detailed_textured';

export type ImageResolution = '1K' | '2K' | '4K';
export type OutputFormat = 'raster' | 'vector';

const STYLE_PROMPTS: Record<ColoringStyle, string> = {
  standard: "Transform this image into a clean, professional high-contrast black and white coloring book page. Use perfectly uniform solid black lines for outlines. Ensure the background is pure 100% white (#FFFFFF) with absolutely no shading, gradients, noise, or textures.",
  bold: "Transform this image into a bold sticker-style coloring page. Use ultra-thick, solid black outlines and extremely simplified shapes. Remove all small details and noise. Optimized for broad markers and children's coloring.",
  bold_geometric: "Transform this image into a bold, geometric vector-style coloring page. Use thick, razor-sharp clean black lines with mathematically precise shapes and smooth Bezier-like curves.",
  bold_sticker: "Transform this image into a thick-bordered sticker style coloring page. Extremely heavy outer silhouettes and simplified internal details. Ideal for high-contrast visibility.",
  detailed: "Transform this image into an intricate, highly detailed fine-line coloring page. Capture complex textures and delicate patterns using only ultra-thin, precise black lines. Suitable for professional adult coloring books.",
  detailed_micro: "Transform this image into an ultra-fine detail master coloring page. Use the thinnest possible mathematically perfect black lines to capture every minute structural detail. Maximum fidelity reconstruction.",
  detailed_textured: "Transform this image into a high-fidelity line art page with simulated line-textures. Use varied line weights and technical hatching to represent different materials while remaining a pure black and white line-art illustration.",
  cute: "Transform this image into a cute, bubbly Kawaii cartoon coloring page. Exaggerate features to be rounder and more playful. Use clean, friendly black outlines and a simplified, polished aesthetic.",
  vintage: "Transform this image into a vintage woodcut-style coloring page. Use organic, slightly tapered black lines that mimic 19th-century engravings or classic storybook illustrations. Maintain extreme clarity in the line work.",
  sketchy: "Transform this image into an expressive, professional sketchy pencil-drawing style coloring page. Use overlapping thin black lines and varied pressure-simulated strokes to create a high-end hand-drawn look.",
  comic: "Transform this image into a dramatic professional comic book coloring page. Use bold dynamic outlines and sharp black-fills for heavy shadows (chiaroscuro). The result must look like a high-end graphic novel ink-page.",
  popart: "Transform this image into a retro 1960s Pop Art coloring page. Use bold black outlines and incorporate clean Ben-Day dot patterns for stylistic shading. Graphic, iconic, and perfectly sharp.",
  zentangle: "Transform this image into a complex Zentangle-patterned coloring page. Fill large areas with intricate repetitive motifs like swirls and geometric scales. All lines must be pure black and razor-sharp.",
  stencil: "Transform this image into a high-contrast stencil art masterpiece. Use bold, connected solid black shapes and clear negative space gaps. Designed for high-impact visual clarity.",
  minimalist: "Transform this image into an ultra-clean minimalist contour drawing. Use the absolute minimum number of paths to represent the subject with maximum elegance and structural purity.",
  blueprint: "Transform this image into a precise technical blueprint. Use crisp, uniform professional drafting lines. Architectural, clinical, and perfectly organized."
};

/**
 * Converts an image to line art (Raster or Vector).
 */
export const convertToLineArt = async (
  base64Image: string, 
  style: ColoringStyle = 'standard',
  resolution: ImageResolution = '1K',
  format: OutputFormat = 'raster',
  usePro: boolean = false
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const mimeType = base64Image.split(';')[0].split(':')[1];
  const base64Data = base64Image.split(',')[1];

  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.standard;
  
  if (format === 'vector') {
    const strokeWidthHint = resolution === '4K' ? '0.5' : resolution === '2K' ? '1.0' : '2.0';
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: `${stylePrompt} 
            
            VECTOR STUDIO PROTOCOL:
            1. Output: Generate only valid SVG XML.
            2. Precision: Use high-precision coordinates.
            3. Aesthetic: Solid #000000 strokes, NO fills.
            4. Line Fidelity: Use stroke-width="${strokeWidthHint}" for master clarity.
            5. Geometry: Simplify paths into smooth, continuous curves. Remove any digital noise or jagged edges.
            6. Purity: Return ONLY the raw <svg>...</svg> block.` }
          ]
        }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 12000 }
      }
    });

    const svgCode = response.text?.trim() || '';
    const cleanSvg = svgCode.replace(/^```svg\n?/, '').replace(/\n?```$/, '').trim();
    return `data:image/svg+xml;base64,${btoa(cleanSvg)}`;
  }

  const isHighRes = resolution === '2K' || resolution === '4K';
  const modelName = (usePro || isHighRes) ? 'gemini-3-pro-image-preview' : 'gemini-3-flash-preview';

  const qualityInstruction = ` 
    ULTRA-HD RECONSTRUCTION PROTOCOL:
    - Eliminate all aliasing. Lines must be crisp vector-like raster output.
    - Zero gray pixels. Output must be binary black (#000000) and white (#FFFFFF).
    - Enhance subject structural integrity. Repair broken lines from the source image.
    - Professional illustration standards for 300DPI printing.
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: stylePrompt + qualityInstruction + " Treat this as a 4K resolution professional art reconstruction." },
      ],
    },
    config: (modelName === 'gemini-3-pro-image-preview' || modelName === 'gemini-3-flash-preview') ? {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: resolution
      }
    } : undefined
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to generate line art");
};

export const upscaleToStudioMaster = async (base64Artwork: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const mimeType = base64Artwork.split(';')[0].split(':')[1];
  const base64Data = base64Artwork.split(',')[1];

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: "ULTRA-HD 4K STUDIO MASTERING: Reconstruct this artwork at 4096x4096px resolution. Perform complete super-resolution noise removal. Ensure lines are mathematically smooth and pigments are perfectly uniform. The final result must look like a professional gallery-grade physical print." },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "4K"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to master image in 4K");
};

export const editWithAI = async (base64Image: string, prompt: string, usePro: boolean = false): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const mimeType = base64Image.split(';')[0].split(':')[1];
  const base64Data = base64Image.split(',')[1];

  const modelName = usePro ? 'gemini-3-pro-image-preview' : 'gemini-3-flash-preview';

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: `PROFESSIONAL ART EDIT: ${prompt}. Maintain absolute line fidelity and 4K resolution quality.` },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to edit image");
};
