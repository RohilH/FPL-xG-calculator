# FPL Expected Points Calculator

A web application that helps Fantasy Premier League (FPL) managers analyze player performance and build optimal squads based on expected points.
This app was built ENTIRELY with Cursor's Composer AI. I wrote almost 0 lines of code.

## Features

### Squad Builder
- Interactive pitch visualization for building your squad
- Position-specific player slots with validation rules:
  - Exactly 1 goalkeeper
  - At least 3 defenders
  - At least 1 forward
  - Maximum 5 defenders/midfielders
  - Maximum 3 forwards
- Real-time squad statistics
- Player search with position filtering
- Player cards showing:
  - Current points
  - Expected points
  - Team information
  - Player photo
- Reset squad functionality

### League Stats
- Complete overview of all Premier League players
- Sortable columns for:
  - Total points
  - Expected points (xPts)
  - Form
  - Selection percentage
  - Cost
- Team filtering
- Position filtering

### Player Search
- Fast, responsive search functionality
- Support for special characters and accents
- Displays player photos and team information
- Caches results for improved performance

## Technical Improvements

### Frontend
- React-based SPA with React Router
- Modular component structure
- Responsive design
- Improved styling with consistent UI elements
- Performance optimizations:
  - Player data caching
  - Efficient state management
  - Optimized rendering

### Backend
- Flask API with CORS support
- Efficient data fetching from FPL API
- Player name normalization for better search
- Expected points calculation based on:
  - Goals and assists
  - Clean sheets
  - Appearance points
  - Bonus points
- Modular code structure with separate modules for:
  - Position enums
  - Helper functions
  - API routes

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fpl-xpts-calculator.git
cd fpl-xpts-calculator
```

2. Install dependencies:
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
npm install
```

3. Build and run:
```bash
# Build frontend
npm run build

# Start server
gunicorn wsgi:app
```

## Development

For development, you can run:

```bash
# Run frontend dev server
npm run dev

# Run backend dev server
python app.py
```

## Dependencies

### Frontend
- React 18
- React Router 6
- Vite

### Backend
- Flask 3.0.0
- Flask-CORS 4.0.0
- Requests 2.31.0
- Python-dotenv 1.0.0
- Gunicorn 21.2.0
- Werkzeug 3.0.1

## Deployment

The application is configured for deployment on Heroku:
1. Set up a new Heroku app
2. Connect your repository
3. Deploy the main branch

The build process will automatically:
1. Install dependencies
2. Build the React frontend
3. Start the Gunicorn server

## Contributing

Feel free to submit issues and enhancement requests!