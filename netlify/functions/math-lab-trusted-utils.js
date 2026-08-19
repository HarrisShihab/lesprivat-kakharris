"use strict";

const FIREBASE_API_KEY = "AIzaSyA2BVsutEZOJmh3-aBUoPBjJeVmJ2YO7cQ";
const FIREBASE_PROJECT_ID = "les-privat-kak-harris";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const AUTH_LOOKUP_URL = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  };
}

function methodGuard(event) {
  return event?.httpMethod === "POST" ? null : json(405, { error: { message: "Method not allowed." } });
}

function readBody(event) {
  try {
    return event?.body ? JSON.parse(event.body) : {};
  } catch (_) {
    throw new Error("Request body tidak valid.");
  }
}

function bearer(event) {
  const value = String(event?.headers?.authorization || event?.headers?.Authorization || "");
  if (!value.startsWith("Bearer ")) throw new Error("Authentication is required.");
  const token = value.slice(7).trim();
  if (!token) throw new Error("Authentication is required.");
  return token;
}

async function verifyIdToken(token) {
  const response = await fetch(AUTH_LOOKUP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(payload.users) || !payload.users[0]?.localId) {
    const message = payload?.error?.message === "INVALID_ID_TOKEN" ? "Sesi login tidak valid atau sudah kedaluwarsa." : "Authentication failed.";
    const error = new Error(message);
    error.statusCode = response.status === 400 ? 401 : 502;
    throw error;
  }
  return { uid: String(payload.users[0].localId), token };
}

function fsValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number" && Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === "number") return { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(fsValue) } };
  if (typeof value === "object" && value.__timestamp) return { timestampValue: value.__timestamp };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fsValue(item)])) } };
}

function fsFields(object) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, fsValue(value)]));
}

async function firestoreRequest(path, token, options = {}) {
  const response = await fetch(`${FIRESTORE_BASE}/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Firestore request failed (${response.status}).`);
    error.statusCode = response.status;
    throw error;
  }
  return payload;
}

function decodeFsValue(value) {
  if (!value) return null;
  if (Object.prototype.hasOwnProperty.call(value, "stringValue")) return value.stringValue;
  if (Object.prototype.hasOwnProperty.call(value, "integerValue")) return Number(value.integerValue);
  if (Object.prototype.hasOwnProperty.call(value, "doubleValue")) return Number(value.doubleValue);
  if (Object.prototype.hasOwnProperty.call(value, "booleanValue")) return value.booleanValue;
  if (Object.prototype.hasOwnProperty.call(value, "timestampValue")) return value.timestampValue;
  if (Object.prototype.hasOwnProperty.call(value, "nullValue")) return null;
  if (value.arrayValue) return (value.arrayValue.values || []).map(decodeFsValue);
  if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decodeFsValue(item)]));
  return null;
}

function decodeDocument(document) {
  return Object.fromEntries(Object.entries(document?.fields || {}).map(([key, value]) => [key, decodeFsValue(value)]));
}

function errorResponse(error) {
  const status = Number(error?.statusCode) || 500;
  return json(status >= 400 && status <= 599 ? status : 500, { error: { message: error?.message || "Internal server error." } });
}

module.exports = {
  FIREBASE_PROJECT_ID,
  json,
  methodGuard,
  readBody,
  bearer,
  verifyIdToken,
  fsFields,
  firestoreRequest,
  decodeDocument,
  errorResponse,
};
