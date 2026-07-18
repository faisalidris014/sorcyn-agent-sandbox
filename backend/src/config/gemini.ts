import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { env } from './env.js';

let _gemini: GoogleGenerativeAI | null = null;

export function getGemini(): GoogleGenerativeAI {
  if (!_gemini) {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    _gemini = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return _gemini;
}

export function getGeminiModel(modelName = 'gemini-2.5-flash-lite'): GenerativeModel {
  return getGemini().getGenerativeModel({ model: modelName });
}
