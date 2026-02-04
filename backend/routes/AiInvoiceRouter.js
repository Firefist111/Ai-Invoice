import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

import dotenv from "dotenv";

dotenv.config();

const aiInvoiceRouter = express.Router();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"];

function buildInvoicePrompt(promptText) {
  const invoiceTemplate = {
    invoiceNumber: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    fromBusinessName: "",
    fromEmail: "",
    fromAddress: "",
    fromPhone: "",
    client: { name: "", email: "", address: "", phone: "" },
    items: [{ id: "1", description: "", qty: 1, unitPrice: 0 }],
    taxPercent: 18,
    notes: "",
  };

  return `
You are an invoice generation assistant.

Task:
  - Analyze the user's input text and produce a valid JSON object only (no explanatory text).
  - The JSON MUST match the schema below (include all fields even if empty).
  - Ensure all dates are ISO 'YYYY-MM-DD' strings and numeric fields are numbers.

Schema:
${JSON.stringify(invoiceTemplate, null, 2)}

User input:
${promptText}

Output: valid JSON only (no surrounding code fences, no commentary).
`;
}

async function tryGenerateWithModel(modelName, prompt) {
  try {
    // Correct way to use Google GenAI SDK
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Extract text from response
    const text = response.text();

    if (!text || !String(text).trim()) {
      console.error('Empty response from model:', modelName);
      throw new Error(`Empty text returned from model ${modelName}`);
    }

    return { text: String(text).trim(), modelName };
  } catch (error) {
    console.error(`Error with model ${modelName}:`, error.message);
    throw error;
  }
}



aiInvoiceRouter.post('/generate', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        message: "AI API key not configured",
      });
    }

    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    // Build the full prompt with instructions
    const fullPrompt = buildInvoicePrompt(prompt.trim());

    let lastErr = null;
    let lastText = null;
    let usedModel = null;

    for (const m of MODEL_CANDIDATES) {
      try {
        const { text, modelName } = await tryGenerateWithModel(m, fullPrompt);
        lastText = text;
        usedModel = modelName;
        if (text && text.trim()) break;
      } catch (err) {
        console.warn(`Model ${m} failed:`, err?.message || err);
        lastErr = err;
        continue;
      }
    }

    if (!lastText) {
      const errMsg =
        (lastErr && lastErr.message) ||
        "All candidate models failed. Check API key, network, or model availability.";
      console.error("AI generation failed (no text):", errMsg);
      return res.status(502).json({
        success: false,
        message: "AI generation failed",
        detail: errMsg,
      });
    }

    const text = lastText.trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      console.error("AI response did not contain JSON object:", {
        usedModel,
        text,
      });
      return res.status(502).json({
        success: false,
        message: "AI returned malformed response (no JSON found)",
        raw: text,
        model: usedModel,
      });
    }

    const jsonText = text.slice(firstBrace, lastBrace + 1);
    let data;
    try {
      data = JSON.parse(jsonText);

    } catch (error) {
      console.error("AI response JSON parsing failed:", {
        model: usedModel,
        jsonText,
        error: error.message,
      });
      return res.status(502).json({
        success: false,
        message: "AI response contains invalid JSON",
        raw: text,
        model: usedModel
      })
    }

    return res.status(200).json({
      success: true,
      data,
      model: usedModel
    })
  }
  catch (error) {
    console.error("Server error during AI invoice generation:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      detail: error.message
    });
  }

})

export default aiInvoiceRouter;