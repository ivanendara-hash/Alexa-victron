import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// Variables de entorno
const VRM_TOKEN = process.env.VRM_TOKEN;
const INSTALLATION_ID = process.env.INSTALLATION_ID;
const PORT = process.env.PORT || 3000;

// Función auxiliar: obtiene SOC y solar desde VRM
async function getSystemData() {
  const headers = { 'X-Authorization': `Token ${VRM_TOKEN}` };
  let soc = null;
  let solar = null;

  try {
    // 1️⃣ Obtener SOC desde stats
    const stats = await fetch(`https://vrmapi.victronenergy.com/v2/installations/${INSTALLATION_ID}/stats`, { headers });
    const statsData = await stats.json();

    if (statsData && statsData.records && statsData.records.battery && statsData.records.battery.stateOfCharge) {
      soc = Math.round(statsData.records.battery.stateOfCharge);
    }

    // 2️⃣ Obtener potencia solar desde overall
    const overall = await fetch(`https://vrmapi.victronenergy.com/v2/installations/${INSTALLATION_ID}/overall`, { headers });
    const overallData = await overall.json();

    if (overallData && overallData.records && overallData.records.solar) {
      solar = Math.round(overallData.records.solar.power || 0);
    }
  } catch (e) {
    console.error('Error consultando VRM:', e);
  }

  return { soc, solar };
}

// Ruta de prueba
app.get('/status', async (req, res) => {
  const data = await getSystemData();
  res.json({ ok: true, installation: INSTALLATION_ID, ...data });
});

// Endpoint de Alexa
app.post('/alexa', async (req, res) => {
  const data = await getSystemData();
  let texto = '';

  if (data.soc === null && data.solar === null) {
    texto = 'No se pudo obtener información del sistema Victron.';
  } else if (data.soc !== null && data.solar !== null) {
    texto = `El sistema Victron funciona correctamente. La batería está al ${data.soc} por ciento y la potencia solar actual es de ${data.solar} vatios.`;
  } else if (data.soc !== null) {
    texto = `La batería está al ${data.soc} por ciento.`;
  } else if (data.solar !== null) {
    texto = `La potencia solar actual es de ${data.solar} vatios.`;
  }

  const alexaResponse = {
    version: '1.0',
    response: {
      outputSpeech: { type: 'PlainText', text: texto },
      shouldEndSession: true
    }
  };

  res.json(alexaResponse);
});

app.listen(PORT, () => console.log(`🚀 Alexa-Victron corriendo en puerto ${PORT}`));
