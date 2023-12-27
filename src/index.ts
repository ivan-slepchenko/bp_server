import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import {getSimEnvironment} from "./msfs/getSimEnvironment";
import {startTranscript} from "./assemblyAI/startTranscript";
import * as os from "os";

import multer from 'multer';
import {AssemblyAI} from "assemblyai";

const storage = multer.memoryStorage()
const inMemoryMulter = multer({ storage });

dotenv.config();

const aai = new AssemblyAI({ apiKey: 'f881a4563d224e919c2949b3e0a56c5d' });
const app: Express = express();
const port = 3001;

app.get("/", (req: Request, res: Response) => {
    // getSimEnvironment();
    // startTranscript().then(() => {
    //     console.log("Transcript started");
    // });
    res.send("Express + TypeScript Server");
});

app.post("/upload", inMemoryMulter.single('file'), async (req: Request, res: Response) => {
    const file = req.file;
    if (file !== undefined) {
        const response = await startTranscript(file.buffer);
        if(response === undefined || response === null) {
            res.sendStatus(200);
        } else {
            res.send(response);
        }
    } else  {
        res.sendStatus(400);
    }
});

app.get("/token", async (_req, res) => {
    const token = await aai.realtime.createTemporaryToken({ expires_in: 3600 });
    res.json({ token });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});