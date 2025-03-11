import 'dotenv/config';

// Mock para o logger para evitar logs durante os testes
jest.mock('../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Configuração global para testes
beforeAll(() => {
  // Configurações globais antes de todos os testes
  process.env.NODE_ENV = 'test';
  process.env.API_KEY = 'test_api_key';
});

afterAll(() => {
  // Limpeza após todos os testes
});

// Limpa todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});
