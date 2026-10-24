/**
 * Parser for VPN Payload Macros: [crlf], [host], [host_port], [port], [ua], [protocol], [split]
 * Replaces tags with actual runtime values before sending to proxy/server.
 */

export interface ParseOptions {
  host: string;
  port: number | string;
  userAgent?: string;
}

export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0';

export function parsePayload(raw: string, options: ParseOptions): string {
  if (!raw) return '';

  const host = options.host || '127.0.0.1';
  const port = String(options.port || '80');
  const ua = options.userAgent || DEFAULT_USER_AGENT;

  let parsed = raw
    .replace(/\[host_port\]/gi, `${host}:${port}`)
    .replace(/\[host\]/gi, host)
    .replace(/\[port\]/gi, port)
    .replace(/\[ua\]/gi, ua)
    .replace(/\[protocol\]/gi, 'HTTP/1.1')
    .replace(/\[cr\]/gi, '\r')
    .replace(/\[lf\]/gi, '\n')
    .replace(/\[crlf\]/gi, '\r\n')
    .replace(/\[split\]/gi, ''); // Split marker for packet fragmenter

  return parsed;
}

/**
 * Returns a human-readable display of what the raw payload expands to
 */
export function previewParsedPayload(raw: string, options: ParseOptions): string {
  const parsed = parsePayload(raw, options);
  // Replace actual carriage returns and newlines with visible line breaks
  return parsed.replace(/\r\n/g, '\n');
}
