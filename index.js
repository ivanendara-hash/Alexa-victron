import express from 'express';
import bodyParser from 'body-parser';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const RED = require('node-red'); // Solo si necesitas interactuar con la instancia Node-RED
const app = express();
app.use(bodyParser.json());

const PORT = 3000;

// Función para leer datos de Node-RED
const getNodeRedData = () => {
    // Ajusta estos nombres a los que tienes en tu flujo
    const SOC = global.get('SOC_Bat') || 0;    // Estado de batería
    const PV = global.get('PV_Power') || 0;    // Producción solar
    return { SOC, PV };
};

app.post('/alexa', (req, res) => {
    const requestType = req.body.request.type;

    if (requestType === 'LaunchRequest') {
        return res.json({
            version: '1.0',
            response: {
                outputSpeech: {
                    type: 'PlainText',
                    text: 'Hola! Pregúntame sobre el estado de la batería o la producción solar.'
                },
                shouldEndSession: false
            }
        });
    } else if (requestType === 'IntentRequest') {
        const intentName = req.body.request.intent.name;
        const { SOC, PV } = getNodeRedData();

        let speechText = '';

        if (intentName === 'BatteryIntent') {
            speechText = `El estado de la batería es ${SOC}%`;
        } else if (intentName === 'SolarIntent') {
            speechText = `La producción solar actual es de ${PV} vatios`;
        } else {
            speechText = 'No entiendo tu solicitud, prueba preguntando por la batería o la producción solar.';
        }

        return res.json({
            version: '1.0',
            response: {
                outputSpeech: {
                    type: 'PlainText',
                    text: speechText
                },
                shouldEndSession: false
            }
        });
    } else if (requestType === 'SessionEndedRequest') {
        console.log('Session ended:', req.body.request.reason);
        return res.sendStatus(200);
    } else {
        return res.sendStatus(400);
    }
});

app.listen(PORT, () => {
    console.log(`Servidor Alexa Victron escuchando en puerto ${PORT}`);
});
