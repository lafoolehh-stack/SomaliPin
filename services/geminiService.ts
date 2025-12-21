import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

// Service function to query the Gemini Archive
export const askArchive = async (query: string, lang: Language): Promise<string> => {
  try {
    // Initializing with the environment variable directly as per guidelines (must use named parameter)
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const languageNames = {
      en: "English",
      so: "Somali",
      ar: "Arabic"
    };

    // Use gemini-3-flash-preview for summarization tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    // Directly access the .text property from the response object as it is a getter, not a function.
    return response.text || "No records found in the archive at this time.";
  } catch (error) {
    console.error("Archive retrieval failed:", error);
    return "The archive service is currently unavailable. Please try again later.";
  }
};