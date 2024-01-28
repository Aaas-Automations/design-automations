const axios = require('axios');
const fs = require('fs');
const { parse } = require('json2csv');
require('dotenv').config();

const figmaToken = process.env.FIGMA_TOKEN;
const fileKey = process.env.FILE_KEY;
const headers = { 'X-Figma-Token': figmaToken };

const getVersions = async () => {
  const versionsResponse = await axios.get(`https://api.figma.com/v1/files/${fileKey}/versions`, { headers });
  return versionsResponse.data.versions;
};

// Serverless function to handle the GET request
module.exports = async (req, res) => {
  try {
    // Use the getVersions function to fetch data
    const versions = await getVersions();

    // Send the fetched data as JSON response
    res.status(200).json({ versions });
  } catch (error) {
    console.error('Error fetching versions from Figma:', error);
    res.status(500).send('Internal Server Error');
  }
};

