export type DecisionAction = "BUY" | "SELL" | "HOLD" | string;

export type Quote = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number | null;
  change: number | null;
  change_percent: number | null;
  previous_close: number | null;
  volume: number | null;
  sector?: string | null;
};

export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type AgentResult = {
  agent_name: string;
  status: string;
  summary: string | null;
  structured_output: Record<string, unknown> | null;
};

export type Decision = {
  action: string;
  confidence: number | null;
  risk_level: string | null;
  reason: string | null;
  entry_price: number | null;
  stop_loss: number | null;
  price_target: number | null;
  time_horizon: string | null;
  in_plain_language: string | null;
};

export type Analysis = {
  analysis_id: string;
  status: string;
  symbol: string;
  exchange: string;
  analysis_date: string;
  provider: string;
  model: string;
  research_depth: string;
  selected_analysts: string[];
  final_decision: string | null;
  confidence: number | null;
  risk_level: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  agents: AgentResult[];
  decision: Decision | null;
  payload: Record<string, unknown> | null;
  progress?: {
    step: number;
    total: number;
    title: string;
    detail: string;
    steps: { index: number; title: string; detail: string; agents: string[] }[];
  } | null;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type Settings = {
  llm_provider: string;
  model: string;
  quick_model?: string | null;
  temperature?: number | null;
  research_depth: string;
  debate_rounds?: number | null;
  enable_sentiment: boolean;
  enable_news: boolean;
  enable_fundamentals: boolean;
  enable_technical: boolean;
  market_data_provider: string;
  refresh_interval_seconds: number;
  output_language: string;
  google_thinking_level?: string | null;
  openai_reasoning_effort?: string | null;
  anthropic_effort?: string | null;
};

export type LlmOption = { id: string; label: string };
export type LlmProvider = {
  id: string;
  label: string;
  quick: LlmOption[];
  deep: LlmOption[];
  allows_custom: boolean;
  thinking_modes: LlmOption[];
};
