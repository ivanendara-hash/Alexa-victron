// ===============================
// SERVIDOR ALEXA – VICTRON
// ===============================
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

// ===============================
// Variables para almacenar datos reales desde Node-RED
// ===============================
let globalVictronData = {
  soc: null,
  solar: null,
  system: "OK"
};

// ===============================
// Endpoint que Node-RED usa para enviar datos reales
// ===============================

app.post("/victron", (req, res) => {
  try {
    if (req.body.soc !== undefined) globalVictronData.soc = req.body.soc;
    if (req.body.solar !== undefined) globalVictronData.solar = req.body.solar;
    if (req.body.system !== undefined) globalVictronData.system = req.body.system;

    console.log("Datos recibidos desde Victron/NodeRED:", globalVictronData);
    res.json({ status: "OK" });

  } catch (err) {
    console.error("Error recibiendo datos:", err);
    res.status(500).json({ error: "Error al procesar datos" });
  }
});

// ===============================
// Función para responder a Alexa
// ===============================

function speak(text) {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text
      },
      shouldEndSession: true
    }
  };
}

// ===============================
// ENDPOINT PRINCIPAL PARA ALEXA
// ===============================

app.post("/alexa", (req, res) => {
  try {
    const request = req.body.request;

    console.log(">>> Alexa Request:", JSON.stringify(req.body, null, 2));

    // ---------------------------
    // 1. LaunchRequest (Abrir Skill)
    // ---------------------------
    if (request.type === "LaunchRequest") {
      return res.json(
        speak("Bienvenido Iván. Tu sistema Victron está conectado correctamente.")
      );
    }

    // ---------------------------
    // 2. IntentRequest
    // ---------------------------
    if (request.type === "IntentRequest") {

      const intent = request.intent.name;
      console.log(">>> Intent recibido:", intent);

      // ===============================================
      // 🔋 INTENT: BateriaIntent
      // ===============================================
      if (intent === "BateriaIntent") {
        const soc = globalVictronData.soc;

        if (soc === null || soc === undefined) {
          return res.json(speak("No puedo leer el nivel de batería en este momento."));
        }

        return res.json(
          speak(`El nivel de batería es ${soc} por ciento.`)
        );
      }

      // ===============================================
      // 🌞 INTENT: SolarIntent
      // ===============================================
      if (intent === "SolarIntent") {
        const solar = globalVictronData.solar;

        if (solar === null || solar === undefined) {
          return res.json(speak("No puedo leer la producción solar ahora mismo."));
        }

        return res.json(
          speak(`La producción solar actual es de ${solar} watts.`)
        );
      }

      // ===============================================
      // 💡 INTENT: SistemaIntent
      // ===============================================
      if (intent === "SistemaIntent") {
        return res.json(
          speak(`El sistema Victron está funcionando correctamente. Estado: ${globalVictronData.system}.`)
        );
      }

      // ===============================================
      // INTENTS AMAZON genéricos
      // ===============================================
      if (intent === "AMAZON.HelpIntent") {
        return res.json(
          speak("Puedes preguntarme el nivel de batería, la producción solar o el estado del sistema.")
        );
      }

      if (intent === "AMAZON.CancelIntent" || intent === "AMAZON.StopIntent") {
        return res.json(speak("Hasta luego Iván."));
      }
    }

    // ---------------------------
    // Si Alexa envía otra cosa
    // ---------------------------
    return res.json(speak("Lo siento, no entendí la solicitud."));

  } catch (err) {
    console.error("ERROR en /alexa:", err);
    return res.json(
      speak("Ocurrió un error procesando la solicitud de Alexa.")
    );
  }
});

// ===============================
// INICIO DEL SERVIDOR
// ===============================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor Alexa Victron iniciado en el puerto " + PORT);
});
