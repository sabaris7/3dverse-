import { GoogleGenAI, Type } from "@google/genai";
import { Comment, Part, Project } from "../types";

// Initialize Gemini Client
// Note: API_KEY is expected to be available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_NAME = 'gemini-3-flash-preview';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  image?: string; // base64
}

export const generateAIResponse = async (
  history: ChatMessage[],
  currentPrompt: string,
  context: {
    project: Project;
    comments: Comment[];
    parts: Part[];
    screenshot?: string; // base64 data url
  }
): Promise<string> => {
  try {
    // 1. Construct System Instruction / Context
    const systemPrompt = `
      You are an expert industrial design assistant for the project "${context.project.name}".
      
      Project Context:
      - Status: ${context.project.status}
      - Owner: ${context.project.owner}
      - Active Parts: ${context.parts.filter(p => p.visible).map(p => p.name).join(', ')}
      - Total Comments: ${context.comments.length}
      - Open Issues: ${context.comments.filter(c => c.status === 'open').length}
      
      Your goal is to help engineers review this 3D model. 
      - Be concise, professional, and technical.
      - If asked about comments, summarize the open issues.
      - If shown an image, analyze the design, materials, and potential engineering concerns.
      - Do not make up facts not present in the context.
    `;

    // 2. Build Content Parts
    const parts: any[] = [];

    // Add image if provided in this turn
    if (context.screenshot) {
      // Remove data:image/png;base64, prefix if present
      const base64Data = context.screenshot.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      });
    }

    // Add text prompt
    parts.push({ text: currentPrompt });

    // 3. Call API
    // Note: for a real chat app, we would use ai.chats.create() to maintain history implicitly.
    // Here we act as a single-turn agent with context for simplicity in this demo structure,
    // or we could reconstruct the history. Let's use generateContent for flexibility with the system prompt injection.
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
        maxOutputTokens: 500,
      }
    });

    return response.text || "I couldn't generate a response. Please try again.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the design brain right now. Please check your API key or internet connection.";
  }
};
