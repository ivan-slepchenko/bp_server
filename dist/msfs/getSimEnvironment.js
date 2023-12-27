"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSimEnvironment = void 0;
const node_simconnect_1 = require("node-simconnect");
function getSimEnvironment() {
    const EVENT_ID_PAUSE = 1;
    (0, node_simconnect_1.open)('Beardy Sim Connect Client', node_simconnect_1.Protocol.FSX_SP2)
        .then(function ({ recvOpen, handle }) {
        console.log('Connected to', recvOpen.applicationName);
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
        handle.addToDataDefinition(0 /* DefinitionID.LIVE_DATA */, 'STRUCT LATLONALT', null, node_simconnect_1.SimConnectDataType.LATLONALT);
        handle.addToDataDefinition(0 /* DefinitionID.LIVE_DATA */, 'AIRSPEED INDICATED', 'knots', node_simconnect_1.SimConnectDataType.INT32);
        handle.addToDataDefinition(0 /* DefinitionID.LIVE_DATA */, 'VERTICAL SPEED', 'Feet per second', node_simconnect_1.SimConnectDataType.INT32);
        handle.addToDataDefinition(0 /* DefinitionID.LIVE_DATA */, 'PLANE HEADING DEGREES TRUE', 'Degrees', node_simconnect_1.SimConnectDataType.INT32);
        handle.addToDataDefinition(0 /* DefinitionID.LIVE_DATA */, 'LIGHT LANDING', 'bool', node_simconnect_1.SimConnectDataType.INT32);
        handle.requestDataOnSimObject(0 /* RequestID.LIVE_DATA */, 0 /* DefinitionID.LIVE_DATA */, node_simconnect_1.SimConnectConstants.OBJECT_ID_USER, node_simconnect_1.SimConnectPeriod.SIM_FRAME);
        handle.on('simObjectData', recvSimObjectData => {
            if (recvSimObjectData.requestID === 0 /* RequestID.LIVE_DATA */) {
                const position = (0, node_simconnect_1.readLatLonAlt)(recvSimObjectData.data);
                const airspeed = recvSimObjectData.data.readInt32();
                const verticalSpeed = recvSimObjectData.data.readInt32();
                const heading = recvSimObjectData.data.readInt32();
                const landingLight = recvSimObjectData.data.readInt32() === 1;
                console.log({
                    // Read order is important
                    position,
                    airspeed,
                    verticalSpeed,
                    heading,
                    landingLight,
                });
            }
        });
    })
        .catch(function (error) {
        console.log('Connection failed:', error);
    });
}
exports.getSimEnvironment = getSimEnvironment;
