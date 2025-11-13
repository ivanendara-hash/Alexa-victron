import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// URL local de tu Cerbo GX (Node-RED)
const CERBO_URL = "http://192.168.1.50:1881/alexa";

app.post("/", async (req, res) => {
  try {
    // Envía la solicitud desde Render hacia Node-RED
    const response = await fetch(CERBO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("❌ Error al comunicar con el Cerbo GX:", error.message);
    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "No puedo comunicarme con tu sistema Victron en este momento. Verifica la conexión en VRM."
        },
        shouldEndSession: true,
      },
    });
  }
});

app.listen(3000, () => console.log("✅ Alexa bridge activo en puerto 3000"));
