import { GoogleGenAI, Type } from "@google/genai";
import { Message, UserStats } from "../types";

const geminiKey = process.env.GEMINI_API_KEY;
const grokKey = process.env.GROK_API_KEY;
const hindsightKey = process.env.HINDSIGHT_API_KEY;

export class MentorService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (geminiKey) {
      this.ai = new GoogleGenAI({ apiKey: geminiKey });
    }
  }

  async analyzeCode(code: string, history: Message[], stats: UserStats): Promise<Partial<Message>> {
    // If Grok key is present, we use the xAI API (OpenAI compatible)
    if (grokKey) {
      return this.analyzeWithGrok(code, history, stats);
    }

    if (!this.ai) {
      throw new Error("No AI API key found (Gemini or Grok required)");
    }

    const systemInstruction = `
      You are a world-class AI Coding Mentor. Your goal is to help the user improve by analyzing their code, identifying mistakes, and tracking their learning progress.
      ${hindsightKey ? "Note: Hindsight memory integration is active." : ""}
      
      Current User Stats:
      - Language: ${stats.language}
      - Weak Topics: ${stats.weakTopics.join(", ")}
      - Previous Mistakes: ${stats.mistakes.join(", ")}
      
      When the user submits code:
      1. Explain any mistakes clearly but encouragingly.
      2. Reference past mistakes if the user is repeating them.
      3. Provide a specific suggestion for improvement.
      4. Suggest a "Next Coding Challenge" to reinforce the learning.
      5. Recommend a topic for further study.
      6. Detect the programming language and the core topic of the code.

      Respond ONLY in JSON format with the following structure:
      {
        "explanation": "string",
        "language": "string",
        "topic": "string",
        "mistakes": ["string"],
        "suggestions": ["string"],
        "challenge": "string",
        "recommendation": "string"
      }
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: `Analyze this code:\n\n${code}` }] }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              language: { type: Type.STRING },
              topic: { type: Type.STRING },
              mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              challenge: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            },
            required: ["explanation", "language", "topic", "mistakes", "suggestions", "challenge", "recommendation"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      
      return {
        content: data.explanation,
        metadata: {
          language: data.language,
          topic: data.topic,
          mistakes: data.mistakes,
          suggestions: data.suggestions,
          challenge: data.challenge,
          recommendation: data.recommendation
        }
      };
    } catch (error) {
      console.error("Mentor analysis failed:", error);
      return {
        content: "I'm having trouble analyzing your code right now. Let's try again in a moment.",
        metadata: {}
      };
    }
  }

  private async analyzeWithGrok(code: string, history: Message[], stats: UserStats): Promise<Partial<Message>> {
    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${grokKey}`
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [
            {
              role: "system",
              content: `You are a world-class AI Coding Mentor. Analyze code and respond ONLY in JSON.
              Stats: Language: ${stats.language}, Mistakes: ${stats.mistakes.join(", ")}`
            },
            {
              role: "user",
              content: `Analyze this code and provide feedback in JSON format: \n\n${code}`
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      const result = await response.json();
      const data = JSON.parse(result.choices[0].message.content);

      return {
        content: data.explanation || "Grok analysis complete.",
        metadata: {
          language: data.language || "Unknown",
          topic: data.topic || "General",
          mistakes: data.mistakes || [],
          suggestions: data.suggestions || [],
          challenge: data.challenge || "Keep practicing!",
          recommendation: data.recommendation || "Study more."
        }
      };
    } catch (error) {
      console.error("Grok analysis failed:", error);
      throw error;
    }
  }
}

export const mentorService = new MentorService();
