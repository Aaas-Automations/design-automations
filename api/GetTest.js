// /api/figmaUpdates.js

const axios = require('axios');
require('dotenv').config();


module.exports = async (req, res) => {
  try {
    // Example: Making a GET request to a placeholder API
    const response = await axios.get('https://jsonplaceholder.typicode.com/todos/1');

    // Creating a simple message with data from the response
    const message = {
      message: 'GET request successful',
      data: response.data
    };

    // Sending the message as JSON
    res.status(200).json(message);
  } catch (error) {
    console.error('Error making GET request:', error);
    res.status(500).send('Internal Server Error');
  }
};









