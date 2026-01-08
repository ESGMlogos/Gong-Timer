import { GoogleGenAI, Type } from "@google/genai";
import { Routine, GongType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateRoutine = async (topic: string): Promise<Omit<Routine, 'id' | 'totalDuration'>> => {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: `Create a meditation or workout routine based on the topic: "${topic}". 
    The routine should consist of a series of steps with durations. 
    Assign a gong sound type that fits the intensity of the step:
    - DEEP: For grounding and relaxation.
    - BRIGHT: For active movement or focus.
    - ETHEREAL: For mindfulness and transitions.
    - MANTRA: For deep spiritual connection, chanting, or long holding poses (Throat singing style).
    - BONSHO: For deep Theta states, void meditation, or long periods of stillness (Buddhist Bell).
    - DORA: For powerful energy shifts, cleansing, or dramatic moments (Traditional Gong with rich harmonics).
    - TIBETAN: For chakra balancing, healing, harmonic resonance, and gentle awakening (Singing Bowl).`,
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
                  enum: [GongType.DEEP, GongType.BRIGHT, GongType.ETHEREAL, GongType.MANTRA, GongType.BONSHO, GongType.DORA, GongType.TIBETAN] 
                }
              },
              required: ["name", "duration", "gongType"]
            }
          }
        },
        required: ["name", "steps"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No content generated");
  }

  return JSON.parse(text) as Omit<Routine, 'id' | 'totalDuration'>;
};