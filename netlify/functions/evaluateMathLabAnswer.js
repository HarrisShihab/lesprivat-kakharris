"use strict";

const {
  json,
  methodGuard,
  readBody,
  bearer,
  verifyIdToken,
  errorResponse,
} = require("./math-lab-trusted-utils.js");

const RAILWAY_URL = process.env.MATH_LAB_RAILWAY_URL || "https://lesprivat-kakharris-production.up.railway.app";

exports.handler = async (event) => {
  const methodError = methodGuard(event);
  if (methodError) return methodError;

  try {
    const token = bearer(event);
    await verifyIdToken(token);
    const data = readBody(event)?.data || {};
    const response = await fetch(`${RAILWAY_URL}/v1/math-lab/practice/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error) {
      const error = new Error(payload?.error?.message || `Trusted Practice evaluation failed (${response.status}).`);
      error.statusCode = response.status;
      throw error;
    }
    return json(200, { data: payload });
  } catch (error) {
    return errorResponse(error);
  }
};
