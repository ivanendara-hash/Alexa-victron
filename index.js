import express from "express"; 
import fetch from "node-fetch";

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

// URL de tu Node-RED en tu casa/servidor Victron
const NODE_RED_URL = process.env.NODE_RED_URL; 
// Ejemplo: http://192.168.1.100:1880/victron-data

app.post("/", async (req, res) => {
  console.log("====== ALEXA REQUEST ======");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const { request } = req.body;

    // ***** LaunchRequest *****
    if (request.type === "LaunchRequest") {
      return res.json(
        speak("Hola Iván, tu sistema Victron está listo para darte información.", false)
      );
    }

    // ***** IntentRequest *****
    if (request.type === "IntentRequest") {
      const intent = request.intent.name;

      // Llamar a Node-RED:
      const data = await fetch(NODE_RED_URL).then(r => r.json());

      if (intent === "BateriaIntent") {
        return res.json(
          speak(`El estado de la batería es ${data.soc}%`, true)
        );
      }

      if (intent === "SolarIntent") {
        return res.json(
          speak(`La producción solar actual es ${data.solar} vatios`, true)
        );
      }

      if (intent === "SistemaIntent") {
        return res.json(
          speak(`El consumo actual es ${data.load} vatios`, true)
        );
      }

      return res.json(speak("No entendí ese comando.", true));
    }

    // Otro tipo de request
    return res.json(speak("No pude procesar la solicitud.", true));
  } catch (err) {
    console.error("ERROR:", err);
    return res.json(
      speak("Hubo un problema obteniendo los datos del sistema Victron.")
    );
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Servidor Alexa escuchando en puerto " + PORT)
);
