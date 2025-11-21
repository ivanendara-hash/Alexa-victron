import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Endpoint raíz
app.get("/", (req, res) => {
  res.send("Victron Alexa Backend funcionando correctamente ✔️");
});

// Endpoint principal para Alexa
app.post("/alexa", (req, res) => {
  console.log("Solicitud recibida desde Alexa:");
  console.log(JSON.stringify(req.body, null, 2));

  // Construimos la respuesta estándar de Alexa
  const response = {
    version: "1.0",
    response: {
      shouldEndSession: true,
      outputSpeech: {
        type: "PlainText",
        text: "Tu sistema Victron está funcionando correctamente."
      }
    }
  };

  res.json(response);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor Alexa Victron iniciado en el puerto ${PORT}`);
});
