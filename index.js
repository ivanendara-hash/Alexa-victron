import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODERED_URL = "https://761526-nodered.proxyrelay12.victronenergy.com/alexa";

app.post("/alexa", async (req, res) => {
  console.log("📩 Petición recibida desde Alexa Skill");

  try {
    const respuesta = await fetch(NODERED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const texto = await respuesta.text();
    console.log("📥 Texto devuelto por Node-RED:", texto.substring(0, 80));

    // Si Node-RED devuelve texto simple, lo tratamos sin romper el backend
    if (!texto || texto.startsWith("Not ") || texto.startsWith("<")) {
      console.error("⚠️ Node-RED devolvió texto no válido o no autorizado");
      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: "El flujo de Node-RED no respondió correctamente. Revisa la ruta /alexa en tu flujo.",
          },
          shouldEndSession: true,
        },
      });
    }

    // Intentar convertir a JSON
    let json;
    try {
      json = JSON.parse(texto);
    } catch (e) {
      console.error("⚠️ Error parseando JSON:", e);
      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: "El formato de respuesta de Node-RED no es válido.",
          },
          shouldEndSession: true,
        },
      });
    }

    console.log("📤 Respuesta válida de Node-RED:", json.response?.outputSpeech?.text);
    res.json(json);

  } catch (error) {
    console.error("❌ Error general:", error);
    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "No se pudo contactar a Node-RED.",
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
