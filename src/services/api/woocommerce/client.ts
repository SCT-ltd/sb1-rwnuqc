import { Settings } from '../../../hooks/useSettings';
import { RequestOptions, APIError } from './types';
import { addLogEntry } from '../../logService';

export function getWooCommerceApiUrl(settings: Settings): string {
  const wcSiteUrl = settings.woocommerceSiteUrl?.replace(/\/+$/, '') || 'https://test1211.com/luxe';
  return `${wcSiteUrl}/wp-json/wc/v3`;
}

export function getAuthHeader(settings: Settings): string {
  const { woocommerceApiKey, woocommerceApiSecret } = settings;
  return `Basic ${btoa(`${woocommerceApiKey}:${woocommerceApiSecret}`)}`;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleRequestError(
  error: Error,
  attempt: number,
  maxRetries: number,
  context: string
): Promise<void> {
  const isLastAttempt = attempt === maxRetries;
  const isAborted = error.name === 'AbortError';
  const isNetworkError = error.message.includes('NetworkError') || error.message.includes('Failed to fetch');

  await addLogEntry({
    type: 'error',
    category: 'sync',
    message: `API呼び出しエラー (${context}) - 試行 ${attempt}/${maxRetries}`,
    details: `${error.message}${isAborted ? ' (タイムアウト)' : ''}${isNetworkError ? ' (ネットワークエラー)' : ''}`
  });

  if (isLastAttempt) {
    throw error;
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestOptions = {},
  context = ''
): Promise<Response> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          `HTTP error! status: ${response.status}`,
          response.status,
          errorData
        );
      }

      if (attempt > 1) {
        await addLogEntry({
          type: 'success',
          category: 'sync',
          message: `API呼び出し成功 (${context})`,
          details: `${attempt}回目の試行で成功`
        });
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      await handleRequestError(lastError, attempt, maxRetries, context);
      
      if (attempt < maxRetries) {
        const delayTime = retryDelay * Math.pow(2, attempt - 1);
        await sleep(delayTime);
      }
    }
  }

  throw lastError || new Error('Unexpected error in fetchWithRetry');
}