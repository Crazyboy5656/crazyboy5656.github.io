
import { GoogleGenAI, GenerateContentResponse, Chat, HarmCategory, HarmBlockThreshold, Part } from "@google/genai";
import { OlympiadSubject, DailyQuestion, ChatMessage } from '../types';
import { GEMINI_TEXT_MODEL } from '../constants';

// Assume API_KEY is available in process.env
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" }); // Fallback to prevent crash if undefined

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export const generateDailyQuestions = async (subject: OlympiadSubject, count: number = 3): Promise<DailyQuestion[]> => {
  if (!API_KEY) throw new Error("API Key not configured.");
  let genAIResponse: GenerateContentResponse | undefined = undefined; 
  try {
    const prompt = `Generate ${count} distinct Olympiad-level practice questions for the subject: ${subject}.
The questions should be challenging and suitable for high school students preparing for Olympiads.

You MUST return your entire response as a single, valid JSON array of objects.
Each object in the array MUST have a "text" property.
The value of the "text" property MUST be a string containing the question.

Crucially, ensure that the JSON string you generate is perfectly valid. This means:
1. All string values (like the question text) must be enclosed in double quotes.
2. Any double quotes (") within a question string must be escaped as \\".
3. Any backslashes (\\) within a question string must be escaped as \\\\.
4. Newlines within a question string must be escaped as \\n. Tabs as \\t, carriage returns as \\r, etc. for all control characters.
5. The overall structure must be a valid JSON array.
Ensure the entire JSON array is complete and not truncated before you finish generating the response.

Do NOT include any text or markdown formatting (like \`\`\`json) before or after the JSON array if responseMimeType is set to "application/json".
Your output should be directly parsable by a standard JSON parser.

Example of a valid response:
[{"text": "What is the integral of $1/x$ from $1$ to $e$?"}, {"text": "A particle moves with velocity $v(t) = t^2 - 2t$. Find its displacement from $t=0$ to $t=3$. Ensure the final answer has units if applicable."}]`;

    genAIResponse = await ai.models.generateContent({ 
      model: GEMINI_TEXT_MODEL,
      contents: [{ role: "user", parts: [{text: prompt}]}],
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 } 
      },
      safetySettings,
    });

    let jsonStr = genAIResponse.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedQuestions: { text: string }[] = JSON.parse(jsonStr);
    return parsedQuestions.map((q, index) => ({
      id: `${subject}-daily-${Date.now()}-${index}`,
      text: q.text,
      subject: subject,
    }));
  } catch (error) {
    console.error("Error generating daily questions:", error);
    if (error instanceof SyntaxError) {
        console.error(
            "Failed to parse JSON response from AI. Raw response text (first 500 chars):", 
            genAIResponse?.text?.substring(0,500),
            "Finish Reason:", genAIResponse?.candidates?.[0]?.finishReason,
            "Finish Message:", genAIResponse?.candidates?.[0]?.finishMessage
        );
    }
    throw new Error(`Failed to generate daily questions. ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const evaluateSolution = async (subject: OlympiadSubject, question: string, solution: string): Promise<ChatMessage> => {
  if (!API_KEY) throw new Error("API Key not configured.");
  try {
    const prompt = `
You are an AI Olympiad Tutor evaluating a student's solution.
Subject: ${subject}
Question: "${question}"
Student's Solution: "${solution}"

Evaluate the solution.
- If correct, provide brief positive feedback starting with "Correct!".
- If incorrect, explain why it's wrong step-by-step, starting with "Incorrect.". Be clear and encouraging.
- If partially correct or the solution approach is interesting but flawed, acknowledge the effort and then clarify mistakes.
- Keep the explanation concise initially, suitable for a first feedback. The user can ask for more details.
Your response should be formatted as plain text. If using mathematical expressions, use LaTeX-like syntax within single dollar signs for inline math (e.g., $x^2+1$) and double dollar signs for display math (e.g., $$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$).`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: [{ role: "user", parts: [{text: prompt}]}],
      config: {
        temperature: 0.5,
      },
      safetySettings,
    });
    return { id: Date.now().toString(), role: 'model', text: response.text, timestamp: Date.now() };
  } catch (error) {
    console.error("Error evaluating solution:", error);
    throw new Error(`Failed to evaluate solution. ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Chat functionality for follow-up questions
let chatInstance: Chat | null = null;

export const startOrContinueChat = async (initialMessages: ChatMessage[], newQuery: string, subject: OlympiadSubject): Promise<ChatMessage> => {
  if (!API_KEY) throw new Error("API Key not configured.");
  
  const history = initialMessages.map(msg => ({
    role: msg.role === 'system' ? 'user' : msg.role, // Gemini chat history expects 'user' or 'model'
    parts: [{ text: msg.text }],
  }));
  
  const systemInstruction = `You are an Olympiad AI Tutor for ${subject}. The user is asking for clarification about a previous explanation related to a problem. Be patient, encouraging, and provide deeper clarification with examples if needed. Keep your responses helpful and focused on the user's query. If using mathematical expressions, use LaTeX-like syntax.`;

  chatInstance = ai.chats.create({
    model: GEMINI_TEXT_MODEL,
    history: history,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.6,
    },
    safetySettings,
  });

  try {
    const response = await chatInstance.sendMessage({ message: newQuery });
    return { id: Date.now().toString(), role: 'model', text: response.text, timestamp: Date.now() };
  } catch (error) {
    console.error("Error in chat conversation:", error);
    throw new Error(`Failed to get follow-up explanation. ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const analyzeQuestionImage = async (base64Image: string, mimeType: string, subject?: OlympiadSubject): Promise<string> => {
  if (!API_KEY) throw new Error("API Key not configured.");
  try {
    const imagePart: Part = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };
    
    const subjectContext = subject ? `The question is related to the subject: ${subject}.` : 'The question could be from any quantitative or scientific field.';
    const textPart: Part = {
      text: `Analyze the problem presented in the uploaded image. ${subjectContext} 
Provide a clear, step-by-step solution or explanation. 
If the image is unclear, or does not seem to contain a solvable question, please state that.
Format your answer clearly. If it involves mathematical expressions, use LaTeX-like syntax within single dollar signs for inline math (e.g., $x^2+1$) and double dollar signs for display math (e.g., $$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$).`
    };
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL, // This model supports multimodal input
      contents: [{ role: "user", parts: [imagePart, textPart] }],
      safetySettings,
      config: {
        temperature: 0.5, 
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error(`Failed to analyze question image. ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const analyzeTextQuestion = async (questionText: string, subject?: OlympiadSubject): Promise<string> => {
  if (!API_KEY) throw new Error("API Key not configured.");
  try {
    const subjectContext = subject ? `The question is related to the subject: ${subject}.` : 'The question could be from any quantitative or scientific field.';
    const prompt = `Please solve the following question:
---
${questionText}
---
${subjectContext}

Provide a clear, step-by-step solution or explanation for the question above.
Format your answer clearly. If it involves mathematical expressions, use LaTeX-like syntax within single dollar signs for inline math (e.g., $x^2+1$) and double dollar signs for display math (e.g., $$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$).
If the question is unclear or seems unanswerable, please state that and explain why.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings,
      config: {
        temperature: 0.5,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing text question:", error);
    throw new Error(`Failed to analyze text question. ${error instanceof Error ? error.message : String(error)}`);
  }
};
