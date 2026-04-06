import fetch from "node-fetch";
import {
  onCall,
  HttpsError
} from "firebase-functions/v2/https";
import {
  defineSecret
} from "firebase-functions/params";
import admin from "firebase-admin";
import "@tensorflow/tfjs";
import * as use from "@tensorflow-models/universal-sentence-encoder";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-2.5-flash";

const REGION = "asia-south1";
const SIMILARITY_THRESHOLD = 0.75;
const ALLOWED_RADIUS_METERS = 300;

let embedderPromise = null;

function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = use.load();
  }
  return embedderPromise;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

async function embedText(text) {
  const model = await getEmbedder();
  const embeddings = await model.embed([normalizeText(text)]);
  const arr = await embeddings.array();
  embeddings.dispose();
  return arr[0];
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const x = Number(a[i]);
    const y = Number(b[i]);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return 0;
    }

    dot += x * y;
    normA += x * x;
    normB += y * y;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function buildTrackingNumber() {
  return `TRK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

async function fetchPriorityScore(title, description, apiKey) {
  if (!title || !description) {
    throw new Error("Missing title or description");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `
Given the following civic issue report:
Title: ${title}
Description: ${description}

Rate its urgency on a scale from 0.0 (not urgent) to 1.0 (most urgent).
Respond ONLY with a number between 0.0 and 1.0.
` }] }]
      }),
    }
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(`Gemini HTTP ${response.status}: ${JSON.stringify(json)}`);
  }

  const replyText = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!replyText) {
    throw new Error(`No candidate text returned: ${JSON.stringify(json)}`);
  }

  const cleaned = replyText.replace(/[^0-9.]/g, "");
  const score = parseFloat(cleaned);

  if (Number.isNaN(score)) {
    throw new Error(`Could not parse priority from: ${replyText}`);
  }

  return Math.min(Math.max(score, 0.0), 1.0);
}

export const getPriorityScore = onCall({
    region: REGION,
    secrets: [GEMINI_API_KEY],
  },
  async (request) => {
    try {
      const {
        title,
        description
      } = request.data || {};

      if (!title || !description) {
        throw new HttpsError("invalid-argument", "Missing title or description.");
      }

      const priority = await fetchPriorityScore(
        String(title),
        String(description),
        GEMINI_API_KEY.value()
      );

      return {
        priority
      };
    } catch (err) {
      console.error("getPriorityScore error:", err);
      return {
        priority: 0.5
      };
    }
  }
);

export const checkDuplicateIssue = onCall({
    region: REGION,
    memory: "1GiB",
    timeoutSeconds: 60,
  },
  async (request) => {
    try {
      const data = request.data || {};

      const title = String(data.title || "").trim();
      const description = String(data.description || "").trim();
      const category = String(data.category || "").trim();

      const latitude = Number(data.latitude);
      const longitude = Number(data.longitude);

      if (!title || !description || !category) {
        throw new HttpsError("invalid-argument", "Missing required fields.");
      }

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new HttpsError("invalid-argument", "Valid latitude and longitude are required.");
      }

      const combinedText = `${title} ${description}`;
      const embedding = await embedText(combinedText);

      const snapshot = await db
        .collection("all_issues")
        .where("category", "==", category)
        .get();

      let matchedIssueId = null;
      let matchedTrackingNumber = null;
      let bestSimilarity = -1;
      let bestDistance = null;

      for (const doc of snapshot.docs) {
        const existing = doc.data();

        if (existing.status === "Rejected") {
          continue;
        }

        const existingLat = Number(existing.latitude);
        const existingLon = Number(existing.longitude);

        if (!Number.isFinite(existingLat) || !Number.isFinite(existingLon)) {
          continue;
        }

        const existingEmbedding = Array.isArray(existing.embedding) ?
          existing.embedding.map((v) => Number(v)) :
          null;

        if (!existingEmbedding || existingEmbedding.length !== embedding.length) {
          continue;
        }

        const distance = distanceMeters(
          latitude,
          longitude,
          existingLat,
          existingLon
        );

        if (distance > ALLOWED_RADIUS_METERS) {
          continue;
        }

        const similarity = cosineSimilarity(embedding, existingEmbedding);

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestDistance = distance;
          matchedIssueId = existing.issueId || doc.id;
          matchedTrackingNumber = existing.trackingNumber || null;
        }
      }

      const isDuplicate =
        bestSimilarity >= SIMILARITY_THRESHOLD && Boolean(matchedIssueId);

      const remark = isDuplicate ?
        `Similar report already exists and is being worked upon. Original tracking number: ${matchedTrackingNumber || matchedIssueId}` :
        null;

      return {
        isDuplicate,
        duplicateOf: isDuplicate ? matchedIssueId : null,
        duplicateTrackingNumber: matchedTrackingNumber,
        remark,
        similarityScore: bestSimilarity >= 0 ? bestSimilarity : null,
        duplicateDistanceMeters: bestDistance,
        embedding,
      };
    } catch (err) {
      console.error("checkDuplicateIssue error:", err);

      if (err instanceof HttpsError) {
        throw err;
      }

      throw new HttpsError("internal", "Failed to check duplicate issue.");
    }
  }
);

export const submitIssuePipeline = onCall({
    region: REGION,
    memory: "1GiB",
    timeoutSeconds: 60,
    secrets: [GEMINI_API_KEY],
  },
  async (request) => {
    const uid = request.auth ?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Please sign in with a real account before submitting an issue.");
    }
    const data = request.data || {};
    const title = String(data.title || "").trim();
    const description = String(data.description || "").trim();
    const category = String(data.category || "").trim();
    const location = String(data.location || "").trim();
    const imageUrl = data.imageUrl ? String(data.imageUrl) : null;
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    if (!title || !description || !category || !location) {
      throw new HttpsError("invalid-argument", "Missing required fields.");
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new HttpsError("invalid-argument", "Valid latitude and longitude are required.");
    }
    const combinedText = `${title} ${description}`;
    const embedding = await embedText(combinedText);
    const snapshot = await db.collection("all_issues").where("category", "==", category).get();
    let matchedIssueId = null;
    let matchedTrackingNumber = null;
    let bestSimilarity = -1;
    let bestDistance = null;
    for (const doc of snapshot.docs) {
      const existing = doc.data();
      if (existing.status === "Rejected") {
        continue;
      }
      const existingLat = Number(existing.latitude);
      const existingLon = Number(existing.longitude);
      if (!Number.isFinite(existingLat) || !Number.isFinite(existingLon)) {
        continue;
      }
      const existingEmbedding = Array.isArray(existing.embedding) ? existing.embedding.map((v) => Number(v)) : null;
      if (!existingEmbedding || existingEmbedding.length !== embedding.length) {
        continue;
      }
      const distance = distanceMeters(latitude, longitude, existingLat, existingLon);
      if (distance > ALLOWED_RADIUS_METERS) {
        continue;
      }
      const similarity = cosineSimilarity(embedding, existingEmbedding);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestDistance = distance;
        matchedIssueId = existing.issueId || doc.id;
        matchedTrackingNumber = existing.trackingNumber || null;
      }
    }
    const isDuplicate = bestSimilarity >= SIMILARITY_THRESHOLD && Boolean(matchedIssueId);
    const now = Date.now();
    const issueRef = db.collection("all_issues").doc();
    const issueId = issueRef.id;
    const remarkText = isDuplicate ? `Similar report already exists and is being worked upon. Original tracking number: ${matchedTrackingNumber || matchedIssueId}` : null;
    const remarks = isDuplicate ? [{
      text: remarkText,
      by: "System",
      at: now,
    }, ] : [];
    const priorityScore = isDuplicate ? 0.0 : await fetchPriorityScore(title, description, GEMINI_API_KEY.value());
    const issueData = {
      ownerUid: uid,
      issueId,
      title,
      category,
      description,
      location,
      latitude,
      longitude,
      imageUrl,
      status: isDuplicate ? "Rejected" : "Pending",
      timestamp: now,
      trackingNumber: buildTrackingNumber(),
      priorityScore,
      duplicateOf: isDuplicate ? matchedIssueId : null,
      duplicateTrackingNumber: matchedTrackingNumber,
      remarks,
      remarksCount: remarks.length,
      embedding,
      similarityScore: bestSimilarity >= 0 ? bestSimilarity : null,
      duplicateDistanceMeters: bestDistance,
    };
    await issueRef.set(issueData);
    return {
      ok: true,
      issueId,
      status: issueData.status,
      duplicateOf: issueData.duplicateOf,
      duplicateTrackingNumber: matchedTrackingNumber,
      remark: remarkText,
      similarityScore: bestSimilarity >= 0 ? bestSimilarity : null,
      duplicateDistanceMeters: bestDistance,
    };
  });