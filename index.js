const express = require("express");
 const app = express();

app.use(express.json());

function speak(text, end = true) {
  return {
   version: "1.0",
    response: {
      outputSpeech: { type: "PlainText", text },
      shouldEndSession: end
    }
  };
}

app.post("/", async (req, res) => {
  console.log("====== ALEXA REQUEST ======");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const request = req.body.request;

    if (request.type === "LaunchRequest") {
      return res.json(
        speak("Hola Iván, tu sistema Victron está listo. ¿Qué deseas consultar?", false)
      );
    }

    if (request.type === "IntentRequest") {
      const intent = request.intent.name;

      switch (intent) {
        case "BateriaIntent":
          return res.json(speak("El nivel actual de batería es del 82 por ciento."));
        case "SolarIntent":
          return res.json(speak("La producción solar actual es de 940 vatios."));
        case "SistemaIntent":
          return res.json(speak("El sistema Victron funciona normalmente."));
        default:
          return res.json(speak("No entendí ese comando.", true));
      }
    }

    return res.json(speak("Comando no reconocido.", true));

  } catch (error) {
    console.error("ERROR:", error);
    return res.json(speak("Hubo un problema procesando la solicitud."));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Servidor Alexa escuchando en puerto " + PORT)
);
