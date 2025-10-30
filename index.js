import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// === CONFIGURACIÓN DE TU SISTEMA VICRON ===
const VRM_ID = "c0619ab8974d";  // Tu ID de portal VRM
const VRM_TOKEN = "9aaa6f1a858d3c26ec9813ac490561010713500a3854b1d1df94756cbde16625"; // Token de API VRM

// === FUNCIÓN PARA OBTENER DATOS DEL VRM ===
async function getVRMData() {
  const url = `https://vrmapi.victronenergy.com/v2/installations/${VRM_ID}/system-overview`;
  const response = await fetch(url, {
    headers: { "X-Authorization": `Bearer ${VRM_TOKEN}` },
  });
  const data = await response.json();

  if (!data.success) throw new Error("Error al obtener datos del VRM");
  return data.records;
}

// === RESPUESTA ALEXA ===
app.post("/alexa", async (req, res) => {
  const request = req.body.request;
  let speechText = "No entendí tu solicitud.";

  try {
    if (request.type === "LaunchRequest") {
      speechText = "Bienvenido a tu sistema Victron Solar. Puedes preguntarme el nivel de batería o la producción solar actual.";
    }

    if (request.type === "IntentRequest") {
      const intent = request.intent.name;
      const vrmData = await getVRMData();

      // Estado de batería
      if (intent === "BatteryStatusIntent" || intent === "BateriaIntent") {
        const soc = vrmData.battery?.soc || vrmData.battery?.stateOfCharge || null;
        speechText = soc ? `El nivel de batería es ${soc.toFixed(0)} por ciento.` : "No pude leer el estado de la batería.";
      }

      // Energía solar
      if (intent === "SolarIntent") {
        const solar = vrmData.solar?.power || vrmData.pv?.power || null;
        speechText = solar ? `La producción solar actual es de ${solar.toFixed(0)} vatios.` : "No pude obtener los datos de energía solar.";
      }

      // Estado general del sistema
      if (intent === "SystemStatusIntent" || intent === "SistemaIntent") {
        const soc = vrmData.battery?.soc || 0;
        const solar = vrmData.solar?.power || 0;
        speechText = `El sistema funciona correctamente. La batería está al ${soc.toFixed(0)} por ciento y la producción solar es de ${solar.toFixed(0)} vatios.`;
      }
    }
  } catch (error) {
    console.error("Error en Alexa handler:", error);
    speechText = "Hubo un problema al conectar con tu sistema Victron.";
  }

  const response = {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text: speechText,
      },
      shouldEndSession: true,
    },
  };

  res.json(response);
});

// === INICIO DEL SERVIDOR ===
app.listen(PORT, () => {
  console.log(`🚀 Alexa-Victron corriendo en puerto ${PORT}`);
});
