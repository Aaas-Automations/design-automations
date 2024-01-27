module.exports = async (req, res) => {
  if (req.method === 'POST') {
    // Verify Figma webhook signature
    // Parse and handle the webhook payload
    res.status(200).send('Webhook received');
  } else {
    res.status(405).send('Method Not Allowed');
  }
};