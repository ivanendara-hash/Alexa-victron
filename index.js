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

// ------------------ ENDPOINT PARA ALEXA ------------------
app.post("/alexa", async (req, res) => {
  console.log("====== ALEXA REQUEST ======");
  console.log(JSON.stringify(req.body, null, 2));

  const request = req.body.request;
  if (!request) return res.json(speak("Solicitud inválida."));

  // LaunchRequest
  if (request.type === "LaunchRequest") {
    return res.json(
      speak("Bienvenido Iván. Tu sistema Victron está conectado correctamente.")
    );
  }

  // IntentRequest
  if (request.type === "IntentRequest") {
    const intent = request.intent.name.toLowerCase();
    console.log("➡️ Intent recibido:", intent);

    try {
      // --- CONSULTA NODE-RED ---
      const NODERED_ENDPOINT = process.env.NODERED_ENDPOINT;
      if (!NODERED_ENDPOINT)
        throw new Error("Falta la variable de entorno NODERED_ENDPOINT");

      const nodeRedData = await axios.get(NODERED_ENDPOINT);
      const soc = Math.round(nodeRedData.data.soc ?? 0);
      const pv = Math.round(nodeRedData.data.pv ?? 0);
      const load = Math.round(nodeRedData.data.load ?? 0);

      let texto = "";

      if (intent.includes("bateria")) {
        texto = `El nivel de batería es del ${soc} por ciento.`;
      } else if (intent.includes("solar")) {
        texto = `La producción solar es de ${pv} vatios.`;
      } else if (intent.includes("sistema")) {
        texto = `Batería al ${soc}%. Solar ${pv}W. Cargas ${load}W.`;
      } else {
        texto = `La batería está al ${soc}% y la producción solar es de ${pv}W.`;
      }

      return res.json(speak(texto));

    } catch (e) {
      console.error("❌ Error consultando Node-RED:", e.message);
      return res.json(
        speak("No pude obtener los datos del sistema Victron en este momento.")
      );
    }
  }

  return res.json(speak("Solicitud desconocida."));
});

// ------------------ PUERTO ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor Alexa Victron escuchando en puerto " + PORT);
});
