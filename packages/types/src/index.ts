export interface PolicyActions {
  deny_domains: string[];
  ask_patterns: string[];
  pause_keywords: string[];
  snapshot_pdf_domains: string[];
}

export interface Policy {
  actions: PolicyActions;
}

export interface SourceRecord {
  id?: string; 
  url?: string; 
  host?: string; 
  title?: string;
  author?: string; 
  lang?: string; 
  published_at?: string; 
  extracted_at?: string;
  snapshot_path?: string; 
  content_text?: string;
  quality?: { 
    score?: number; 
    labels?: string[] 
  };
  keywords?: string[];
}
export interface Plan {
  topic: string;
  phases: { name: string; goal: string; tools: string[]; outputs: string[] }[];
  checkpoints: string[];
}
export interface AuditItem { claim: string; support: string[]; counter: string[]; note?: string }
export interface ReportContext {
  topic: string; date: string; langs: string; since?: string; until?: string; confidence?: string;
  key_findings: { point: string; sources: { id: string; url: string; time?: string; snapshot?: string }[] }[];
  evidence: AuditItem[]; risks: string[];
  recommendations: { option: string; pros: string; cons: string; conditions?: string; risks?: string }[];
  plan_ref?: string; dashboard_path?: string;
}
