const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

// Función helper para respuestas Alexa
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
// ------- RENDER ------- //
app.post("/alexa", async (req, res) => {
  console.log("====== ALEXA REQUEST ======");
  console.log(JSON.stringify(req.body, null, 2));

// ------- ENDPOINT PRINCIPAL ALEXA ------- //
app.post("/alexa", async (req, res) => {
  const request = req.body.request;

  // ---------------- LaunchRequest ----------------
  if (request.type === "LaunchRequest") {
    return res.json(
      speak("Bienvenido Iván. Tu sistema Victron está conectado correctamente.")
    );
  }

  // ---------------- IntentRequest ----------------
  if (request.type === "IntentRequest") {
    const intent = request.intent.name;

    // ---------------- BATERÍA ----------------
    if (intent === "BateriaIntent") {
      try {
        const data = await axios.get(process.env.VICTRON_ENDPOINT + "/battery");
        const soc = data.data.soc;

        if (!soc && soc !== 0) {
          return res.json(speak("No pude obtener el nivel de batería."));
        }

        return res.json(speak(`El nivel de batería es ${soc} por ciento.`));
      } catch (error) {
        return res.json(
          speak("No logré consultar la batería en este momento.")
        );
      }
    }

    // ---------------- SOLAR ----------------
    if (intent === "SolarIntent") {
      try {
        const data = await axios.get(process.env.VICTRON_ENDPOINT + "/solar");
        const watts = data.data.watts;

        if (!watts && watts !== 0) {
          return res.json(speak("No pude obtener la producción solar."));
        }

        return res.json(
          speak(`La producción solar actual es de ${watts} vatios.`)
        );
      } catch (error) {
        return res.json(
          speak("No logré consultar la producción solar en este momento.")
        );
      }
    }

    // ---------------- SISTEMA COMPLETO ----------------
    if (intent === "SistemaIntent") {
      try {
        const data = await axios.get(process.env.VICTRON_ENDPOINT + "/status");

        const soc = data.data.soc;
        const solar = data.data.solar;
        const load = data.data.load;

        return res.json(
          speak(
            `La batería está al ${soc} por ciento. ` +
              `Producción solar actual ${solar} vatios. ` +
              `Cargas conectadas consumiendo ${load} vatios.`
          )
        );
      } catch (error) {
        return res.json(
          speak("No logré consultar el estado general del sistema.")
        );
      }
    }

    // ---------------- Default ----------------
    return res.json(speak("No entendí esa solicitud."));
  }

  return res.json(speak("Solicitud desconocida."));
});

// Puerto Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor Alexa Victron escuchando en puerto " + PORT);
});
