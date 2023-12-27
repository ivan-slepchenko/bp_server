"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const startTranscript_1 = require("./assemblyAI/startTranscript");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.get("/", (req, res) => {
    // getSimEnvironment();
    (0, startTranscript_1.startTranscript)().then(() => {
        console.log("Transcript started");
    });
    res.send("Express + TypeScript Server");
});
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
