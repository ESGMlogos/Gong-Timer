import { GoogleGenAI, Type } from "@google/genai";
import { Routine, GongType } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateRoutine = async (topic: string): Promise<Omit<Routine, 'id' | 'totalDuration'>> => {
  // Use gemini-3-flash-preview for speed and stability
  const prompt = `Create a meditation or workout routine based on the topic: "${topic}". 
    The routine should consist of a series of steps with durations. 
    Assign a gong sound type that fits the intensity of the step:
    - DEEP: For grounding and relaxation.
    - BRIGHT: For active movement or focus.
    - ETHEREAL: For mindfulness and transitions.
    - MANTRA: For deep spiritual connection, chanting, or long holding poses (Throat singing style).
    - BONSHO: For deep Theta states, void meditation, or long periods of stillness (Buddhist Bell).
    - DORA: For powerful energy shifts, cleansing, or dramatic moments (Traditional Gong with rich harmonics).
    - TIBETAN: For chakra balancing, healing, harmonic resonance, and gentle awakening (Singing Bowl).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "A creative Zen name for the routine" },
            description: { type: Type.STRING, description: "A short poetic description" },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  duration: { type: Type.INTEGER, description: "Duration in seconds" },
                  gongType: { 
                    type: Type.STRING, 
                    enum: [
                      GongType.DEEP, 
                      GongType.BRIGHT, 
                      GongType.ETHEREAL, 
                      GongType.MANTRA, 
                      GongType.BONSHO, 
                      GongType.DORA, 
                      GongType.TIBETAN
                    ] 
                  }
                },
                required: ["name", "duration", "gongType"],
                propertyOrdering: ["name", "duration", "gongType"]
              }
            }
          },
          required: ["name", "steps"],
          propertyOrdering: ["name", "description", "steps"]
        }
      }
    });

    const text = response.text;
    
    if (!text) {
      throw new Error("No content generated");
    }

    return JSON.parse(text) as Omit<Routine, 'id' | 'totalDuration'>;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};