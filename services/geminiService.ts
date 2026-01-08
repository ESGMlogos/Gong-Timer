import { Routine } from "../types";

// This service has been disabled as per request to remove AI features.
export const generateRoutine = async (topic: string): Promise<Omit<Routine, 'id' | 'totalDuration'>> => {
  console.warn("AI generation is disabled.");
  throw new Error("AI features are currently disabled.");
};