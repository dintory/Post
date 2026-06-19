import dotenv from "dotenv";

dotenv.config();

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const CHAT_TIMEOUT_MS = 120_000; // 2 minutes
const IMAGE_TIMEOUT_MS = 180_000; // 3 minutes

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterChatRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterChatResponse {
  id: string;
  choices: {
    message: OpenRouterAssistantMessage;
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterImageUrl {
  url: string;
}

export interface OpenRouterAssistantMessage {
  role: string;
  content: string | OpenRouterContentPart[];
  images?: { image_url: OpenRouterImageUrl; type?: string }[];
}

export interface OpenRouterContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: OpenRouterImageUrl;
}

export interface OpenRouterImageConfig {
  aspect_ratio?:
    | "1:1"
    | "2:3"
    | "3:2"
    | "3:4"
    | "4:3"
    | "4:5"
    | "5:4"
    | "9:16"
    | "16:9"
    | "21:9";
  image_size?: string;
}

export interface OpenRouterImageRequest extends OpenRouterChatRequest {
  modalities: ("image" | "text")[];
  image_config?: OpenRouterImageConfig;
}

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const chatCompletion = async (
  request: OpenRouterChatRequest,
): Promise<OpenRouterChatResponse> => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured in environment variables",
    );
  }

  const response = await fetchWithTimeout(
    OPENROUTER_API_URL,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://post-rtc8.onrender.com",
        "X-Title": "Commissioner",
      },
      body: JSON.stringify(request),
    },
    CHAT_TIMEOUT_MS,
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  return response.json() as Promise<OpenRouterChatResponse>;
};

export const imageGeneration = async (
  request: OpenRouterImageRequest,
): Promise<{ imageDataUrl: string; text?: string }> => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured in environment variables",
    );
  }

  const response = await fetchWithTimeout(
    OPENROUTER_API_URL,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://post-rtc8.onrender.com",
        "X-Title": "Commissioner",
      },
      body: JSON.stringify(request),
    },
    IMAGE_TIMEOUT_MS,
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenRouter image API error (${response.status}): ${errorBody}`,
    );
  }

  const result = (await response.json()) as OpenRouterChatResponse;
  const message = result.choices[0]?.message;

  if (!message) {
    throw new Error("OpenRouter returned no message for image generation");
  }

  // Primary: images array on message
  const fromImages = message.images?.[0]?.image_url?.url;
  if (fromImages) {
    const text =
      typeof message.content === "string" ? message.content : undefined;
    return { imageDataUrl: fromImages, text };
  }

  // Fallback: content parts with image_url
  if (Array.isArray(message.content)) {
    const imagePart = message.content.find(
      (p) => p.type === "image_url" && p.image_url?.url,
    );
    if (imagePart?.image_url?.url) {
      const textPart = message.content.find((p) => p.type === "text");
      return { imageDataUrl: imagePart.image_url.url, text: textPart?.text };
    }
  }

  throw new Error("OpenRouter response did not contain a generated image");
};
