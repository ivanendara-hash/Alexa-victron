import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// ------------------ Helper para Alexa ------------------
function speak(text) {
  return {
    version: "1.0",
    response: {
      outputSpeech: { type: "PlainText", text },
      shouldEndSession: true
    }
  };
}

// ------------------ ENDPOINT ALEXA ------------------
app.post("/alexa", async (req, res) => {
  console.log("====== ALEXA REQUEST ======");
  console.log(JSON.stringify(req.body, null, 2));

  const request = req.body.request;

  // ----------- LaunchRequest -----------
  if (request.type === "LaunchRequest") {
    return res.json(
      speak("Bienvenido Iván. Tu sistema Victron está conectado correctamente.")
    );
  }

  // ----------- IntentRequest -----------
  if (request.type === "IntentRequest") {
    const intent = request.intent.name.toLowerCase();
    console.log("➡️ Intent recibido:", intent);

    try {
      // --- Leer datos de Node-RED ---
      const NODERED_ENDPOINT = process.env.NODERED_ENDPOINT;
      if NODERED_ENDPOINT = https://761526-nodered.proxyrelay4.victronenergy.com/nodered-data;

      const response = await axios.get(`${NODERED_ENDPOINT}`);
      const soc = response.data.soc ?? 0;
      const pv = response.data.pv ?? 0;

      // --- Determinar respuesta según intent ---
      let texto = "";
      if (intent.includes("bateria") || intent.includes("battery") || intent.includes("soc")) {
        texto = `El nivel de batería es del ${soc} por ciento.`;
      } else if (intent.includes("solar") || intent.includes("produccion") || intent.includes("pv")) {
        texto = `La producción solar es de ${pv} vatios en este momento.`;
      } else {
        texto = `La batería está al ${soc}% y la producción solar es de ${pv}W.`;
      }

      return res.json(speak(texto));
    } catch (e) {
      console.error("❌ Error consultando Node-RED:", e.message);
      return res.json(speak("No pude obtener los datos del sistema Victron en este momento."));
    }
  }

  return res.json(speak("Solicitud desconocida."));
});

// ------------------ PUERTO ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor Alexa Victron escuchando en puerto " + PORT);
});
