// index.js
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = 3000;

// URL de VRM donde puedes consultar el estado de la batería
// Reemplaza TOKEN y SYSTEM_ID con los de tu cuenta VRM
const VRM_URL = "https://vrmapi.victronenergy.com/v2/systems/SYSTEM_ID/overview";
const VRM_TOKEN = "TU_TOKEN_DE_VRM";

app.post("/alexa", async (req, res) => {
  try {
    const intentName = req.body?.request?.intent?.name;

    if (intentName === "EstadoBateriaIntent") {
      // Consultar datos reales desde VRM
      const responseVRM = await fetch(VRM_URL, {
        headers: {
          Authorization: `Bearer ${VRM_TOKEN}`,
        },
      });

      const vrmData = await responseVRM.json();

      // Extraemos SOC y voltaje de la batería
      const battery = vrmData?.data?.battery;
      const soc = battery?.soc || 0;
      const voltage = battery?.voltage || 0;

      const speakOutput = `La batería está al ${soc}% de carga, con un voltaje de ${voltage} voltios.`;

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

    // Respuesta por defecto si el intent no coincide
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
    console.error("Error al consultar VRM:", err);

    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Ocurrió un error al obtener los datos de la batería desde VRM.",
        },
        shouldEndSession: true,
      },
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Alexa Victron escuchando en puerto ${PORT}`);
});
