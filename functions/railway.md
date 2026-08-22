# Railway runtime

This directory can run the Math Lab trusted evaluator as an HTTP service on Railway.

Start command: `npm start`

Health endpoint: `/health`

Authentication: `Authorization: Bearer <Firebase ID token>`

Required production variable: `FIREBASE_SERVICE_ACCOUNT_JSON` containing the Firebase Admin service-account JSON. Never commit this value to Git.
