require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
const figmaToken = process.env.FIGMA_TOKEN;
const fileKey = process.env.FILE_KEY; // Now using the FILE_KEY from the .env file
const headers = { 'X-Figma-Token': figmaToken };

// Helper function to fetch file versions or content based on version provided
async function fetchFigmaData(version = '') {
  const url = `https://api.figma.com/v1/files/${fileKey}${version ? `?version=${version}` : ''}`;
  const response = await axios.get(url, { headers });
  return response.data;
}

// Helper function to parse frames from the document node
function parseFrames(node, frames = []) {
  if (node.type === 'FRAME' || node.type === 'COMPONENT') {
    frames.push(node);
  }
  if (node.children) {
    node.children.forEach(child => parseFrames(child, frames));
  }
  return frames;
}

// Helper function to compare frames from two different versions
function compareFrames(oldFrames, newFrames) {
  const updatedFrames = newFrames.filter(newFrame => {
    const oldFrame = oldFrames.find(f => f.id === newFrame.id);
    return oldFrame && JSON.stringify(oldFrame) !== JSON.stringify(newFrame);
  });
  return updatedFrames;
}

// Endpoint to get file versions
app.get('/api/versions', async (req, res) => {
  try {
    const versionsData = await fetchFigmaData();
    res.json(versionsData.versions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to compare two versions
app.get('/api/compare', async (req, res) => {
  try {
    const { oldVersion, newVersion } = req.query; // Pass these as query parameters
    const [oldFileContent, newFileContent] = await Promise.all([
      fetchFigmaData(oldVersion),
      fetchFigmaData(newVersion)
    ]);

    const oldFrames = parseFrames(oldFileContent.document);
    const newFrames = parseFrames(newFileContent.document);

    const updatedFrames = compareFrames(oldFrames, newFrames);
    res.json({ updatedFrames });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
