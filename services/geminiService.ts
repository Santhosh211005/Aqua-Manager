import { GoogleGenAI, Type } from "@google/genai";
import { AppState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const predictRefillNeeds = async (state: AppState): Promise<{ customerId: string, reason: string }[]> => {
  const simplifiedData = state.customers.map(c => ({
    id: c.id,
    name: c.name,
    deliveries: state.deliveries.filter(d => d.customerId === c.id).map(d => d.date)
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on this delivery history, identify which customers are likely to run out of water in the next 48 hours.
      DATA: ${JSON.stringify(simplifiedData)}
      Return a JSON array of objects with customerId and a short 'reason' in English.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              customerId: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["customerId", "reason"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Prediction Error:", e);
    return [];
  }
};

export const generateBilingualSMS = async (data: any): Promise<string> => {
  const systemPrompt = `You are generating customer SMS messages for a water can delivery business called Aqua Manager.
All messages must be bilingual (English + Tamil) and suitable for SMS.
Guidelines:
- Keep messages short, clear, and professional
- English first, Tamil next
- SMS-friendly line breaks
- Polite and customer-friendly tone`;

  const userPrompt = `Generate an SMS for: ${JSON.stringify(data)}. 
Contexts: DAILY_DELIVERY_BILL, PAYMENT_REMINDER, REFILL_PROMPT (ask if they need more water), or BOOKING_CONFIRMED.
Output ONLY the final SMS message.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      }
    });
    return response.text || "Error generating message.";
  } catch (error) {
    return "Failed to generate SMS. Please try manual messaging.";
  }
};

export const runAgentConversation = async (
  messages: { role: 'user' | 'model', text: string }[],
  mode: 'MERCHANT' | 'SUPPORT',
  appState: AppState
): Promise<string> => {
  const businessContext = `
    CURRENT BUSINESS DATA:
    - Customers: ${appState.customers.length}
    - Outstanding: ₹${appState.customers.reduce((acc, c) => acc + c.balance, 0)}
    - Pending Bookings: ${appState.bookings.filter(b => b.status === 'PENDING').length}
  `;

  const systemInstructions = mode === 'MERCHANT' 
    ? `You are the Aqua Manager Advisor. Help the dealer manage orders, deliveries, and collections efficiently.`
    : `You are the Aqua Manager Support Specialist. Draft professional replies to customer queries about orders and billing.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: `CONTEXT: ${businessContext}` }] },
        ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
      ],
      config: { systemInstruction: systemInstructions }
    });
    return response.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    return "The AI Agent is busy. Try again shortly.";
  }
};

export const analyzeBusinessHealth = async (appState: AppState): Promise<{ summary: string, actionableTip: string }> => {
  const dataSummary = {
    revenue: appState.transactions.filter(t => t.type === 'PAYMENT').reduce((sum, t) => sum + t.amount, 0),
    outstanding: appState.customers.reduce((sum, c) => sum + c.balance, 0),
    deliveryCount: appState.deliveries.length,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze: ${JSON.stringify(dataSummary)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            actionableTip: { type: Type.STRING }
          },
          required: ["summary", "actionableTip"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { summary: "Analysis unavailable.", actionableTip: "Keep tracking your bookings." };
  }
};