
export interface ApiAgent {
  id: string;
  name: string;
  role: string;
}

export interface ApiArtifact {
  id: string;
  type: string;
  content: unknown;
}

export interface AgentClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

export class AgentClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(options: AgentClientOptions = {}) {
    this.baseUrl = options.baseUrl || import.meta.env.VITE_AGENT_URL || 'https://agent.scarmonit.com';
    this.timeoutMs = options.timeoutMs || 5000;
  }

  async listAgents(): Promise<ApiAgent[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/api/agents`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Agent API call failed (${res.status})`);
      }
      const data = (await res.json()) as ApiAgent[];
      return data;
    } catch (err) {
      clearTimeout(timer);
      console.error('Failed to fetch agents:', err);
      return [];
    }
  }

  async listArtifacts(): Promise<ApiArtifact[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/api/artifacts`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Artifact API call failed (${res.status})`);
      }
      const data = (await res.json()) as ApiArtifact[];
      return data;
    } catch (err) {
      clearTimeout(timer);
      console.error('Failed to fetch artifacts:', err);
      return [];
    }
  }
}
