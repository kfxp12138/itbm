import { APP_CONFIG } from '@/lib/payment-config';

function getBaseUrl(): string {
  if (!APP_CONFIG.baseUrl) {
    throw new Error('APP_BASE_URL 未配置');
  }

  return APP_CONFIG.baseUrl;
}

export function buildAppUrl(pathname: string): string {
  return new URL(pathname, `${getBaseUrl()}/`).toString();
}

export function buildAppPathUrl(pathOrSearch: string): string {
  return new URL(pathOrSearch, `${getBaseUrl()}/`).toString();
}
