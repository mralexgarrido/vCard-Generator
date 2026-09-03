import { GoogleGenAI, Type } from "@google/genai";
import { ContactData, EventData, QrMode } from "../types";

const cleanParsedData = (data: any): any => {
  if (typeof data === 'string') {
    // Replace literal "\n" sequences with actual newlines to fix display in textareas
    // Also handle possible escaped backslashes
    return data.replace(/\\n/g, '\n').replace(/\\/g, ''); 
  }
  if (Array.isArray(data)) {
    return data.map(cleanParsedData);
  }
  if (typeof data === 'object' && data !== null) {
    const cleaned: any = {};
    for (const key in data) {
      cleaned[key] = cleanParsedData(data[key]);
    }
    return cleaned;
  }
  return data;
};

const parseInput = async (text: string, mode: QrMode): Promise<Partial<ContactData> | Partial<EventData>> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt = '';
  let schema = {};

  if (mode === 'contact') {
    prompt = `
      Extract contact information from the following text into a structured JSON format. 
      Split full names into firstName and lastName. 
      If a field is missing, omit it or use an empty string.

      IMPORTANT: 
      1. For 'organization', extract ONLY the specific Department or Division name (e.g. "Biology" or "School of Medicine"). Do not include "UTRGV" or "University of Texas" in the organization field unless it is part of the specific department name.
      2. Look for office locations (e.g., "EABS 1.102", "BMAIN 1.400") and put them in 'officeLocation'.
      
      Text to parse:
      "${text}"
    `;
    schema = {
      type: Type.OBJECT,
      properties: {
        firstName: { type: Type.STRING },
        lastName: { type: Type.STRING },
        organization: { type: Type.STRING },
        title: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        mobile: { type: Type.STRING },
        website: { type: Type.STRING },
        street: { type: Type.STRING },
        city: { type: Type.STRING },
        state: { type: Type.STRING },
        zip: { type: Type.STRING },
        country: { type: Type.STRING },
        note: { type: Type.STRING },
        officeLocation: { type: Type.STRING },
      }
    };
  } else {
    // Event Mode
    prompt = `
      Extract calendar event information from the following text into a structured JSON format.
      Convert any dates and times to ISO 8601 format (YYYY-MM-DDTHH:MM) suitable for a datetime-local input.
      
      Text to parse:
      "${text}"
    `;
    schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        location: { type: Type.STRING },
        startTime: { type: Type.STRING, description: "ISO 8601 format YYYY-MM-DDTHH:MM" },
        endTime: { type: Type.STRING, description: "ISO 8601 format YYYY-MM-DDTHH:MM" },
        description: { type: Type.STRING },
        url: { type: Type.STRING },
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const jsonText = response.text;
    if (!jsonText) return {};
    
    const parsed = JSON.parse(jsonText);
    return cleanParsedData(parsed);
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};

export { parseInput };