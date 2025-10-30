import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// === CONFIGURACIÓN DEL SISTEMA VICRON ===
const VRM_ID = "c0619ab8974d";  // ID del portal VRM
const VRM_TOKEN = "9aaa6f1a858d3c26ec9813ac490561010713500a3854b1d1df94756cbde16625"; // Token de API

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

// === FUNCIÓN PARA EXTRAER SOC Y POTENCIA SOLAR DE VRM ===
function extractData(vrmData) {
  let soc = null;
  let solarPower = null;

  // Si los datos vienen en "devices"
  if (vrmData.devices && Array.isArray(vrmData.devices)) {
    vrmData.devices.forEach((device) => {
      if (device.class?.includes("battery")) {
        soc = device.soc || device.stateOfCharge || null;
      }
      if (device.class?.includes("solar-charger")) {
        solarPower = device.power || device.yieldToday || null;
      }
    });
  }

  // Si los datos vienen en "battery" o "solar"
  if (!soc && vrmData.battery) soc = vrmData.battery.soc || null;
  if (!solarPower && vrmData.solar) solarPower = vrmData.solar.power || null;

  return { soc, solarPower };
}

// === HANDLER DE ALEXA ===
app.post("/alexa", async (req, res) => {
  const request = req.body.request;
  let speechText = "No entendí tu solicitud.";

  try {
    if (request.type === "LaunchRequest") {
      speechText =
        "Bienvenido a tu sistema Victron Solar. Puedes preguntarme el nivel de batería o la producción solar actual.";
    }

    if (request.type === "IntentRequest") {
      const intent = request.intent.name;
      const vrmData = await getVRMData();
      const { soc, solarPower } = extractData(vrmData);

      if (intent === "BatteryStatusIntent" || intent === "BateriaIntent") {
        speechText = soc
          ? `El nivel de batería es ${soc.toFixed(0)} por ciento.`
          : "No pude leer el estado de la batería.";
      }

      if (intent === "SolarIntent") {
        speechText = solarPower
          ? `La producción solar actual es de ${solarPower.toFixed(0)} vatios.`
          : "No pude obtener los datos de energía solar.";
      }

      if (intent === "SystemStatusIntent" || intent === "SistemaIntent") {
        speechText =
          soc && solarPower
            ? `El sistema funciona correctamente. La batería está al ${soc.toFixed(
                0
              )} por ciento y la producción solar es de ${solarPower.toFixed(
                0
              )} vatios.`
            : "No pude leer el estado completo del sistema.";
      }
    }
  } catch (error) {
    console.error("Error en Alexa handler:", error);
    speechText =
      "Hubo un problema al conectar con tu sistema Victron o la API VRM.";
  }

  const response = {
    version: "1.0",
    response: {
      outputSpeech: { type: "PlainText", text: speechText },
      shouldEndSession: true,
    },
  };

  res.json(response);
});

app.listen(PORT, () =>
  console.log(`🚀 Alexa-Victron corriendo correctamente en puerto ${PORT}`)
);
