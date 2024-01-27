const axios = require('axios');
const fetchVersions = require('./versions'); // Adjust the path as necessary

const figmaToken = process.env.FIGMA_TOKEN;
const fileKey = process.env.FILE_KEY;
const headers = { 'X-Figma-Token': figmaToken };

function parseFrames(node) {
    let frames = [];
    
    if (node.type === 'FRAME' || node.type === 'COMPONENT') {
      frames.push(node);
    }
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        frames = frames.concat(parseFrames(child)); // Recursively parse children
      });
    }
    
    return frames;
  }

function compareFrames(oldFrames, newFrames) {
    const updatedFrames = [];
  
    // Create a map of old frames for quick lookup
    const oldFramesMap = oldFrames.reduce((acc, frame) => {
      acc[frame.id] = frame;
      return acc;
    }, {});
  
    // Iterate over new frames to see if they exist in the old frames map
    newFrames.forEach(newFrame => {
      const oldFrame = oldFramesMap[newFrame.id];
      if (oldFrame) {
        // Compare properties to see if the frame has been updated
        // Here you might compare specific properties like size, children, etc.
        // For simplicity, let's just compare their names
        if (newFrame.name !== oldFrame.name) {
          updatedFrames.push(newFrame);
        }
      } else {
        // If the frame is new and did not exist before, consider it as updated
        updatedFrames.push(newFrame);
      }
    });
  
    return updatedFrames;
  }
  

module.exports = async (req, res) => {
  try {
    // Fetch all versions
    const versions = await fetchVersions();

    // Determine versions to compare (yesterday's version to the latest version)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTimestamp = yesterday.toISOString();

    let oldVersionId, newVersionId;
    
    // Find the most recent version before yesterday
    for (const version of versions) {
      const versionDate = new Date(version.created_at);
      if (versionDate < yesterday) {
        oldVersionId = version.id;
        break;
      }
    }

    // The new version is the current latest version
    newVersionId = versions[0].id; // The first one in the list is the latest

    if (!oldVersionId || !newVersionId) {
      res.status(404).json({ message: 'Unable to find the required versions for comparison.' });
      return;
    }

    // Fetch file contents for both versions
    const [oldFileContent, newFileContent] = await Promise.all([
      axios.get(`https://api.figma.com/v1/files/${fileKey}?version=${oldVersionId}`, { headers }),
      axios.get(`https://api.figma.com/v1/files/${fileKey}`, { headers }) // latest version doesn't need the version parameter
    ]);

    // Parse frames and compare them
    const oldFrames = parseFrames(oldFileContent.data.document); // Implement parseFrames
    const newFrames = parseFrames(newFileContent.data.document); // Implement parseFrames

    // Assuming compareFrames returns a list of updated frames without new comments
    const updatedFramesWithoutComments = compareFrames(oldFrames, newFrames); // Implement compareFrames

    res.json({ updatedFramesWithoutComments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
