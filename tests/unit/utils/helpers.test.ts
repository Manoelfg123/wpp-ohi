import { 
  generateUUID, 
  formatPhoneNumber, 
  base64ToBuffer, 
  bufferToBase64, 
  isValidUrl, 
  isBase64 
} from '../../../src/utils/helpers';

describe('Helpers', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format a phone number correctly', () => {
      expect(formatPhoneNumber('5511999999999')).toBe('5511999999999@s.whatsapp.net');
    });

    it('should remove non-numeric characters', () => {
      expect(formatPhoneNumber('+55 (11) 99999-9999')).toBe('5511999999999@s.whatsapp.net');
    });

    it('should not modify a phone number that already has the suffix', () => {
      const formatted = '5511999999999@s.whatsapp.net';
      expect(formatPhoneNumber(formatted)).toBe(formatted);
    });
  });

  describe('base64ToBuffer and bufferToBase64', () => {
    it('should convert base64 to buffer and back', () => {
      const base64 = 'SGVsbG8gV29ybGQ='; // "Hello World"
      const buffer = base64ToBuffer(base64);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toBe('Hello World');
      
      const convertedBack = bufferToBase64(buffer);
      expect(convertedBack).toBe(base64);
    });

    it('should handle data URLs', () => {
      const dataUrl = 'data:text/plain;base64,SGVsbG8gV29ybGQ=';
      const buffer = base64ToBuffer(dataUrl);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toBe('Hello World');
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://sub.domain.com/path?query=value')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('isBase64', () => {
    it('should return true for valid base64 strings', () => {
      expect(isBase64('SGVsbG8gV29ybGQ=')).toBe(true);
      expect(isBase64('data:text/plain;base64,SGVsbG8gV29ybGQ=')).toBe(true);
    });

    it('should return false for invalid base64 strings', () => {
      expect(isBase64('not-base64!')).toBe(false);
      expect(isBase64('')).toBe(false);
    });
  });
});
