const axios = require('axios');
const fs = require('fs');
const { parse } = require('json2csv');
require('dotenv').config();

const figmaToken = process.env.FIGMA_TOKEN;
const fileKey = process.env.FILE_KEY;
const headers = { 'X-Figma-Token': figmaToken };

const getVersions = async () => {
  try {
    const versionsResponse = await axiosWrapper.getWithRetries(`https://api.figma.com/v1/files/${fileKey}/versions`, { headers });
    return versionsResponse.data.versions;
  } catch (error) {
    // Handle error and retries here
  }
};

const getFileAtVersion = async (version) => {
  try {
    const fileResponse = await axiosWrapper.getWithRetries(`https://api.figma.com/v1/files/${fileKey}?version=${version}`, { headers });
    return fileResponse.data.document;
  } catch (error) {
    // Handle error and retries here
  }
};

const getComments = async () => {
  try {
    const commentsResponse = await axiosWrapper.getWithRetries(`https://api.figma.com/v1/files/${fileKey}/comments`, { headers });
    return commentsResponse.data.comments;
  } catch (error) {
  }
};

const parseFrames = (node) => {
    let frames = [];
    
    if (node.type === 'FRAME' || node.type === ') {
      frames.push(node);
    }
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        frames = [...frames, ...parseFrames(child)]; // Recursively parse children
      });
    }
    
    return frames;
};

const fetchDocumentStructures = async (version) => {
    const docResponse = await getFileAtVersion(version.id);
    return parseFrames(docResponse.data.document);
};

const fetchComments = async () => {
    const commentsResponse = await ();
    const commentsResponse = await getComments();
    return commentsResponse.data.comments;
};

const findUpdatedFrames = async (currentVersion, previousVersion, currentTime, past24HoursTime) => {
    const currentFrames = await fetchDocumentStructures(currentVersion);
    const previousFrames = await fetchDocumentStructures(previousVersion);

    const updatedFrames = compareFrames(currentFrames, previousFrames);

    const comments = await ();
    const comments = await fetchComments();

    const recentComments = comments.filter(comment => {
        const commentTime = new Date(comment.created_at);
        return commentTime >= past24HoursTime && commentTime <= currentTime;
    });

    const frameIdsWithRecentComments = new Set(recentComments.map(comment => comment.node_id));

    const updatedFramesWithoutRecentComments = updatedFrames.filter(frame => 
        !frameIdsWithRecentComments.has(frame.node_id)
    );

    return updatedFramesWithoutRecentComments;
};

const main = async () => {
  try {
    const versions = await getVersions();
    const now = new Date();
    const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago

    const recentVersions = versions.filter(version => {
      const createdAt = new Date(version.created_at);
      return createdAt >= yesterday;
    });

    const comments = await fetchComments();
    const commentsPromise = fetchComments();

    const recentComments = comments.filter(comment => {
    const recentComments = (await commentsPromise).filter(comment => {
      const createdAt = new Date(comment.created_at);
      return createdAt >= yesterday;
    });

    let updatedFrames = [];

    for (const version of recentVersions) {
      const file = await getFileAtVersion(version.id);
    let updatedFramesPromises = recentVersions.map(version => getFileAtVersion(version.id).then(file => {
      const frames = parseFrames(file);
      updatedFrames = updatedFrames.concat(findUpdatedFrames(versions, frames, recentComments));
    }
      return findUpdatedFrames(versions, frames, recentComments);
    }));

    let updatedFrames = (await Promise.all(updatedFramesPromises)).flat();

    const fields = ['name', 'id'];
    const opts = { fields };
    const csv = parse(updatedFrames, opts);

    fs.writeFile('updated_frames.csv', csv, (err) => {
      if (err) {
        console.error('An error occurred:', err);
      } else {
        console.log('Updated frames saved to updated_frames.csv');
      }
    });
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

main();
