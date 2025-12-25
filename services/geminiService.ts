
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION, MODEL_NAME } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async *streamChat(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
    const chat = this.ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 16000 },
        tools: [{ googleSearch: {} }]
      },
      history: history
    });

    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) {
      yield chunk as GenerateContentResponse;
    }
  }
}

export const geminiService = new GeminiService();
