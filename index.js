import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// === CONFIGURACIÓN VRM ===
const VRM_INSTALLATION_ID = "761526";
const VRM_TOKEN = "e928db2f99325349a62acdf5e61f51b8187a07dd45515be4bd2703357b235809"; 

// ==============================
//      ENDPOINT PRINCIPAL
// ==============================
app.post("/", async (req, res) => {

  const alexaReq = req.body;

  // ---- 1) LaunchRequest ----
  if (alexaReq?.request?.type === "LaunchRequest") {
    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Bienvenido Iván. Tu sistema Victron está listo. ¿Qué deseas saber?"
        },
        shouldEndSession: false
      }
    });
  }

  // ---- 2) IntentRequest (consultas del sistema) ----
  try {
    const response = await fetch(
      `https://vrmapi.victronenergy.com/v2/installations/${VRM_INSTALLATION_ID}/system-overview`,
      {
        headers: {
          "X-Authorization": `Bearer ${VRM_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const vrmData = await response.json();
    const system = vrmData?.records || {};

    const soc = system.battery?.stateOfCharge?.value || 0;
    const solarPower = system.solar?.power || 0;

    const mensaje = `Tu batería está al ${soc.toFixed(0)} por ciento y tus paneles producen ${solarPower.toFixed(0)} vatios.`;

    return res.json({
      version: "1.0",
      response: {
        outputSpeech: { type: "PlainText", text: mensaje },
        shouldEndSession: true
      }
    });

  } catch (error) {
    console.error("❌ Error VRM:", error.message);

    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "No puedo obtener datos de VRM en este momento."
        },
        shouldEndSession: true
      }
    });
  }
});

// Servidor
app.listen(3000, () =>
  console.log("✅ Alexa bridge conectado correctamente a VRM en puerto 3000")
);
