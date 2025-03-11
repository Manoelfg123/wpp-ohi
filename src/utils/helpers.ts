import { randomUUID } from 'crypto';

/**
 * Gera um UUID v4 aleatório
 */
export const generateUUID = (): string => {
  return randomUUID();
};

/**
 * Formata um número de telefone para o formato do WhatsApp
 * @param phoneNumber Número de telefone a ser formatado
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove caracteres não numéricos
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Verifica se já tem o sufixo @s.whatsapp.net
  if (cleaned.includes('@')) {
    return cleaned;
  }
  
  // Adiciona o sufixo do WhatsApp
  return `${cleaned}@s.whatsapp.net`;
};

/**
 * Converte uma string base64 para Buffer
 * @param base64 String em formato base64
 */
export const base64ToBuffer = (base64: string): Buffer => {
  // Remove o prefixo de data URL se existir (ex: data:image/jpeg;base64,)
  const base64Data = base64.includes('base64,') 
    ? base64.split('base64,')[1] 
    : base64;
  
  return Buffer.from(base64Data, 'base64');
};

/**
 * Converte um Buffer para string base64
 * @param buffer Buffer a ser convertido
 */
export const bufferToBase64 = (buffer: Buffer): string => {
  return buffer.toString('base64');
};

/**
 * Atrasa a execução por um determinado tempo
 * @param ms Tempo em milissegundos
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Verifica se uma string é uma URL válida
 * @param url String a ser verificada
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Verifica se uma string é base64 válido
 * @param str String a ser verificada
 */
export const isBase64 = (str: string): boolean => {
  // Remove o prefixo de data URL se existir
  const base64Data = str.includes('base64,') 
    ? str.split('base64,')[1] 
    : str;
  
  const regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
  return regex.test(base64Data);
};
