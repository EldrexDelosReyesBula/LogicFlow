import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

export const generateAIExplanation = async (analysis: AnalysisResult, apiKey: string): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Analyze logic expr: ${analysis.ast.expression}
      Type: ${analysis.classification}
      Vars: ${analysis.variables.join(',')}
      
      Task: Explain concisely (max 3 sentences) why it is ${analysis.classification}. 
      Target audience: Undergraduate student.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate explanation.";
  } catch (e: any) {
    console.error("AI Error:", e);
    return `Error: ${e.message}`;
  }
};
