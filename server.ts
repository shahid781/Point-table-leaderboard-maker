import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

app.use(express.json({ limit: '10mb' }));

const rawKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY
].filter(Boolean) as string[];

interface KeyStats {
    key: string;
    success: number;
    fail: number;
    cooldownUntil: number;
}

const keyTracker: KeyStats[] = rawKeys.map(key => ({
    key,
    success: 0,
    fail: 0,
    cooldownUntil: 0
}));

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function getAiClientFor(key: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
}

  // Helper to handle and format Gemini rate limits and errors cleanly
  const handleGeminiError = (err: any, res: express.Response, fallbackMsg: string) => {
    console.error("Gemini route error details:", err);
    
    // Check various sources of error information
    const errString = typeof err === "object" ? JSON.stringify(err) : String(err);
    const combinedErrorDetails = `${err?.message || ""} ${errString}`.toLowerCase();
    
    if (
      combinedErrorDetails.includes("resource_exhausted") ||
      combinedErrorDetails.includes("429") ||
      combinedErrorDetails.includes("quota exceeded") ||
      combinedErrorDetails.includes("rate limit") ||
      err?.status === 429 ||
      err?.statusCode === 429
    ) {
      return res.status(429).json({
        error: "Quota exceeded: You've reached your daily free-tier limit for AI requests (20/day). Please try again tomorrow, or use the manual text/CSV input methods below to avoid quota usage!"
      });
    }

    res.status(500).json({ error: (err?.message || errString || "") || fallbackMsg });
  };

  async function runWithRetry(task: (ai: GoogleGenAI) => Promise<any>, res: express.Response) {
    const now = Date.now();
    // Sort: 1) Not in cooldown, 2) Least failures, 3) Most successes
    const sortedKeys = [...keyTracker].sort((a, b) => {
        const aHealthy = a.cooldownUntil < now;
        const bHealthy = b.cooldownUntil < now;
        if (aHealthy !== bHealthy) return aHealthy ? -1 : 1;
        return (a.fail - b.fail) || (b.success - a.success);
    });

    for (const keyInfo of sortedKeys) {
        try {
            const ai = getAiClientFor(keyInfo.key);
            const result = await task(ai);
            keyInfo.success++;
            return result;
        } catch (err: any) {
            const errString = typeof err === "object" ? JSON.stringify(err) : String(err);
            const combinedErrorDetails = `${err?.message || ""} ${errString}`.toLowerCase();
            
            if (
                combinedErrorDetails.includes("resource_exhausted") ||
                combinedErrorDetails.includes("429") ||
                combinedErrorDetails.includes("quota exceeded") ||
                combinedErrorDetails.includes("rate limit") ||
                err?.status === 429 ||
                err?.statusCode === 429
            ) {
                keyInfo.fail++;
                keyInfo.cooldownUntil = now + COOLDOWN_MS;
                console.log(`API Key ${keyInfo.key.substring(0, 8)}... limit hit, cooldown for ${COOLDOWN_MS/60000}m`);
                continue; // Try next key
            }
            // For other errors, still mark fail
            keyInfo.fail++;
            handleGeminiError(err, res, "Failed task");
            return;
        }
    }
    // If all failed
    res.status(429).json({ error: "All AI keys currently exhausted or in cooldown. Please try again later." });
  }

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Server-side slot extraction API
  app.post("/api/gemini/extract-slots", async (req, res) => {
    const { base64Data, gameType } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: "Missing image data" });
    }

    await runWithRetry(async (ai) => {
      const prompt = `
        Analyze this screenshot of a Battle Royale tournament slot list for the game "${gameType || "Generic"}".
        
        FEW-SHOT EXAMPLES:
        Input: Screenshot showing Slot 1: Team Alpha, Slot 2: Beta Gaming
        Output: [{ "slotNumber": 1, "teamName": "Team Alpha", "players": "" }, { "slotNumber": 2, "teamName": "Beta Gaming", "players": "" }]

        Input: Screenshot showing Slot 5: iRush Esports (Players: Neon, Viper, Rex)
        Output: [{ "slotNumber": 5, "teamName": "iRush Esports", "players": "Neon, Viper, Rex" }]

        Extract the slot numbers, the corresponding team names, and the player names if visible.
        Return the data as a JSON array of objects with:
        - "slotNumber" (integer)
        - "teamName" (string)
        - "players" (string, comma-separated list of player names in that slot)
        Only include slots that have a team name or players assigned.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Data,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                slotNumber: { type: Type.INTEGER },
                teamName: { type: Type.STRING },
                players: { type: Type.STRING },
              },
              required: ["slotNumber", "teamName"],
            },
          },
        },
      });

      const resultText = response.text || "[]";
      const data = JSON.parse(resultText);
      res.json({ results: data });
    }, res);
  });

  // Server-side standings table import API
  app.post("/api/gemini/import-table", async (req, res) => {
    const { base64Data, gameType } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: "Missing image data" });
    }

    await runWithRetry(async (ai) => {
      const prompt = `
        Analyze this screenshot of a Battle Royale tournament overall standings/points table for the game "${gameType || "Generic"}".
        
        FEW-SHOT EXAMPLES:
        Example 1:
        Screenshot table row: 1 | Team X | 5 | 20 | 45 | 65
        Output: { "teamName": "Team X", "matchesPlayed": 5, "totalKills": 20, "totalPlacementPoints": 45, "totalPoints": 65 }

        Example 2 (Scarfall/Generic):
        Screenshot table row: #2 | Team 4 | 2 | 10 | 15 | 25
        Output: { "teamName": "Team 4", "matchesPlayed": 2, "totalKills": 10, "totalPlacementPoints": 15, "totalPoints": 25 }

        Extract the team names and their corresponding stats:
        - Matches Played
        - Total Kills (Eliminations)
        - Total Placement Points
        - Total Points
        
        Return the data as a JSON array of objects with:
        - "teamName" (string)
        - "matchesPlayed" (integer)
        - "totalKills" (integer)
        - "totalPlacementPoints" (integer)
        - "totalPoints" (integer)
        
        Ensure the data is sorted by Total Points in descending order.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Data,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                teamName: { type: Type.STRING },
                matchesPlayed: { type: Type.INTEGER },
                totalKills: { type: Type.INTEGER },
                totalPlacementPoints: { type: Type.INTEGER },
                totalPoints: { type: Type.INTEGER },
              },
              required: [
                "teamName",
                "matchesPlayed",
                "totalKills",
                "totalPlacementPoints",
                "totalPoints",
              ],
            },
          },
        },
      });

      const resultText = response.text || "[]";
      const data = JSON.parse(resultText);
      res.json({ results: data });
    }, res);
  });

  // Server-side match results extraction API
  app.post("/api/gemini/extract-match-results", async (req, res) => {
    const { base64Data, gameType, slots, pointSystem, pointsPerKill } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: "Missing image data" });
    }

    await runWithRetry(async (ai) => {
      const prompt = `
        CRITICAL TASK: Extract Battle Royale match results from this screenshot for the game "${gameType || "Generic"}".
        
        BGMI/PUBG TERMINOLOGY:
        - "Finish Points" or "KP" = Kills
        - "Position Points" or "PP" = Placement Points
        - "Total Points" = KP + PP
        
        SPECIFIC LOGIC:
        - If you see generic team names like "Team 8", "Team 2" etc., these correspond to SLOT NUMBERS.
        - Use the provided Slot List below to map "Team X" or "Slot X" to the official Team Name.
        - If a team name is missing/unrecognizable but player names are visible, use the Slot List to identify the team.
        
        FEW-SHOT EXAMPLES:
        Example 1:
        Screenshot: Rank 1 | Team: "X Gaming" | Finishes: 12
        Output: { "rank": 1, "teamName": "X Gaming", "kills": 12, "placementPoints": 10, "totalPoints": 22 }
        
        STEP 1: Identify all teams, their final Rank, and their Finishes (Kills).
        STEP 2: Use the Slot List to resolve names:
        ${(slots || [])
          .filter((s: any) => s.teamName)
          .map(
            (s: any) =>
              `Slot ${s.slotNumber}: ${s.teamName} (Players: ${s.players || "N/A"})`,
          )
          .join("\n")}
        
        STEP 3: Points System:
        ${Object.entries(pointSystem || {})
          .map(([rank, pts]) => `- Rank ${rank}: ${pts} Position Points`)
          .join("\n")}
        - Each Kill: ${pointsPerKill || 1} point(s)
        
        Return ONLY a JSON object with a "results" array.
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              results: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    rank: { type: Type.INTEGER },
                    teamName: { type: Type.STRING },
                    kills: { type: Type.INTEGER },
                    placementPoints: { type: Type.INTEGER },
                    totalPoints: { type: Type.INTEGER },
                  },
                  required: [
                    "rank",
                    "teamName",
                    "kills",
                    "placementPoints",
                    "totalPoints",
                  ],
                },
              },
            },
            required: ["results"],
          },
        },
      });

      const resultText = response.text || '{"results":[]}';
      const data = JSON.parse(resultText);
      res.json({ results: data.results || [] });
    }, res);
  });

  // Vite middleware for development
  async function setupViteAndListen() {
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      app.use(express.static(path.join(process.cwd(), "dist")));
      app.get("*", (req, res) => {
        res.sendFile(path.join(process.cwd(), "dist", "index.html"));
      });
    }

    if (!process.env.VERCEL) {
      const PORT = 3000;
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    }
  }

  setupViteAndListen();

  export default app;
