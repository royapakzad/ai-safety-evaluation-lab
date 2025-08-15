// create-env.js
const fs = require('fs');

// This script generates the env.js file from environment variables
// provided by the hosting platform (like Vercel).
const envContent = `
// This file is auto-generated during the build process
// and should not be committed to version control.

export const API_KEY = "${process.env.API_KEY || ''}";
export const OPENAI_API_KEY = "${process.env.OPENAI_API_KEY || ''}";
export const MISTRAL_API_KEY = "${process.env.MISTRAL_API_KEY || ''}";
`;

try {
  fs.writeFileSync('./env.js', envContent);
  console.log('Successfully created env.js from environment variables.');
} catch (err) {
  console.error('Failed to create env.js:', err);
  process.exit(1); // Exit with an error code
}