import { AssemblyAI, TranscribeParams } from 'assemblyai';

export const startTranscript = async (buffer: Buffer) => {
    const client = new AssemblyAI({
        apiKey: 'f881a4563d224e919c2949b3e0a56c5d'
    })
    const params: TranscribeParams = {
        audio: buffer,
        language_code: 'ru',
    }
    const before = new Date().getTime();
    const result = await client.transcripts.transcribe(params);
    const now = new Date().getTime();
    console.log(`Transcription took ${now - before}ms`);
    return result.text;
}