# FPL xPts Calculator

This app was built ENTIRELY with Cursor's Composer AI. I wrote almost 0 lines of code.

A web application that calculates expected FPL (Fantasy Premier League) points based on players' xG (Expected Goals) and xA (Expected Assists) statistics. The app provides two main features:

1. **Player Search**: Search for any Premier League player to view their:
   - Actual stats (goals, assists, clean sheets)
   - Expected stats (xG, xA)
   - Points breakdown
   - Expected points calculation

2. **League Stats**: View all Premier League players in a sortable table with:
   - Current FPL stats
   - Expected stats
   - Filtering by position
   - Sorting by any metric (points, xPts, goals, etc.)

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/RohilH/FPL-xG-calculator.git
cd FPL-xG-calculator
```

2. Create and activate a virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python app.py
```

5. Open your browser and navigate to:
```
http://localhost:5000
```

## Features

- Real-time FPL data integration
- Expected points calculation based on xG and xA
- Clean sheet and appearance points consideration
- Position-based point multipliers
- Sortable league table
- Player photo integration
- Mobile-responsive design

## Technologies Used

- Python/Flask for backend
- HTML/CSS/JavaScript for frontend
- FPL API integration
- Real-time data updates 