import { addLogEntry } from '../services/logService';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function handleAPIError(error: unknown, context: string): Promise<never> {
  let message = 'An unknown error occurred';
  let details = '';

  if (error instanceof APIError) {
    message = error.message;
    details = JSON.stringify(error.details, null, 2);
  } else if (error instanceof Error) {
    message = error.message;
    details = error.stack || '';
  }

  await addLogEntry({
    type: 'error',
    category: 'sync',
    message: `${context}: ${message}`,
    details
  });

  throw new APIError(message);
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await addLogEntry({
          type: 'info',
          category: 'sync',
          message: `Retrying ${context} (attempt ${attempt + 1}/${maxRetries})`,
          details: error instanceof Error ? error.message : 'Unknown error'
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return handleAPIError(lastError, `${context} failed after ${maxRetries} attempts`);
}

export function validateResponse(response: Response, context: string): void {
  if (!response.ok) {
    throw new APIError(
      `${context} failed with status ${response.status}`,
      response.status
    );
  }
}