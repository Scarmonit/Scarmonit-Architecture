// Port utility for Cloudflare Workers development
export const DEFAULT_DEV_PORT = 8787

export interface PortConfig {
  port: number
  host: string
}

export function getDefaultConfig(): PortConfig {
  return {
    port: DEFAULT_DEV_PORT,
    host: 'localhost',
  }
}

export function getLocalUrl(config: PortConfig = getDefaultConfig()): string {
  return `http://${config.host}:${config.port}`
}
