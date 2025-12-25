
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { SYSTEM_INSTRUCTION, MODEL_NAME } from "../constants";
import { Attachment } from "../types";

export class GeminiService {
  async *streamChat(
    message: string, 
    history: { role: 'user' | 'model', parts: Part[] }[],
    attachments: Attachment[] = []
  ) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 32768 },
        tools: [{ googleSearch: {} }]
      },
      history: history
    });

    // Construct the parts for the current message
    const parts: Part[] = [];
    
    // Add attachments first so the model has context before reading the prompt
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });

    // Add the text prompt
    parts.push({ text: message });

    const result = await chat.sendMessageStream({ message: parts });
    
    for await (const chunk of result) {
      yield chunk as GenerateContentResponse;
    }
  }
}

export const geminiService = new GeminiService();
