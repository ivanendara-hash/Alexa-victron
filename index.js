import express from "express";
const app = express();
app.use(express.json());

// Ruta raíz opcional
app.get("/", (req, res) => {
  res.send("✅ Alexa-Victron backend activo");
});

// Ruta principal que recibe solicitudes de Alexa
app.post("/alexa", async (req, res) => {
  const request = req.body?.request;
  const intentName = request?.intent?.name || "";
  console.log("👉 Intent recibido:", intentName);

  let responseText = "No entendí tu solicitud.";

  // INTENTS personalizados
  if (intentName === "BateriaIntent") {
    responseText = "El nivel actual de la batería es del 78 %.";
  } else if (intentName === "SolarIntent") {
    responseText = "Tu sistema Victron está generando 540 W de energía solar.";
  } else if (intentName === "SistemaIntent") {
    responseText = "Todo el sistema Victron funciona correctamente.";
  }

  // Respuesta a Alexa
  const alexaResponse = {
    version: "1.0",
    response: {
      shouldEndSession: true,
      outputSpeech: {
        type: "PlainText",
        text: responseText
      }
    }
  };

  res.json(alexaResponse);
});

app.listen(3000, () => {
  console.log("🚀 Alexa-Victron corriendo en puerto 3000");
});
