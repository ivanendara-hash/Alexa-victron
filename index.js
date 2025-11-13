import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// === CONFIGURACIÓN VRM ===
const VRM_INSTALLATION_ID = "761526"; // tu ID numérico
const VRM_TOKEN = "96444887b101b7adce42716e3b3a7badefb2f3ef28f3e57ba78b3afda1efd750";

// Endpoint principal para Alexa
app.post("/", async (req, res) => {
  try {
    // Solicita datos del sistema desde VRM
    const response = await fetch(
      `https://vrmapi.victronenergy.com/v2/installations/${VRM_INSTALLATION_ID}/system-overview`,
      {
        headers: {
          "X-Authorization": `Bearer ${VRM_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const vrmData = await response.json();
    const system = vrmData?.records || {};

    // Extraer datos clave
    const soc = system.battery?.stateOfCharge?.value || 0;
    const solarPower = system.solar?.power || 0;

    const mensaje = `Tu batería está al ${soc.toFixed(
      0
    )} por ciento y tus paneles están produciendo ${solarPower.toFixed(
      0
    )} vatios.`;

    // === RESPUESTA PARA ALEXA ===
    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: mensaje,
        },
        shouldEndSession: true,
      },
    });
  } catch (error) {
    console.error("❌ Error al comunicar con VRM:", error.message);

    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "No puedo obtener los datos de tu sistema Victron en este momento. Verifica la conexión con VRM.",
        },
        shouldEndSession: true,
      },
    });
  }
});

app.listen(3000, () =>
  console.log("✅ Alexa bridge conectado correctamente a VRM en puerto 3000")
);
