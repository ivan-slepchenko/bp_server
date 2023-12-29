import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import {startTranscript} from "./assemblyAI/startTranscript";

import multer from 'multer';
import {AssemblyAI} from "assemblyai";

const storage = multer.memoryStorage()
const inMemoryMulter = multer({ storage });

dotenv.config();

const aai = new AssemblyAI({ apiKey: process.env.ASSEMBLY_KEY ?? ""});
const app: Express = express();
const port = process.env.PORT || 3001;



import {
    LatLonAlt,
    open,
    Protocol,
    readLatLonAlt, RecvOpen,
    SimConnectConstants,
    SimConnectDataType,
    SimConnectPeriod
} from 'node-simconnect';

const enum DefinitionID {
    LIVE_DATA,
}

const enum RequestID {
    LIVE_DATA,
}

let position: LatLonAlt | undefined;
let airspeed: number | undefined;
let verticalSpeed: number | undefined;
let heading: number | undefined;

export async function startListeningForSimEvents():Promise<RecvOpen> {
    const EVENT_ID_PAUSE = 1;
    const { recvOpen, handle } = await open('Sim Connect Client', Protocol.FSX_SP2);

    handle.on('event', function (recvEvent) {
        switch (recvEvent.clientEventId) {
            case EVENT_ID_PAUSE:
                console.log(recvEvent.data === 1 ? 'Sim paused' : 'Sim unpaused');
                break;
        }
    });
    handle.on('exception', function (recvException) {
        console.log(recvException);
    });
    handle.on('quit', function () {
        console.log('Simulator quit');
    });
    handle.on('close', function () {
        console.log('Connection closed unexpectedly (simulator CTD?)');
    });

    handle.subscribeToSystemEvent(EVENT_ID_PAUSE, 'Pause');

    handle.addToDataDefinition(
        DefinitionID.LIVE_DATA,
        'STRUCT LATLONALT',
        null,
        SimConnectDataType.LATLONALT
    );

    handle.addToDataDefinition(
        DefinitionID.LIVE_DATA,
        'AIRSPEED INDICATED',
        'knots',
        SimConnectDataType.INT32
    );

    handle.addToDataDefinition(
        DefinitionID.LIVE_DATA,
        'VERTICAL SPEED',
        'Feet per second',
        SimConnectDataType.INT32
    );

    handle.addToDataDefinition(
        DefinitionID.LIVE_DATA,
        'PLANE HEADING DEGREES TRUE',
        'Degrees',
        SimConnectDataType.INT32
    );

    handle.addToDataDefinition(
        DefinitionID.LIVE_DATA,
        'LIGHT LANDING',
        'bool',
        SimConnectDataType.INT32
    );

    handle.requestDataOnSimObject(
        RequestID.LIVE_DATA,
        DefinitionID.LIVE_DATA,
        SimConnectConstants.OBJECT_ID_USER,
        SimConnectPeriod.SIM_FRAME
    );

    handle.on('simObjectData', recvSimObjectData => {
        if (recvSimObjectData.requestID === RequestID.LIVE_DATA) {
            position = readLatLonAlt(recvSimObjectData.data);
            airspeed = recvSimObjectData.data.readInt32();
            verticalSpeed = recvSimObjectData.data.readInt32();
            heading = recvSimObjectData.data.readInt32();
        }
    });
    return recvOpen;
}

app.get("/", async (req: Request, res: Response) => {
    const recvOpen = await startListeningForSimEvents();
    res.send(`
        Express + TypeScript Server.
        SimConnect: ${recvOpen.applicationName}
    `);
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

app.get("/simvars", async (_req, res) => {
    res.json({
        position,
        airspeed,
        verticalSpeed,
        heading,
    });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

