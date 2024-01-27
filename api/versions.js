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

const getFileAtVersion = async (version) => {
  const fileResponse = await axios.get(`https://api.figma.com/v1/files/${fileKey}?version=${version}`, { headers });
  return fileResponse.data.document;
};

const getComments = async () => {
  const commentsResponse = await axios.get(`https://api.figma.com/v1/files/${fileKey}/comments`, { headers });
  return commentsResponse.data.comments;
};

const parseFrames = (node) => {
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
};


const findUpdatedFrames = async (currentVersion, previousVersion, currentTime, past24HoursTime) => {
    // Fetch the document structures for the current and previous versions
    const currentDoc = await getFileAtVersion(currentVersion.id);
    const previousDoc = await getFileAtVersion(previousVersion.id);
  
    // Parse the frames from the document structures
    const currentFrames = parseFrames(currentDoc);
    const previousFrames = parseFrames(previousDoc);
  
    // Compare the frames to find which have been updated
    const updatedFrames = compareFrames(currentFrames, previousFrames);
  
    // Fetch the comments for the file
    const comments = await getComments();
  
    // Filter comments to only include those within the last 24 hours
    const recentComments = comments.filter(comment => {
      const commentTime = new Date(comment.created_at);
      return commentTime >= past24HoursTime && commentTime <= currentTime;
    });
  
    // Create a set of node_ids that have recent comments
    const frameIdsWithRecentComments = new Set(recentComments.map(comment => comment.node_id));
  
    // Filter out updated frames that have recent comments
    const updatedFramesWithoutRecentComments = updatedFrames.filter(frame => 
      !frameIdsWithRecentComments.has(frame.node_id)
    );
  
    return updatedFramesWithoutRecentComments;
  };
  

// Main execution function
const main = async () => {
  try {
    const versions = await getVersions();
    const now = new Date();
    const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago

    // Filter versions to get those from the last 24 hours
    const recentVersions = versions.filter(version => {
      const createdAt = new Date(version.created_at);
      return createdAt >= yesterday;
    });

    const comments = await getComments();

    // Filter comments to get those from the last 24 hours
    const recentComments = comments.filter(comment => {
      const createdAt = new Date(comment.created_at);
      return createdAt >= yesterday;
    });

    let updatedFrames = [];

    for (const version of recentVersions) {
      const file = await getFileAtVersion(version.id);
      const frames = parseFrames(file);
      updatedFrames = updatedFrames.concat(findUpdatedFrames(versions, frames, recentComments));
    }

    // Remove duplicates from updatedFrames if necessary
    // ...

    // Save to CSV
    const fields = ['name', 'id']; // Add all fields you want to include in the CSV
    const opts = { fields };
    const csv = parse(updatedFrames, opts);

    fs.writeFileSync('updated_frames.csv', csv);
    console.log('Updated frames saved to updated_frames.csv');
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

main();
