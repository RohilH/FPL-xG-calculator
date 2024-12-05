#!/bin/bash

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
npm install

# Build React app
npm run build

# Start Flask server
python app.py 