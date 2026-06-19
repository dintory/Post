import { PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandInput } from "@aws-sdk/client-polly";
import { Readable } from "stream";

// Load credentials from environment variables AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION
// The SDK automatically uses these environment variables if they are set,
// but we explicitly pass them here as per best practices or if they need to be overridden.
const pollyClient = new PollyClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Generates a voiceover using Amazon Polly TTS.
 *
 * @param text The text string to synthesize.
 * @returns A promise that resolves to the audio Buffer.
 */
export const generateVoiceover = async (text: string): Promise<Buffer> => {
  try {
    const params: SynthesizeSpeechCommandInput = {
      Engine: "neural",
      OutputFormat: "mp3",
      Text: text,
      VoiceId: "Matthew",
    };

    const command = new SynthesizeSpeechCommand(params);
    const response = await pollyClient.send(command);

    if (response.AudioStream) {
      const stream = response.AudioStream as Readable;

      // Check if transformToByteArray is available (AWS SDK v3 feature)
      if (typeof (stream as any).transformToByteArray === "function") {
        const uint8Array = await (stream as any).transformToByteArray();
        return Buffer.from(uint8Array);
      }

      // Fallback for standard Node.js Readable stream
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on("error", (err) => reject(err));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    throw new Error("No AudioStream returned from Amazon Polly.");
  } catch (error) {
    console.error("[generateVoiceover] Error generating voiceover with Polly:", error);
    throw error;
  }
};

/**
 * Fetches word-level speech marks (timing metadata) from Amazon Polly.
 *
 * @param text The text string to synthesize.
 * @returns A promise that resolves to the Speech Marks data as a string (Newline-Delimited JSON).
 */
export const generateSpeechMarks = async (text: string): Promise<string> => {
  try {
    const params: SynthesizeSpeechCommandInput = {
      Engine: "neural",
      OutputFormat: "json",
      SpeechMarkTypes: ["word"],
      Text: text,
      VoiceId: "Matthew",
    };

    const command = new SynthesizeSpeechCommand(params);
    const response = await pollyClient.send(command);

    if (response.AudioStream) {
      const stream = response.AudioStream as Readable;

      if (typeof (stream as any).transformToString === "function") {
        return await (stream as any).transformToString("utf-8");
      }

      return new Promise<string>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on("error", (err) => reject(err));
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      });
    }

    throw new Error("No AudioStream returned for Speech Marks from Polly.");
  } catch (error) {
    console.error("[generateSpeechMarks] Error fetching speech marks from Polly:", error);
    throw error;
  }
};
