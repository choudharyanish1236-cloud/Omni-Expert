
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION, MODEL_NAME } from "../constants";

export class GeminiService {
  /**
   * Streams content from the Gemini model using the Chat API.
   * Following the SDK guidelines:
   * - A new instance of GoogleGenAI is created right before the API call.
   * - API Key is retrieved directly from process.env.API_KEY.
   * - Thinking budget is set for Gemini 3 series models.
   */
  async *streamChat(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
    // Create a new instance right before making an API call to ensure it always uses the most up-to-date API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // The maximum thinking budget for gemini-3-pro-preview is 32768.
        thinkingConfig: { thinkingBudget: 32768 },
        tools: [{ googleSearch: {} }]
      },
      history: history
    });

    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) {
      // The .text property is used to extract text from the response chunk.
      yield chunk as GenerateContentResponse;
    }
  }
}

export const geminiService = new GeminiService();
