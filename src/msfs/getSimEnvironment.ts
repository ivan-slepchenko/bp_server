import {
    open,
    Protocol,
    readLatLonAlt,
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

export function getSimEnvironment() {
    const EVENT_ID_PAUSE = 1;

    open('Beardy Sim Connect Client', Protocol.FSX_SP2)
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
                    const position = readLatLonAlt(recvSimObjectData.data);
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