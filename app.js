const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const accessToken = process.env.ACCESS_TOKEN; 
const phoneNumberId = process.env.PHONE_NUMBER_ID; 

// Función para enviar mensajes
async function sendWhatsAppMessage(toNumber, text) {
  console.log(`--- Iniciando envío a ${toNumber} ---`);
  try {
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: "whatsapp",
        to: toNumber,
        type: "text",
        text: { body: text }
      }
    });
    console.log("¡Respuesta enviada con éxito! ID:", response.data.messages[0].id);
  } catch (error) {
    if (error.response) {
      console.error("ERROR DE META:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("ERROR DE RED/CODIGO:", error.message);
    }
  }
}

// Validación del Webhook (GET)
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  if (mode === 'subscribe' && token === verifyToken) {
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Recepción de mensajes (POST)
app.post('/', async (req, res) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message && message.type === 'text') {
      let from = message.from; 
      
      // Corrección para números de México: Meta espera 52 + 10 dígitos
      if (from.startsWith("521")) {
        from = "52" + from.substring(3);
      }

      const userText = message.text.body.toLowerCase();
      console.log(`Mensaje de ${from}: ${userText}`);

      let respuestaBot = "";

      if (userText.includes("hola")) {
        respuestaBot = "¡Hola! Bienvenido. Escribe 'menu' para ver opciones.";
      } else if (userText === "menu") {
        respuestaBot = "Opciones disponibles:\n1. Enanos normales\n2. Enanos transexuales tu\n3. Enanos en tanga";
      } else if (userText === "1") {
        respuestaBot = "Claro, se los mandaremos a su ubicacion";
      } else {
        respuestaBot = "Lo siento, no entendí eso. Intenta escribiendo 'hola' o 'menu'.";
      }

      // Logs de depuración corregidos
      console.log(`Intentando responder a: ${from}`);
      console.log(`URL destino: https://graph.facebook.com/v21.0/${phoneNumberId}/messages`);
      
      await sendWhatsAppMessage(from, respuestaBot);
    }

    res.status(200).end();
  } else {
    res.status(404).end();
  }
});

app.listen(port, () => {
  console.log(`Servidor activo en puerto ${port}`);
});
