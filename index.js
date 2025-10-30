// index.js
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const VRM_API_BASE = 'https://vrmapi.victronenergy.com/v2/installations';
const VRM_TOKEN = process.env.VRM_TOKEN; // pon aquí el token (secreto) en Render
const INSTALLATION_ID = process.env.INSTALLATION_ID; // id de instalación VRM

if (!VRM_TOKEN || !INSTALLATION_ID) {
  console.warn('Faltan VRM_TOKEN o INSTALLATION_ID en variables de entorno.');
}

// Helper: búsqueda recursiva para encontrar SOC y PV Power
function findValue(obj, keysRegex) {
  if (obj == null) return null;
  if (typeof obj !== 'object') return null;
  for (const k of Object.keys(obj)) {
    try {
      if (keysRegex.test(k) && typeof obj[k] === 'number') return obj[k];
      // try nested
      const nested = obj[k];
      if (typeof nested === 'object') {
        const f = findValue(nested, keysRegex);
        if (f !== null) return f;
      }
    } catch(e){
      // ignore
    }
  }
  return null;
}

async function getSystemOverview() {
  const url = `${VRM_API_BASE}/${INSTALLATION_ID}/system-overview`;
  const res = await fetch(url, {
    headers: {
      'X-Authorization': `Token ${VRM_TOKEN}`,
      'Accept': 'application/json'
    },
    timeout: 10000
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=>'');
    throw new Error(`VRM API error ${res.status}: ${txt}`);
  }
  const json = await res.json();
  return json;
}

function extractSocAndSolar(json) {
  // Try common fields. If structure differs, use recursive find.
  let soc = null;
  let solar = null;

  // common candidate paths seen in different VRM outputs:
  try {
    if (json && json.battery && typeof json.battery.stateOfCharge === 'number') {
      soc = json.battery.stateOfCharge;
    }
    if (!soc && json.records && Array.isArray(json.records) && json.records.length) {
      // attempt
      const rec = json.records[0];
      soc = soc || findValue(rec, /soc|stateofcharge|state_of_charge|SoC/i);
      solar = solar || findValue(rec, /yield|power|pv|production|pvpower/i);
    }
  } catch(e){/*ignore*/}

  // fallback: recursive search on whole object
  soc = soc || findValue(json, /soc|stateofcharge|state_of_charge|SoC/i);
  solar = solar || findValue(json, /yield|power|pv|production|pvpower/i);

  // normalize to integers
  if (typeof soc === 'number') soc = Math.round(soc);
  if (typeof solar === 'number') solar = Math.round(solar);

  return { soc: soc == null ? null : soc, solar: solar == null ? null : solar };
}

// Status route for testing
app.get('/status', async (req, res) => {
  try {
    const json = await getSystemOverview();
    const vals = extractSocAndSolar(json);
    res.json({ ok: true, installation: INSTALLATION_ID, ...vals, raw: json });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Alexa endpoint (POST)
app.post('/alexa', async (req, res) => {
  try {
    // Optional: validate skill signature/token here (omitted for brevity)
    const json = await getSystemOverview();
    const { soc, solar } = extractSocAndSolar(json);

    // Basic Alexa-style response (PlainText)
    let respuesta = '';
    const requestType = (req.body && req.body.request && req.body.request.type) || '';
    const intentName = ((req.body && req.body.request && req.body.request.intent && req.body.request.intent.name) || '').toLowerCase();

    if (requestType === 'LaunchRequest') {
      respuesta = 'Bienvenido a Sistema Victron. Puedes preguntarme por batería o producción solar.';
    } else if (requestType === 'IntentRequest') {
      if (/bateria|batería|battery|batterystatus/.test(intentName)) {
        if (soc !== null) respuesta = `El nivel de batería es del ${soc} por ciento.`;
        else respuesta = 'No puedo obtener el nivel de batería en este momento.';
      } else if (/solar|produccion|producción|energia|energía/.test(intentName)) {
        if (solar !== null) respuesta = `La potencia solar actual es de ${solar} vatios.`;
        else respuesta = 'No puedo obtener la producción solar en este momento.';
      } else if (/sistema|estado|system/.test(intentName)) {
        if (soc !== null && solar !== null) respuesta = `Sistema funcionando. Batería al ${soc}% y producción solar de ${solar} vatios.`;
        else respuesta = 'Sistema Victron detectado. No hay datos completos en este momento.';
      } else {
        respuesta = 'Puedo informarte sobre la batería, producción solar o estado del sistema.';
      }
    } else {
      respuesta = 'Bienvenido a Sistema Victron. ¿En qué puedo ayudarte?';
    }

    const alexaResponse = {
      version: '1.0',
      response: {
        outputSpeech: {
          type: 'PlainText',
          text: respuesta
        },
        shouldEndSession: true
      },
      sessionAttributes: {}
    };

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(alexaResponse);
  } catch (err) {
    console.error('Error /alexa:', err);
    // Return friendly Alexa message
    res.status(200).json({
      version: '1.0',
      response: {
        outputSpeech: {
          type: 'PlainText',
          text: 'Error consultando el sistema. Intenta de nuevo más tarde.'
        },
        shouldEndSession: true
      }
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
