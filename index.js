import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const NODE_RED_URL = "https://761526-nodered.proxyrelay12.victronenergy.com/alexa";

// Endpoint principal que recibe las peticiones de Alexa
app.post("/alexa", async (req, res) => {
  console.log("📩 Petición recibida desde Alexa Skill");

  const body = req.body;
  let data;

  try {
    // Intentamos reenviar la petición al flujo de Node-RED
    const response = await fetch(NODE_RED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("⚠️ Respuesta no JSON de Node-RED:", text);
      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: "No puedo comunicarme con tu sistema Victron en este momento. Verifica la conexión en VRM.",
          },
          shouldEndSession: true,
        },
      });
    }

    console.log("📤 Respuesta de Node-RED enviada correctamente ✅");
    return res.json(data);

  } catch (error) {
    console.error("❌ Error reenviando a Node-RED:", error);
    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Hubo un problema al conectar con tu sistema Victron.",
        },
        shouldEndSession: true,
      },
    });
  }
});

// Endpoint simple para verificar desde el navegador
app.get("/", (req, res) => {
  res.send("✅ Servidor Alexa-Victron funcionando correctamente.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Alexa-Victron activo en puerto ${PORT}`);
  console.log(`🌐 Reenviando peticiones a Node-RED en: ${NODE_RED_URL}`);
  console.log("✅ Backend listo para Alexa");
});
