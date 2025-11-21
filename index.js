import express from 'express';

const app = express();
const port = 3000;

app.use(express.json());

// Función de depuración
function debugLog(msg, data) {
    console.log(`[DEBUG] ${msg}:`, JSON.stringify(data, null, 2));
}

// Ruta principal para Alexa
app.post('/alexa', (req, res) => {
    debugLog('Solicitud recibida de Alexa', req.body);

    // Ejemplo de datos desde Node-RED
    // Asegúrate que tus datos estén en global context de Node-RED
    const batteryData = global.get('batteryData') || {
        soc: 0,
        voltage: 0,
        current: 0
    };
    debugLog('Datos de batería obtenidos de Node-RED', batteryData);

    // Respuesta para Alexa
    const response = {
        version: '1.0',
        response: {
            outputSpeech: {
                type: 'PlainText',
                text: `El estado de la batería es: ${batteryData.soc}% de carga, ${batteryData.voltage} voltios, ${batteryData.current} amperios.`
            },
            shouldEndSession: true
        }
    };

    debugLog('Respuesta enviada a Alexa', response);
    res.json(response);
});

// Puedes añadir más rutas si quieres consultar inversor, paneles, etc.

app.listen(port, () => {
    console.log(`Servidor Alexa Victron escuchando en puerto ${port}`);
});
