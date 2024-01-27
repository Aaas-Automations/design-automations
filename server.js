const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  // Verify Figma webhook signature
  // Parse and handle the webhook payload
  res.status(200).send('Webhook received');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
