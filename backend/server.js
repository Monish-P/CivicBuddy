// server.js (updated version)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import bodyParser from 'body-parser';
import mockComplaintApi from './ComplaintApi.js';
import { AzureOpenAI } from 'openai';
import { PrismaClient } from '@prisma/client';
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { CognitiveServicesCredentials } from '@azure/ms-rest-azure-js';
import fs from 'fs';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(cors());
app.use('/', mockComplaintApi);

// Multer (for image upload)
const upload = multer({ storage: multer.memoryStorage() });



// Upload route (should be before JSON parsing)
app.post('/api/upload-image', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ reply: "No image uploaded." });
  }


  try {
    const location = req.body.location || 'Unknown Location';
    const department = await analyzeImage(req.file.buffer);

    if (!department) {
      return res.json({ reply: "❌ Uploaded image doesn't match any civic issue." });
    }

    const city = "Hyderabad";
    const createdComplaint = await prisma.complaint.create({
      data: {
        city,
        department,
        description: "Auto-detected complaint via image",
        location: location,
        complaintId: `IMG-${Date.now().toString().slice(-6)}`
      }
    });

    pendingComplaints.set('default', {
      step: 'ask_additional_description',
      city,
      department,
      description: "Auto-detected complaint via image",
      location: location,
      complaintId: createdComplaint.complaintId,
      chatHistory: [],
      fromImage: true
    });

    return res.json({ reply: `🖼️ Detected *${department}* issue. Would you like to further explain the issue? (yes/no)` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Error analyzing uploaded image." });
  }
});

app.use(express.json());
app.use(bodyParser.json());

const prisma = new PrismaClient();
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-04-01-preview';
const modelName = process.env.AZURE_OPENAI_MODEL || 'gpt-4o';

const client = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion });
const cityPortalMap = JSON.parse(fs.readFileSync("city_portal_map.json", "utf-8"));

const pendingComplaints = new Map();

// Azure Computer Vision
const key = process.env.AZURE_CV_KEY;
const vision_endpoint = process.env.AZURE_CV_ENDPOINT;
const credentials = new CognitiveServicesCredentials(key);
const vision_client = new ComputerVisionClient(credentials, vision_endpoint);

async function analyzeImage(buffer) {
  const features = ['Tags', 'Objects'];
  const analysis = await vision_client.analyzeImageInStream(buffer, { visualFeatures: features });

  const tags = analysis.tags.map(tag => tag.name.toLowerCase());
  const objects = analysis.objects.map(obj => obj.object.toLowerCase());

  const combined = [...tags, ...objects];
  if (combined.includes('pothole')) return 'Road Maintenance';
  if (combined.includes('garbage') || combined.includes('trash')) return 'Sanitation';
  if (combined.includes('streetlight') || combined.includes('light')) return 'Street Light';
  if (combined.includes('water') || combined.includes('leak')) return 'Water Supply';

  return null;
}

async function classifyDepartment(description) {
  const response = await client.chat.completions.create({
    messages: [
      { role: "system", content: "Classify strictly into: Sanitation, Water Supply, Street Light, Road Maintenance." },
      { role: "user", content: description }
    ],
    max_tokens: 10,
    temperature: 0,
    model: modelName,
  });

  return response.choices[0].message.content.trim();
}

async function classifyIntent(message) {
  const response = await client.chat.completions.create({
    messages: [
      { role: "system", content: "Classify into: complaint or general." },
      { role: "user", content: message }
    ],
    max_tokens: 5,
    temperature: 0,
    model: modelName,
  });

  return response.choices[0].message.content.trim().toLowerCase();
}

// 🌟 Main Smart Flow
app.post("/api/ask", async (req, res) => {
  const { message, location, userId = "default" } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    // If user is in pending conversation
    if (pendingComplaints.has(userId)) {
      const pending = pendingComplaints.get(userId);
      pending.chatHistory.push({ from: 'user', text: message });

      const confirmation = message.trim().toLowerCase();

      if (pending.step === 'ask_additional_description') {
        if (["yes", "yep", "yeah"].some(p => confirmation.includes(p))) {
          pending.step = 'awaiting_description';
          pendingComplaints.set(userId, pending);
          return res.json({ reply: "✏️ Please describe the issue briefly." });
        } else {
          pending.step = 'ask_location_update';
          pendingComplaints.set(userId, pending);
          return res.json({ reply: `📍 Current address is *${pending.location}*. Would you like to update it? (yes/no)` });
        }
      }

      if (pending.step === 'awaiting_description') {
        pending.description = message;
        pending.step = 'ask_location_update';
        pendingComplaints.set(userId, pending);
        return res.json({ reply: `📍 Current address is *${pending.location}*. Would you like to update it? (yes/no)` });
      }

      if (pending.step === 'ask_location_update') {
        if (["yes", "yep", "yeah"].some(p => confirmation.includes(p))) {
          pending.step = 'awaiting_new_location';
          pendingComplaints.set(userId, pending);
          return res.json({ reply: "📍 Please provide the updated location." });
        } else {
          pending.step = 'final_confirmation';
          pendingComplaints.set(userId, pending);
          return finalizeComplaint(userId, res);
        }
      }

      if (pending.step === 'awaiting_new_location') {
        pending.location = message;
        pending.step = 'final_confirmation';
        pendingComplaints.set(userId, pending);
        return finalizeComplaint(userId, res);
      }
    }

    // New complaint detection
    const intent = await classifyIntent(message);

    if (intent === "general") {
      const generalRes = await client.chat.completions.create({
        messages: [
          { role: "system", content: `You are CivicBuddy Assistant — a helpful civic grievance assistant built for citizens to engage with municipal services.

          Your responsibilities include:
          - Answering questions about civic issues like water supply, road maintenance, street lights, sanitation, etc.
          - Explaining how users can raise or follow up on grievances.
          - Helping users understand how complaint classification, image reporting, and location detection work.
          - Responding politely to small talk, but always steering the conversation back to civic services.
          - Never make up jokes, facts, or content unrelated to local municipal services.
          
          If you do not know the answer, suggest raising a complaint or redirect the user to the civic helpdesk.`   },
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
        model: modelName,
      });

      return res.json({ reply: generalRes.choices[0].message.content.trim() });
    }

    if (intent === "complaint") {
      const department = await classifyDepartment(message);
      const city = "Hyderabad";
      const createdComplaint = await prisma.complaint.create({
        data: {
          city,
          department,
          description: message,
          location: JSON.stringify(location),
          complaintId: `CMP-${Date.now().toString().slice(-6)}`
        }
      });

      pendingComplaints.set(userId, {
        step: 'ask_additional_description',
        city,
        department,
        location,
        description: message,
        complaintId: createdComplaint.complaintId,
        chatHistory: [{ from: "user", text: message }]
      });

      return res.json({ reply: `📝 Detected *${department}* issue. Would you like to further explain the issue? (yes/no)` });
    }

    res.status(400).json({ reply: "🤔 Sorry, couldn't understand. Could you rephrase?" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Finalize complaint and respond
async function finalizeComplaint(userId, res) {
  const pending = pendingComplaints.get(userId);

  if (!pending) {
    return res.status(400).json({ reply: "No pending complaint to register." });
  }

  pendingComplaints.delete(userId);

  const cityData = cityPortalMap[pending.city];
  const endpoint = cityData.departments[pending.department];

  const complaintRes = await fetch(`http://localhost:5001${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pending),
  });

  const data = await complaintRes.json();

  const summary = `
✅ Complaint registered successfully!

- Department: *${pending.department}*
- Location: *${pending.location}*
- Description: *${pending.description}*
- Grievance ID: *${pending.complaintId}*

The Hyderabad City Municipal Corp. will get back to you soon. You can track your complaint using the ID above.
For any further assistance, please contact: 040-23225397.
`;

  // Update chat history in DB
  await prisma.complaint.update({
    where: { complaintId: pending.complaintId },
    data: { chatHistory: [...pending.chatHistory, { from: "bot", text: summary }] }
  });

  return res.json({ reply: summary });
}

// 📋 Fetch all grievances
app.get('/api/grievances', async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ grievances: complaints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch grievances' });
  }
});

// 📜 Fetch grievance history
app.get("/api/grievance/:complaintId", async (req, res) => {
  const { complaintId } = req.params;
  try {
    const grievance = await prisma.complaint.findUnique({ where: { complaintId } });
    if (!grievance) return res.status(404).json({ error: 'Grievance not found' });
    res.json({ chatHistory: grievance.chatHistory || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch grievance' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
