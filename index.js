import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

// Función helper para hablar
function speak(text, end = true) {
  return {
    version: "1.0",
    response: {
      outputSpeech: { type: "PlainText", text },
      shouldEndSession: end
    }
  };
}

// -----------------------------
// ❇️ MANEJO DE LA SKILL ALEXA
// -----------------------------
app.post("/", async (req, res) => {
  try {
    const request = req.body.request;

    // -----------------------------
    // 🔵 LAUNCH REQUEST
    // -----------------------------
    if (request.type === "LaunchRequest") {
      return res.json(
        speak(
          "Hola Iván, tu sistema Victron está conectado. ¿Qué deseas consultar?",
          false // sesión abierta
        )
      );
    }

    // -----------------------------
    // 🔵 INTENTS
    // -----------------------------
    if (request.type === "IntentRequest") {
      const intent = request.intent.name;

      switch (intent) {
        case "BateriaIntent":
          return res.json(speak("El nivel actual de batería es del 82 por ciento."));

        case "SolarIntent":
          return res.json(speak("La producción solar actual es de 940 vatios."));

        case "CargasIntent":
          return res.json(speak("Las cargas actuales están consumiendo 410 vatios."));

        case "ProduccionIntent":
          return res.json(speak("Hoy has producido 3.8 kilovatios hora."));

        case "ConsumoIntent":
          return res.json(speak("El consumo de tu casa hoy es de 2.9 kilovatios hora."));

        case "EstadoIntent":
          return res.json(speak("El sistema está funcionando en modo inversor sin fallas."));

        case "ModoIntent":
          return res.json(speak("El inversor está en modo normal, sin asistencia de red."));

        case "ArrancarIntent":
          return res.json(speak("Listo, el inversor se está encendiendo."));

        case "ApagarIntent":
          return res.json(speak("Entendido, apagando el inversor."));

        default:
          return res.json(speak("Lo siento Iván, no entendí ese comando.", false));
      }
    }

    // -----------------------------
    // OTRO TIPO DE REQUEST
    // -----------------------------
    return res.json(speak("Comando no reconocido.", true));

  } catch (error) {
    console.error("ERROR EN BACKEND:", error);
    return res.json(speak("Hubo un problema procesando la solicitud.", true));
  }
});

// -----------------------------
// SERVIDOR
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor Alexa escuchando en puerto " + PORT));
