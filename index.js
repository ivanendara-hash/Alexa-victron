// === Alexa-Victron Backend ===
// Versión estable final - Iván Endara

import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// URL del flujo Node-RED
const NODE_RED_URL = "https://761526-nodered.proxyrelay12.victronenergy.com/alexa";

// Ruta principal para Alexa Skill
app.post("/alexa", async (req, res) => {
  try {
    console.log("📩 Petición recibida desde Alexa Skill");

    // Reenviar al flujo de Node-RED
    const response = await fetch(NODE_RED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    // Obtener y reenviar respuesta a Alexa
    const data = await response.json();
    console.log("✅ Respuesta enviada desde Node-RED:", data.response?.outputSpeech?.text);
    res.json(data);

  } catch (error) {
    console.error("❌ Error reenviando a Node-RED:", error);
    res.status(500).json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Hubo un problema al comunicarme con el sistema Victron.",
        },
        shouldEndSession: true,
      },
    });
  }
});

// Servidor activo
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Alexa-Victron activo en puerto ${PORT}`);
  console.log(`🌐 Reenviando peticiones a Node-RED en: ${NODE_RED_URL}`);
  console.log("✅ Backend listo para Alexa");
});
