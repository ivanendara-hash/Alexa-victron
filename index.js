import express from "express";
const app = express();
app.use(express.json());

app.post("/", async (req, res) => {
  const intentName = req.body?.request?.intent?.name || "";
  let responseText = "No entendí tu solicitud.";

  if (intentName === "BateriaIntent") {
    responseText = "El nivel actual de la batería es del 78 %.";
  } else if (intentName === "SolarIntent") {
    responseText = "Tu sistema Victron está generando 540 W de energía solar.";
  } else if (intentName === "SistemaIntent") {
    responseText = "Todo el sistema Victron funciona correctamente.";
  }

  const response = {
    version: "1.0",
    response: {
      shouldEndSession: true,
      outputSpeech: {
        type: "PlainText",
        text: responseText
      }
    }
  };
  res.json(response);
});

app.listen(3000, () => console.log("🚀 Alexa-Victron corriendo en puerto 3000"));
