import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Función generadora de respuestas para Alexa
function speak(text) {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text: text
      },
      shouldEndSession: false
    }
  };
}

app.post("/", (req, res) => {
  console.log("🔔 Solicitud recibida desde Alexa:");
  console.log(JSON.stringify(req.body, null, 2));

  const request = req.body.request;

  // Cuando el usuario dice: "Alexa, abre Victron"
  if (request.type === "LaunchRequest") {
    return res.json(
      speak("Bienvenido Iván. Tu sistema Victron está conectado correctamente.")
    );
  }

  // Procesar intents personalizados
  if (request.type === "IntentRequest") {
    const intent = request.intent.name;

    if (intent === "EstadoBateriaIntent") {
      return res.json(
        speak("La batería está al noventa por ciento. Todo funcionando normal.")
      );
    }

    if (intent === "ProduccionSolarIntent") {
      return res.json(
        speak("Estás produciendo ochocientos vatios de tus paneles solares.")
      );
    }

    // Intent desconocido
    return res.json(
      speak("No entendí ese comando. Intenta otra consulta sobre Victron.")
    );
  }

  // Cualquier otra cosa
  return res.json(
    speak("No pude procesar la solicitud. Inténtalo otra vez.")
  );
});

// Puerto Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Alexa Victron iniciado en el puerto ${PORT}`);
});
