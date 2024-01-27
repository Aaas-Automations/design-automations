const axios = require('axios');

// Assuming you have set the environment variables in Vercel's project settings
const figmaToken = process.env.FIGMA_TOKEN;
const fileKey = process.env.FILE_KEY;
const headers = { 'X-Figma-Token': figmaToken };

module.exports = async (req, res) => {
  try {
    const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}/versions`, { headers });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
