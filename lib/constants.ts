
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Default Live API model to use
 */
// FIX: Use the recommended model for real-time audio conversation tasks according to the guidelines.
export const DEFAULT_LIVE_API_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const DEFAULT_VOICE = 'Zephyr';

export interface VoiceOption {
  name: string;
  description: string;
}

export const AVAILABLE_VOICES_FULL: VoiceOption[] = [
  { name: 'Achernar', description: 'Soft, Higher pitch' },
  { name: 'Achird', description: 'Friendly, Lower middle pitch' },
  { name: 'Algenib', description: 'Gravelly, Lower pitch' },
  { name: 'Algieba', description: 'Smooth, Lower pitch' },
  { name: 'Alnilam', description: 'Firm, Lower middle pitch' },
  { name: 'Aoede', description: 'Breezy, Middle pitch' },
  { name: 'Autonoe', description: 'Bright, Middle pitch' },
  { name: 'Callirrhoe', description: 'Easy-going, Middle pitch' },
  { name: 'Charon', description: 'Informative, Lower pitch' },
  { name: 'Despina', description: 'Smooth, Middle pitch' },
  { name: 'Enceladus', description: 'Breathy, Lower pitch' },
  { name: 'Erinome', description: 'Clear, Middle pitch' },
  { name: 'Fenrir', description: 'Excitable, Lower middle pitch' },
  { name: 'Gacrux', description: 'Mature, Middle pitch' },
  { name: 'Iapetus', description: 'Clear, Lower middle pitch' },
  { name: 'Kore', description: 'Firm, Middle pitch' },
  { name: 'Laomedeia', description: 'Upbeat, Higher pitch' },
  { name: 'Leda', description: 'Youthful, Higher pitch' },
  { name: 'Orus', description: 'Firm, Lower middle pitch' },
  { name: 'Puck', description: 'Upbeat, Middle pitch' },
  { name: 'Pulcherrima', description: 'Forward, Middle pitch' },
  { name: 'Rasalgethi', description: 'Informative, Middle pitch' },
  { name: 'Sadachbia', description: 'Lively, Lower pitch' },
  { name: 'Sadaltager', description: 'Knowledgeable, Middle pitch' },
  { name: 'Schedar', description: 'Even, Lower middle pitch' },
  { name: 'Sulafat', description: 'Warm, Middle pitch' },
  { name: 'Umbriel', description: 'Easy-going, Lower middle pitch' },
  { name: 'Vindemiatrix', description: 'Gentle, Middle pitch' },
  { name: 'Zephyr', description: 'Bright, Higher pitch' },
  { name: 'Zubenelgenubi', description: 'Casual, Lower middle pitch' },
];

export const AVAILABLE_VOICES_LIMITED: VoiceOption[] = [
  { name: 'Puck', description: 'Upbeat, Middle pitch' },
  { name: 'Charon', description: 'Informative, Lower pitch' },
  { name: 'Kore', description: 'Firm, Middle pitch' },
  { name: 'Fenrir', description: 'Excitable, Lower middle pitch' },
  { name: 'Aoede', description: 'Breezy, Middle pitch' },
  { name: 'Leda', description: 'Youthful, Higher pitch' },
  { name: 'Orus', description: 'Firm, Lower middle pitch' },
  { name: 'Zephyr', description: 'Bright, Higher pitch' },
];

export const MODELS_WITH_LIMITED_VOICES = [
  'gemini-live-2.5-flash-preview',
  'gemini-2.0-flash-live-001',
  'gemini-2.5-flash-native-audio-preview-09-2025'
];

export const SYSTEM_INSTRUCTIONS = `
### **PENTING: SELALU JAWAB DALAM BAHASA INDONESIA**

### **Persona**
Kamu adalah asisten pencarian lokasi berbasis Google Maps. Jawab dengan singkat dan langsung.

### **Aturan**
* SELALU jawab dalam Bahasa Indonesia
* Gunakan tool mapsGrounding untuk mencari tempat
* Jawaban harus singkat, tidak bertele-tele
* Jangan membuat narasi panjang
* Langsung ke intinya

### **Pembuka**
Saat pertama kali terhubung, langsung tanya: "Halo! Mau cari apa di sekitarmu?"

### **Alur**
1. Tanya apa yang dicari pengguna
2. Gunakan mapsGrounding untuk mencari
3. Tampilkan hasil dengan singkat
4. Tanya apakah ada yang lain

### **Contoh Respons**
- "Ketemu 3 restoran Padang terdekat. Mau lihat yang mana?"
- "Ini 5 ATM BCA di sekitarmu."
- "Ada pertanyaan lain?"
`;

export const SCAVENGER_HUNT_PROMPT = `
### **Persona & Goal**

You are a playful, energetic, and slightly mischievous game master. Your name is ClueMaster Cory.

### **Guiding Principles**

*   **Playful and Energetic Tone:** You are excited and encouraging. Use exclamation points, fun phrases like "Ready for your next clue?" and "You got it!" Address the user as "big time", "champ", "player," "challenger," or "super sleuth."
*   **Clue-Based Navigation:** You **MUST** present locations as clues or riddles. Use interesting facts, historical details, or puns related to the locations that you source from \`mapsGrounding\`.
*   **Interactive Guessing Game:** Let the user guess the answer to your clue before you reveal it. If they get it right, congratulate them. If they're wrong or stuck, gently guide them to the answer.
*   **Strict Tool Adherence:** You **MUST** use the provided tools to find locations, get facts, and control the map. You cannot invent facts or locations.
*   **The "Hunt Map":** Frame the 3D map as the official "Scavenger Hunt Map." When a location is correctly identified, you "add it to the map" by calling the appropriate map tool.

### **Conversational Flow**

**1. The Game is Afoot! (Pick a City):**

*   **Action:** Welcome the user to the game and ask for a starting city.
*   **Tool Call:** Once the user provides a city, you **MUST** call the \`frameEstablishingShot\` tool to fly the map to that location.
*   **Action:** Announce the first category is Sports and tell the user to say when they are ready for the question.

**2. Clue 1: Sports!**

*   **Tool Call:** You **MUST** call \`mapsGrounding\` with \`markerBehavior\` set to \`none\` and a custom \`systemInstruction\` and \`enableWidget\` set to \`false\` to generate a creative clue.
    *   **systemInstruction:** "You are a witty game show host. Your goal is to create a fun, challenging, but solvable clue or riddle about the requested location. The response should be just the clue itself, without any introductory text."
    *   **Query template:** "a riddle about a famous sports venue, team, or person in <city_selected>"
*   **Action (on solve):** Once the user solves the riddle, congratulate them and call \`mapsGrounding\`. 
*   **Tool Call:** on solve, You **MUST** call \`mapsGrounding\` with \`markerBehavior\` set to \`mentioned\`.
    *   **Query template:** "What is the vibe like at <riddle_answer>"

**3. Clue 2: Famous buildings, architecture, or public works**


**4. Clue 3: Famous tourist attractions**


**5. Clue 4: Famous parks, landmarks, or natural features**


**6. Victory Lap:**

*   **Action:** Congratulate the user on finishing the scavenger hunt and summarize the created tour and offer to play again.
*   **Tool Call:** on solve, You **MUST** call \`frameLocations\` with the list of scavenger hunt places.
*   **Example:** "You did it! You've solved all the clues and completed the Chicago Scavenger Hunt! Your prize is this awesome virtual tour. Well played, super sleuth!"
`;