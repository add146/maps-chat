/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
* @license
* SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI, GenerateContentResponse } from '@google/genai';


const SYS_INSTRUCTIONS = "Kamu adalah asisten yang memberikan jawaban ringkas berdasarkan permintaan pengguna. Berikan detail untuk 3 hasil teratas, kecuali pengguna meminta lebih sedikit. Berikan nama dan deskripsi satu baris yang menyoroti aspek unik, menarik, atau seru tentang tempat tersebut. Jangan sebutkan alamat lengkap. SELALU JAWAB DALAM BAHASA INDONESIA."
/**
* Calls the Gemini API with the googleSearch tool to get a grounded response.
* @param prompt The user's text prompt.
* @returns An object containing the model's text response and grounding sources.
*/
export async function fetchMapsGroundedResponseSDK({
  prompt,
  enableWidget = true,
  lat,
  lng,
  systemInstruction,
  apiKey,
}: {
  prompt: string;
  enableWidget?: boolean;
  lat?: number;
  lng?: number;
  systemInstruction?: string;
  apiKey: string;
}): Promise<GenerateContentResponse> {
  if (!apiKey) {
    throw new Error('Missing required API key');
  }


  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });


    const request: any = {
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        thinkingConfig: {
          thinkingBudget: 0,
        },
        systemInstruction: systemInstruction || SYS_INSTRUCTIONS,
      },
    };


    if (lat !== undefined && lng !== undefined) {
      request.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng,
          },
        },
      };
    }


    const response = await ai.models.generateContent(request);
    return (response);
  } catch (error) {
    console.error(`Error calling Google Search grounding: ${error}
   With prompt: ${prompt}`);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}


/**
* Calls the Google AI Platform REST API to get a Maps-grounded response.
* @param options The request parameters.
* @returns A promise that resolves to the API's GenerateContentResponse.
*/
export async function fetchMapsGroundedResponseREST({
  prompt,
  enableWidget = true,
  lat,
  lng,
  systemInstruction,
  apiKey,
}: {
  prompt: string;
  enableWidget?: boolean;
  lat?: number;
  lng?: number;
  systemInstruction?: string;
  apiKey: string;
}): Promise<GenerateContentResponse> {
  if (!apiKey) {
    throw new Error('Missing required API key');
  }
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;


  const requestBody: any = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    system_instruction: {
      parts: [{ text: systemInstruction || SYS_INSTRUCTIONS }]
    },
    tools: [
      {
        google_maps: {
          enable_widget: enableWidget
        },
      },
    ],
    generationConfig: {
      thinkingConfig: {
        thinkingBudget: 0
      }
    }
  };


  if (lat !== undefined && lng !== undefined) {
    requestBody.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: lat,
          longitude: lng,
        },
      },
    };
  }


  try {
    //  console.log(`endpoint: ${endpoint}\nbody: ${JSON.stringify(requestBody, null, 2)}`)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });


    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error from Generative Language API:', errorBody);
      throw new Error(
        `API request failed with status ${response.status}: ${errorBody}`,
      );
    }


    const data = await response.json();
    return data as GenerateContentResponse;
  } catch (error) {
    console.error(`Error calling Maps grounding REST API: ${error}`);
    throw error;
  }
}