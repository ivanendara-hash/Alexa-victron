import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// URL local del Node-RED en tu Cerbo GX
const CERBO_URL = "http://192.168.1.50:1881/alexa";

// ✅ Ruta de prueba para verificar que el endpoint esté activo
app.get("/alexa", (req, res) => {
  res.send("✅ Alexa endpoint activo en Render");
});

// ✅ Ruta que recibe peticiones desde Alexa
app.post("/alexa", async (req, res) => {
  try {
    // Reenvía la solicitud al Node-RED local
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
