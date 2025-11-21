import express from "express";
import fetch from "node-fetch"; // npm install node-fetch@3

const app = express();
app.use(express.json());

const PORT = 3000;

// URL de tu endpoint en Node-RED que devuelve los datos reales
// Ejemplo: Node-RED Dashboard o endpoint HTTP que devuelve JSON con el estado de la batería
const NODE_RED_URL = "http://localhost:1880/alexa/battery"; 

app.post("/alexa", async (req, res) => {
  try {
    const { request } = req.body;

    if (request.type === "IntentRequest") {
      const intentName = request.intent.name;

      if (intentName === "EstadoBateriaIntent") {
        // Petición a Node-RED para obtener los datos reales
        const responseNR = await fetch(NODE_RED_URL);
        const dataNR = await responseNR.json();

        // Ejemplo: dataNR = { soc: 78, voltage: 51.2, current: 10 }
        const speakOutput = `La batería está al ${dataNR.soc}% de carga, con un voltaje de ${dataNR.voltage} voltios.`;

        return res.json({
          version: "1.0",
          response: {
            outputSpeech: {
              type: "PlainText",
              text: speakOutput,
            },
            shouldEndSession: true,
          },
        });
      }
    }

    // Default si no es el intent que queremos
    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "No entendí la solicitud.",
        },
        shouldEndSession: true,
      },
    });
  } catch (err) {
    console.error("Error en /alexa:", err);
    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Ocurrió un error al obtener los datos de la batería.",
        },
        shouldEndSession: true,
      },
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Alexa Victron escuchando en puerto ${PORT}`);
});
