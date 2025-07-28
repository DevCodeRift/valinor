# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Discord bot and React web application project for monitoring Politics and War alliance activities.

## Project Structure
- `/src` - React web application (TypeScript + Vite)
- `/bot` - Discord bot (Node.js + TypeScript)
- Both applications share the same Politics and War GraphQL API integration

## Key Technologies
- **Frontend**: React 18, TypeScript, Vite, Apollo Client
- **Backend**: Discord.js 14, GraphQL, SQLite3, Node-cron
- **API**: Politics and War GraphQL API
- **Deployment**: Docker, Digital Ocean

## Code Conventions
- Use TypeScript for all new code
- Follow React functional components with hooks
- Use async/await for asynchronous operations
- Implement proper error handling and logging
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

## Discord Bot Guidelines
- Use slash commands for all user interactions
- Implement proper permission checks
- Store sensitive data (API keys) securely in database
- Use embeds for rich message formatting
- Handle rate limiting gracefully

## API Integration
- Always use the provided PoliticsAndWarAPI class
- Handle API errors gracefully
- Implement proper caching where appropriate
- Respect API rate limits

## Database Operations
- Use the Database class for all SQLite operations
- Implement proper transaction handling
- Add proper indexes for query performance
- Clean up old data regularly

## Security Considerations
- Never log or expose API keys
- Validate all user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper authentication for web endpoints
