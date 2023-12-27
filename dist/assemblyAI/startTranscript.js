"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTranscript = void 0;
const assemblyai_1 = require("assemblyai");
const recorder = require('node-record-lpcm16');
const startTranscript = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = new assemblyai_1.AssemblyAI({
        apiKey: 'f881a4563d224e919c2949b3e0a56c5d'
    });
    const rt = client.realtime.createService({
        sampleRate: 16000
    });
    rt.on('open', ({ sessionId }) => {
        console.log(`Session opened with ID: ${sessionId}`);
    });
    rt.on('error', (error) => {
        console.error('Error:', error);
    });
    rt.on('close', (code, reason) => console.log('Session closed:', code, reason));
    rt.on('transcript', (transcript) => {
        if (!transcript.text) {
            return;
        }
        if (transcript.message_type === 'PartialTranscript') {
            console.log('Partial:', transcript.text);
        }
        else {
            console.log('Final:', transcript.text);
        }
    });
    try {
        console.log('Connecting to real-time transcript service');
        yield rt.connect();
        console.log('Starting recording');
        const recording = recorder.record({
            channels: 1,
            sampleRate: 16000,
            audioType: 'wav' // Linear PCM
        });
        recording.stream().pipe(rt.stream());
        // Stop recording and close connection using Ctrl-C.
        process.on('SIGINT', function () {
            return __awaiter(this, void 0, void 0, function* () {
                console.log();
                console.log('Stopping recording');
                recording.stop();
                console.log('Closing real-time transcript connection');
                yield rt.close();
                process.exit();
            });
        });
    }
    catch (error) {
        console.error(error);
    }
});
exports.startTranscript = startTranscript;
