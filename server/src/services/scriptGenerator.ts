import fs from "fs";
import path from "path";
import { chatCompletion } from "./openRouter";
import type { VideoFormat } from "../types/video";

export interface PromptVariable {
  required?: boolean;
  default?: string;
  description?: string;
}

export interface PromptTemplate {
  id: string;
  label: string;
  format: VideoFormat;
  model: string;
  parameters: {
    temperature: number;
    max_tokens: number;
  };
  variables: Record<string, PromptVariable>;
  messages: { role: "system" | "user"; content: string }[];
}

export interface ScriptSection {
  label: string;
  narration: string;
  imagePrompt: string;
  durationSeconds: number;
}

export interface GeneratedScript {
  title: string;
  hook: string;
  sections: ScriptSection[];
  outro: string;
  totalEstimatedDuration: string;
  tags: string[];
  subreddit?: string;
}

export interface ScriptGenerationInput {
  title: string;
  format: VideoFormat;
  durationType?: string;
  voiceStyle?: string;
  pacing?: string;
  musicStyle?: string;
  imageStyle?: string;
  subtitleStyle?: string;
  aiModel?: string;
}

const PROMPTS_DIR = path.join(__dirname, "../../prompts");

const promptCache = new Map<string, PromptTemplate>();

export const loadPromptTemplate = (format: VideoFormat): PromptTemplate => {
  const cached = promptCache.get(format);
  if (cached) return cached;

  const filePath = path.join(PROMPTS_DIR, `${format}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No prompt template found for format: ${format}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const template = JSON.parse(raw) as PromptTemplate;
  promptCache.set(format, template);
  return template;
};

export const listPromptTemplates = (): {
  id: string;
  label: string;
  format: VideoFormat;
}[] => {
  const indexPath = path.join(PROMPTS_DIR, "index.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  return index.prompts.map(
    (p: { id: string; file: string; description: string }) => {
      const template = loadPromptTemplate(p.id as VideoFormat);
      return {
        id: template.id,
        label: template.label,
        format: template.format,
      };
    },
  );
};

const interpolate = (text: string, vars: Record<string, string>): string => {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
};

const buildVariables = (
  template: PromptTemplate,
  input: ScriptGenerationInput,
): Record<string, string> => {
  const vars: Record<string, string> = { title: input.title };

  for (const [key, config] of Object.entries(template.variables)) {
    if (key === "title") continue;
    const inputValue = input[key as keyof ScriptGenerationInput];
    vars[key] =
      (typeof inputValue === "string" ? inputValue : undefined) ??
      config.default ??
      "";
  }

  for (const [key, config] of Object.entries(template.variables)) {
    if (config.required && !vars[key]) {
      throw new Error(`Missing required variable: ${key}`);
    }
  }

  return vars;
};

const parseScriptJson = (content: string): GeneratedScript => {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [
    null,
    trimmed,
  ];
  const jsonStr = jsonMatch[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(jsonStr) as GeneratedScript;
  } catch {
    throw new Error("Failed to parse script JSON from AI response");
  }
};

export const generateScript = async (
  input: ScriptGenerationInput,
): Promise<{ script: GeneratedScript; raw: string; model: string }> => {
  const template = loadPromptTemplate(input.format);
  const vars = buildVariables(template, input);

  const messages = template.messages.map((msg) => ({
    role: msg.role,
    content: interpolate(msg.content, vars),
  }));

  console.log(
    `[ScriptGen] Generating ${input.format} script for "${input.title}" via OpenRouter`,
  );

  const response = await chatCompletion({
    model: template.model,
    messages,
    temperature: template.parameters.temperature,
    max_tokens: template.parameters.max_tokens,
  });

  if (!response.choices || response.choices.length === 0) {
    console.error(
      "[ScriptGen] OpenRouter returned no choices:",
      JSON.stringify(response).slice(0, 500),
    );
    throw new Error(
      "OpenRouter returned an empty response — no choices available",
    );
  }

  const rawContent = response.choices[0]?.message?.content;
  const content =
    typeof rawContent === "string"
      ? rawContent
      : rawContent?.find((p) => p.type === "text")?.text;

  if (!content) {
    throw new Error("OpenRouter returned an empty response");
  }

  const script = parseScriptJson(content);

  console.log(
    `[ScriptGen] Generated ${script.sections?.length ?? 0} sections (~${script.totalEstimatedDuration})`,
  );

  return { script, raw: content, model: template.model };
};
