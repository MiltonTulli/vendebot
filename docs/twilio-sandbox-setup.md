# Twilio WhatsApp Sandbox Setup

## 1. Get Twilio Credentials

1. Sign up at [twilio.com](https://www.twilio.com/)
2. Go to **Console Dashboard** → copy **Account SID** and **Auth Token**

## 2. Enable WhatsApp Sandbox

1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join the sandbox (send the join code from your phone)
3. The sandbox number is `+14155238886`

## 3. Set Environment Variables

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
WHATSAPP_PROVIDER=twilio
```

Set these in Vercel:
```bash
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_WHATSAPP_FROM
```

## 4. Configure Webhook URL

1. In the Twilio sandbox settings, set the webhook URL:
   - **When a message comes in**: `https://vendebot.vercel.app/api/webhook/whatsapp`
   - Method: **POST**

## 5. Test

Send a WhatsApp message to the sandbox number. You should receive an echo: "Recibido: [your message]"

## Notes

- Sandbox sessions expire after 72 hours of inactivity — you'll need to rejoin
- The sandbox only works with numbers that have joined (sent the join code)
- For production, you'll need a Twilio phone number with WhatsApp enabled
