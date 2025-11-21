import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// ------------------ Helper para Alexa ------------------
function speak(text) {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text,
      },
      shouldEndSession: true,
    },
  };
}

// ------------------ ENDPOINT PRINCIPAL ------------------
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
    const intent = request.intent.name;
    console.log("➡️ Intent recibido:", intent);

    // ---- Batería ----
    if (intent === "BateriaIntent") {
      try {
        const data = await axios.get(`${process.env.VICTRON_ENDPOINT}/battery`);
        const soc = data.data.soc;

        if (soc === undefined || soc === null) {
          return res.json(speak("No pude obtener el nivel de batería."));
        }

        return res.json(speak(`El nivel de batería es ${soc} por ciento.`));
      } catch (e) {
        console.error("❌ Error BateriaIntent:", e.message);
        return res.json(
          speak("No logré consultar la batería en este momento.")
        );
      }
    }

    // ---- Solar ----
    if (intent === "SolarIntent") {
      try {
        const data = await axios.get(`${process.env.VICTRON_ENDPOINT}/solar`);
        const watts = data.data.watts;

        if (watts === undefined || watts === null) {
          return res.json(speak("No pude obtener la producción solar."));
        }

        return res.json(
          speak(`La producción solar actual es de ${watts} vatios.`)
        );
      } catch (e) {
        console.error("❌ Error SolarIntent:", e.message);
        return res.json(
          speak("No logré consultar la producción solar en este momento.")
        );
      }
    }

    // ---- Estado completo ----
    if (intent === "SistemaIntent") {
      try {
        const data = await axios.get(`${process.env.VICTRON_ENDPOINT}/status`);

        const soc = data.data.soc;
        const solar = data.data.solar;
        const load = data.data.load;

        return res.json(
          speak(
            `La batería está al ${soc} por ciento. ` +
              `Producción solar actual ${solar} vatios. ` +
              `Cargas consumiendo ${load} vatios.`
          )
        );
      } catch (e) {
        console.error("❌ Error SistemaIntent:", e.message);
        return res.json(
          speak("No logré consultar el estado general del sistema.")
        );
      }
    }

    // ---- Intent desconocido ----
    return res.json(speak("No entendí esa solicitud."));
  }

  return res.json(speak("Solicitud desconocida."));
});

// ------------------ Puerto ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor Alexa Victron escuchando en puerto " + PORT);
});
