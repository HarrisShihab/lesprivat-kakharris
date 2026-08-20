"use strict";

const PROJECT_ID = "les-privat-kak-harris";
const FUNCTION_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/completeMathLabDiagnostic`;
const { json, methodGuard, readBody, bearer, verifyIdToken, errorResponse } = require("./math-lab-trusted-utils.js");

exports.handler = async (event) => {
  const methodError = methodGuard(event);
  if (methodError) return methodError;
  try {
    const token = bearer(event);
    await verifyIdToken(token);
    const body = readBody(event) || {};
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error) {
      const error = new Error(payload?.error?.message || `Trusted diagnostic completion failed (${response.status}).`);
      error.statusCode = response.status;
      throw error;
    }
    return json(200, payload);
  } catch (error) {
    return errorResponse(error);
  }
};
