const express = require('express');
const app = express();
const { OpenAI } = require('openai');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(express.static('public'));

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Onboarding
app.post('/onboarding', (req, res) => {
  res.json({ message: 'Onboarding complete' });
});

// Suggestion (all locked rules)
app.post('/suggest-outfit', async (req, res) => {
  const prompt = req.body.prompt;
  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a menswear AI stylist. Use locked rules: no cardinal sins, sleeve rolls per temp, buttons per formality, dry-clean after 3 wears for full suit (blazer + trousers + waistcoat) with explanation "why together" (to keep colour tone even, even if some parts not worn), prompt user to mark as returned before resetting timer, rotation 10 days starting on wear day, pocket square variation, non-negotiables like cane in right hand, pre-protection for planned outfits.' },
        { role: 'user', content: prompt },
      ],
    });
    res.json(response.choices[0].message.content);
  } catch (error) {
    res.status(500).json({ error: 'AI error' });
  }
});

// Stripe
app.post('/create-subscription', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: 'price_id_gold', quantity: 1 }],
      mode: 'subscription',
      success_url: 'https://wardrobe.four2records.co.uk/success',
      cancel_url: 'https://wardrobe.four2records.co.uk/cancel',
    });
    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: 'Payment error' });
  }
});

// Beta
app.post('/beta-signup', (req, res) => {
  if (req.body.inviteCode === 'friends-beta') {
    res.json({ message: 'Beta access granted' });
  } else {
    res.status(403).json({ error: 'Invite only' });
  }
});

// Root
app.get('/', (req, res) => {
  res.send('Four2 Wardrobe API is running! Ready for suggestions.');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on port ${port}`));
