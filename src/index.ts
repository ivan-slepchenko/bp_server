import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import {AssemblyAI} from "assemblyai";
import cors from "cors";

dotenv.config();

const aai = new AssemblyAI({ apiKey: process.env.ASSEMBLY_KEY ?? ""});

const app: Express = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors())

const port = process.env.PORT || 3001;

import {
    open,
    Protocol,
    RecvOpen,
    SimConnectConstants,
    SimConnectDataType,
    SimConnectPeriod
} from 'node-simconnect';

import formatcoords from "formatcoords";


const enum DefinitionID {
    LIVE_DATA,
}

const enum RequestID {
    LIVE_DATA,
}

let altitude: number | undefined;
let latitude: number | undefined;
let longitude: number | undefined;
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

    handle.addToDataDefinition(DefinitionID.LIVE_DATA, 'INDICATED ALTITUDE', 'feet', SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(DefinitionID.LIVE_DATA, 'PLANE LATITUDE', 'degrees', SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(DefinitionID.LIVE_DATA, 'PLANE LONGITUDE', 'degrees', SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(DefinitionID.LIVE_DATA, 'VERTICAL SPEED', 'Feet per second', SimConnectDataType.INT32);
    handle.addToDataDefinition(DefinitionID.LIVE_DATA, 'PLANE HEADING DEGREES TRUE', 'Degrees', SimConnectDataType.INT32);
    handle.addToDataDefinition(DefinitionID.LIVE_DATA, 'AIRSPEED INDICATED', 'knots', SimConnectDataType.INT32);

    handle.requestDataOnSimObject(
        RequestID.LIVE_DATA,
        DefinitionID.LIVE_DATA,
        SimConnectConstants.OBJECT_ID_USER,
        SimConnectPeriod.SIM_FRAME
    );

    handle.on('simObjectData', recvSimObjectData => {
        if (recvSimObjectData.requestID === RequestID.LIVE_DATA) {
            altitude = recvSimObjectData.data.readFloat64();
            latitude = recvSimObjectData.data.readFloat64();
            longitude = recvSimObjectData.data.readFloat64();
            verticalSpeed = recvSimObjectData.data.readInt32();
            heading = recvSimObjectData.data.readInt32();
            airspeed = recvSimObjectData.data.readInt32();
        }
    });
    return recvOpen;
}

app.get("/", async (req: Request, res: Response) => {

    res.send(`
        Express + TypeScript Server.
    `);
});

app.get("/token", async (req, res) => {
    const token = await aai.realtime.createTemporaryToken({ expires_in: 3600 });
    res.json({ token });
});

app.get("/simvars", async (_req, res) => {
    res.json({
        coordinates: formatcoords({lat: latitude ?? 0, lng: longitude ?? 0}).format(),
        altitude,
        verticalSpeed,
        heading,
        airspeed,
    });
});

app.use(express.static('files'))

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

 void startListeningForSimEvents();