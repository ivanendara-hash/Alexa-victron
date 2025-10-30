import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// === CONFIGURACIÓN ===
const VRM_ID = "c0619ab8974d";  // ID VRM
const VRM_TOKEN = "9aaa6f1a858d3c26ec9813ac490561010713500a3854b1d1df94756cbde16625"; // Token API

// === OBTENER DATOS DE WIDGETS (SOC y Potencia Solar) ===
async function getVRMData() {
  const url = `https://vrmapi.victronenergy.com/v2/installations/${VRM_ID}/widgets`;
  const response = await fetch(url, {
    headers: { "X-Authorization": `Bearer ${VRM_TOKEN}` },
  });

  const data = await response.json();
  if (!data.success) throw new Error("Error al obtener datos del VRM");

  let soc = null;
  let solarPower = null;

  // Buscar widgets con datos relevantes
  for (const widget of data.records) {
    if (widget.idDataAttribute && widget.idDataAttribute.includes("/Soc")) {
      soc = widget.formattedValue || widget.rawValue || null;
    }
    if (widget.idDataAttribute && widget.idDataAttribute.includes("/Yield/Power")) {
      solarPower = widget.formattedValue || widget.rawValue || null;
    }
  }

  return { soc, solarPower };
}

// === ALEXA HANDLER ===
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
      const { soc, solarPower } = await getVRMData();

      if (intent === "BatteryStatusIntent" || intent === "BateriaIntent") {
        speechText = soc
          ? `El nivel de batería es ${soc.replace("%", "")} por ciento.`
          : "No pude leer el estado de la batería.";
      }

      if (intent === "SolarIntent") {
        speechText = solarPower
          ? `La producción solar actual es de ${solarPower.replace("W", "")} vatios.`
          : "No pude obtener los datos de energía solar.";
      }

      if (intent === "SystemStatusIntent" || intent === "SistemaIntent") {
        if (soc && solarPower) {
          speechText = `El sistema funciona correctamente. La batería está al ${soc.replace(
            "%",
            ""
          )} por ciento y la producción solar es de ${solarPower.replace(
            "W",
            ""
          )} vatios.`;
        } else {
          speechText = "No pude leer el estado completo del sistema.";
        }
      }
    }
  } catch (error) {
    console.error("Error en Alexa handler:", error);
    speechText = "Hubo un problema al conectar con tu sistema Victron o la API VRM.";
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
  console.log(`🚀 Alexa-Victron corriendo en puerto ${PORT}`)
);
