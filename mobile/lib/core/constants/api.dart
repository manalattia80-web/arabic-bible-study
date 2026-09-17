// lib/core/constants/api.dart
// Base URL for the Fastify backend API.
// Change this to your deployed Railway URL in production.

class ApiConstants {
  ApiConstants._();

  // Development: local Fastify server
  // Production: e.g. https://arabic-bible-api.railway.app/api/v1
  // REPLACE THIS with your actual deployed backend URL before building:
  static const String baseUrl = 'https://arabic-bible-api.vercel.app/api/v1';
}
