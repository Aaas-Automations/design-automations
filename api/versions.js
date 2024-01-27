const axios = require('axios');

const figmaToken = process.env.FIGMA_TOKEN;
const fileKey = process.env.FILE_KEY;
const headers = { 'X-Figma-Token': figmaToken };

async function fetchVersions() {
  const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}/versions`, { headers });
  return response.versions; // Assuming versions is the key containing the versions array
}

module.exports = fetchVersions;
