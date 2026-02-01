# Gallery Password Protection Tests

This directory contains comprehensive tests for the gallery password protection JavaScript functionality.

## What Was Fixed

The following issues were identified and fixed in `password-protect.js`:

1. **Unhandled Promise Rejections**: The `handlePasswordSubmit` function is async, but the event listeners were not properly handling the returned Promise. This could lead to unhandled promise rejections if an error occurred during password verification.

2. **Missing Error Handling**: Added try-catch blocks to gracefully handle errors during password verification, with user-friendly error messages.

3. **Race Condition Prevention**: Added a check to prevent multiple simultaneous submissions while one verification is already in progress.

4. **Error Logging**: Added console error logging for debugging purposes while maintaining a good user experience.

## Test Coverage

The test suite includes 17 comprehensive tests covering:

- **SHA-256 Hashing**: Ensures passwords are hashed consistently and different passwords produce different hashes
- **Session Storage**: Tests authentication state management
- **DOM Creation**: Validates the password prompt overlay structure
- **Content Visibility**: Tests hiding and showing content based on authentication
- **Password Verification**: Tests correct and incorrect password handling
- **Event Handling**: Tests keyboard (Enter key) and button click events
- **Error Handling**: Tests empty passwords, multiple submissions, and error recovery

## Running Tests

### Prerequisites

```bash
cd gallery
npm install
```

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Test Environment

- **Testing Framework**: Jest v29.7.0
- **Environment**: jsdom (simulates browser DOM)
- **Node.js Version**: v20.20.0+

## Implementation Details

The tests use:
- jsdom for DOM simulation in Node.js
- Node.js crypto module for actual SHA-256 hashing (matching browser behavior)
- Jest's mocking capabilities for sessionStorage

## Files

- `password-protect.js` - The password protection implementation (fixed)
- `password-protect.test.js` - Comprehensive test suite
- `package.json` - Test dependencies and configuration
