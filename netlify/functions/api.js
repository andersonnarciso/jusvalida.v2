// Netlify Function for API routes
const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const cors = require('cors');

// Import your existing routes logic
const { registerRoutes } = require('../../server/routes');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Register all your existing routes
registerRoutes(app).catch(console.error);

// Netlify Function handler
exports.handler = async (event, context) => {
  // Convert Netlify event to Express request
  const request = {
    method: event.httpMethod,
    url: event.path,
    headers: event.headers || {},
    body: event.body,
    query: event.queryStringParameters || {}
  };

  return new Promise((resolve) => {
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      resolve(response);
      return;
    }

    // Mock Express response object
    const res = {
      status: (code) => {
        response.statusCode = code;
        return res;
      },
      json: (data) => {
        response.body = JSON.stringify(data);
        response.headers['Content-Type'] = 'application/json';
        resolve(response);
      },
      send: (data) => {
        response.body = typeof data === 'string' ? data : JSON.stringify(data);
        resolve(response);
      },
      set: (key, value) => {
        response.headers[key] = value;
        return res;
      },
      statusCode: 200
    };

    // Mock Express request object
    const req = {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      query: request.query,
      params: {},
      get: (key) => request.headers[key.toLowerCase()],
      header: (key) => request.headers[key.toLowerCase()]
    };

    // Handle the request through Express
    app(req, res);
  });
};
