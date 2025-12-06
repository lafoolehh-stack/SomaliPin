import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

// Removed top-level initialization to prevent crash on load if API Key is missing
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const askArchive = async (query: string, lang: Language): Promise<string> => {
  try {
    // In Vite/Client-side, strictly we should use import.meta.env, but protecting process.env usage here
    // If you have a specific VITE_API_KEY, replace process.env.API_KEY with import.meta.env.VITE_API_KEY
    const apiKey = process.env.API_KEY;

    // Safety check: If no API key, return a friendly message instead of crashing
    if (!apiKey) {
      console.warn("Gemini API Key is missing. AI Search is disabled.");
      return "Archive intelligence is currently unavailable (Configuration Pending).";
    }

    // Initialize the client only when needed
    const ai = new GoogleGenAI({ apiKey });

    const languageNames = {
      en: "English",
      so: "Somali",
      ar: "Arabic"
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `User Query: ${query}`,
      config: {
        systemInstruction: `You are the Head Archivist for 'SomaliPin', a prestigious digital registry of Somali excellence. 
        Your tone is authoritative, objective, and respectful, similar to an encyclopedia or a government historian.
        
        Provide a concise summary (max 150 words) regarding the user's query about Somali figures, history, or business. 
        Focus on verified achievements and historical significance. 
        If the query is vague, politely ask for clarification.
        Do not use markdown formatting like bolding or headers, just plain text paragraphs.
        
        IMPORTANT: The user has selected ${languageNames[lang]} as their preferred language. You MUST reply in ${languageNames[lang]}.`,
        temperature: 0.3, // Low temperature for factual accuracy
      }
    });

    return response.text || "No records found in the archive at this time.";
  } catch (error) {
    console.error("Archive retrieval failed:", error);
    return "The archive service is currently unavailable. Please try again later.";
  }
};