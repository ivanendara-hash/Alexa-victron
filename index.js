import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// === URL de tu Node-RED remoto ===
const NODERED_URL = "https://761526-nodered.proxyrelay12.victronenergy.com/alexa";

app.post("/alexa", async (req, res) => {
  console.log("📩 Petición recibida desde Alexa Skill");

  try {
    // Reenviar la petición al flujo de Node-RED
    const respuesta = await fetch(NODERED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const texto = await respuesta.text();

    // --- Manejar errores comunes del proxy Victron ---
    if (texto.includes("Not authorized") || texto.includes("lost") || texto.includes("expired")) {
      console.error("⚠️ El túnel VRM se desconectó o expiró.");
      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: "El sistema Victron no está disponible en este momento. Por favor, revisa la conexión remota en VRM.",
          },
          shouldEndSession: true,
        },
      });
    }

    // --- Intentar parsear JSON válido ---
    let json;
    try {
      json = JSON.parse(texto);
    } catch (e) {
      console.error("⚠️ Respuesta de Node-RED no es JSON válido:", texto);
      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: "El sistema Victron respondió con un formato inesperado.",
          },
          shouldEndSession: true,
        },
      });
    }

    // --- Enviar respuesta limpia a Alexa ---
    console.log("📤 Respuesta enviada a Alexa:", JSON.stringify(json.response.outputSpeech.text));
    res.json(json);

  } catch (error) {
    console.error("❌ Error reenviando a Node-RED:", error);
    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "No se pudo contactar al sistema Victron. Verifica la conexión.",
        },
        shouldEndSession: true,
      },
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Alexa-Victron activo en puerto ${PORT}`);
  console.log(`🌐 Reenviando peticiones a Node-RED en: ${NODERED_URL}`);
  console.log("✅ Backend listo para Alexa");
});
