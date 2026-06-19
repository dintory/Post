import fs from 'fs';
import path from 'path';
import { imageGeneration } from './openRouter';
import { uploadToR2 } from '../utils/r2';
import type { VideoFormat } from '../types/video';
import type { GeneratedScript, ScriptSection } from './scriptGenerator';

export interface ImagePromptVariable {
  required?: boolean;
  default?: string;
  description?: string;
}

export interface ImagePromptTemplate {
  id: string;
  label: string;
  format: VideoFormat;
  model: string;
  parameters: { temperature: number };
  image_config?: { aspect_ratio: string; image_size?: string };
  variables: Record<string, ImagePromptVariable>;
  messages: { role: 'user'; content: string }[];
}

export interface GeneratedSectionImage {
  sectionIndex: number;
  sectionLabel: string;
  imagePrompt: string;
  imageDataUrl: string;
  r2Url?: string;
  r2Key?: string;
}

const IMAGE_PROMPTS_DIR = path.join(__dirname, '../../prompts/images');
const GENERATED_DIR = path.join(__dirname, '../../generated/images');

const promptCache = new Map<string, ImagePromptTemplate>();

const ensureGeneratedDir = () => {
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }
};

export const loadImagePromptTemplate = (format: VideoFormat): ImagePromptTemplate => {
  const cached = promptCache.get(format);
  if (cached) return cached;

  const filePath = path.join(IMAGE_PROMPTS_DIR, `${format}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No image prompt template found for format: ${format}`);
  }

  const template = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ImagePromptTemplate;
  promptCache.set(format, template);
  return template;
};

const interpolate = (text: string, vars: Record<string, string>): string =>
  text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');

const dataUrlToBuffer = (dataUrl: string): { buffer: Buffer; mime: string; ext: string } => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data URL from OpenRouter');
  }
  const mime = match[1];
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  return { buffer: Buffer.from(match[2], 'base64'), mime, ext };
};

export interface GenerateImageInput {
  format: VideoFormat;
  imagePrompt: string;
  sectionLabel?: string;
  style?: string;
}

export const generateImage = async (
  input: GenerateImageInput
): Promise<{ imageDataUrl: string; model: string }> => {
  const template = loadImagePromptTemplate(input.format);

  const vars: Record<string, string> = {
    imagePrompt: input.imagePrompt,
    sectionLabel: input.sectionLabel ?? '',
    style: input.style ?? template.variables.style?.default ?? '',
  };

  for (const [key, config] of Object.entries(template.variables)) {
    if (config.required && !vars[key]) {
      throw new Error(`Missing required image variable: ${key}`);
    }
  }

  const prompt = interpolate(template.messages[0].content, vars);

  console.log(`[ImageGen] Generating image (${input.format}): ${input.imagePrompt.slice(0, 60)}...`);

  const { imageDataUrl } = await imageGeneration({
    model: template.model,
    messages: [{ role: 'user', content: prompt }],
    modalities: ['image', 'text'],
    temperature: template.parameters.temperature,
    image_config: template.image_config as { aspect_ratio: '16:9' },
  });

  return { imageDataUrl, model: template.model };
};

export const generateImagesForScript = async (
  script: GeneratedScript,
  format: VideoFormat,
  options?: { uploadToR2?: boolean; userId?: string; jobId?: string; style?: string }
): Promise<GeneratedSectionImage[]> => {
  ensureGeneratedDir();
  const results: GeneratedSectionImage[] = [];

  for (let i = 0; i < script.sections.length; i++) {
    const section = script.sections[i];
    const { imageDataUrl, model } = await generateImage({
      format,
      imagePrompt: section.imagePrompt,
      sectionLabel: section.label,
      style: options?.style,
    });

    let r2Url: string | undefined;
    let r2Key: string | undefined;

    const { buffer, mime, ext } = dataUrlToBuffer(imageDataUrl);
    const localName = `${options?.jobId ?? Date.now()}-section-${i}.${ext}`;
    const localPath = path.join(GENERATED_DIR, localName);
    fs.writeFileSync(localPath, buffer);

    if (options?.uploadToR2 && options.userId) {
      r2Key = `images/${options.userId}/${options.jobId ?? Date.now()}/${i}.${ext}`;
      r2Url = await uploadToR2(r2Key, buffer, mime);
    }

    console.log(`[ImageGen] Section ${i + 1}/${script.sections.length} done (${model})`);

    results.push({
      sectionIndex: i,
      sectionLabel: section.label,
      imagePrompt: section.imagePrompt,
      imageDataUrl,
      r2Url,
      r2Key,
    });
  }

  return results;
};

export const generateImageForSection = async (
  section: ScriptSection,
  sectionIndex: number,
  format: VideoFormat,
  style?: string
): Promise<GeneratedSectionImage> => {
  const { imageDataUrl, model } = await generateImage({
    format,
    imagePrompt: section.imagePrompt,
    sectionLabel: section.label,
    style,
  });

  console.log(`[ImageGen] Single section ${sectionIndex} done (${model})`);

  return {
    sectionIndex,
    sectionLabel: section.label,
    imagePrompt: section.imagePrompt,
    imageDataUrl,
  };
};
