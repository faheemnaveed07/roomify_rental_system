// Jest test setup file
import mongoose from 'mongoose';

beforeAll(async () => {
    // Setup before all tests
});

afterAll(async () => {
    // Cleanup after all tests
    await mongoose.disconnect();
});

beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(30000);
