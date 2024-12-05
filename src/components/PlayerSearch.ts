import { Player } from '../types/index.js';

interface PlayerPoints {
    total: number;
    goals: number;
    assists: number;
    clean_sheets: number;
    appearances: number;
    bonus_and_deductions: number;
}

interface ActualStats {
    goals: number;
    assists: number;
    clean_sheets: number;
    minutes: number;
    points: PlayerPoints;
}

interface ExpectedStats {
    xG: number;
    xA: number;
    goals: number;
    assists: number;
    clean_sheets: number;
    points: PlayerPoints;
}

interface PlayerDetails extends Player {
    actual_stats: ActualStats;
    expected_stats: ExpectedStats;
}

export class PlayerSearch {
    private container: HTMLElement;
    private searchInput: HTMLInputElement;
    private resultsContainer: HTMLElement;
    private statsContainer: HTMLElement;
    private debounceTimeout: number | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.searchInput = document.createElement('input');
        this.resultsContainer = document.createElement('div');
        this.statsContainer = document.createElement('div');
        this.initialize();
    }

    private async initialize(): Promise<void> {
        this.container.innerHTML = `
            <h1>FPL xPts Calculator</h1>
            <div class="search-container">
                <input type="text" id="searchInput" placeholder="Search for a player...">
                <ul id="playerList"></ul>
            </div>
            <div id="statsContainer" class="stats-container">
                <div class="stats-header">
                    <img id="playerPhoto" src="" alt="">
                    <div class="stats-header-info">
                        <h2 id="playerName"></h2>
                        <p id="playerInfo"></p>
                    </div>
                </div>
                <div class="stats-grid">
                    <div class="stat-box">
                        <h3>Actual Stats</h3>
                        <div id="actualStats"></div>
                    </div>
                    <div class="stat-box">
                        <h3>Expected Stats</h3>
                        <div id="expectedStats"></div>
                    </div>
                </div>
            </div>
        `;

        this.searchInput = this.container.querySelector('#searchInput') as HTMLInputElement;
        this.resultsContainer = this.container.querySelector('#playerList') as HTMLElement;
        this.statsContainer = this.container.querySelector('#statsContainer') as HTMLElement;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.searchInput.addEventListener('input', () => {
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }
            this.debounceTimeout = window.setTimeout(() => {
                const searchTerm = this.searchInput.value.trim()
                    .normalize('NFKD')
                    .replace(/[\u0300-\u036f]/g, '');
                if (searchTerm.length >= 3) {
                    this.handleSearch(searchTerm);
                } else {
                    this.resultsContainer.style.display = 'none';
                }
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target as Node)) {
                this.resultsContainer.style.display = 'none';
            }
        });
    }

    private async handleSearch(query: string): Promise<void> {
        try {
            const response = await fetch(`/api/players?search=${encodeURIComponent(query)}`);
            const players = await response.json();
            this.displaySearchResults(players);
            this.resultsContainer.style.display = players.length ? 'block' : 'none';
        } catch (error) {
            console.error('Error searching players:', error);
        }
    }

    private displaySearchResults(players: Player[]): void {
        this.resultsContainer.innerHTML = players.map(player => `
            <li data-player-id="${player.id}">
                <img class="player-photo" 
                     src="https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo}.png"
                     onerror="this.src='https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png'"
                     alt="${player.first_name} ${player.second_name}">
                <div class="player-info">
                    <div class="player-name">${player.first_name} ${player.second_name}</div>
                    <div class="player-team">${player.team}</div>
                </div>
            </li>
        `).join('');

        this.resultsContainer.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', () => {
                const playerId = item.getAttribute('data-player-id');
                if (playerId) {
                    this.showPlayerStats(parseInt(playerId));
                }
            });
        });
    }

    private createStatItem(label: string, value: string | number): string {
        return `
            <div class="stat-item">
                <span class="stat-label">${label}:</span>
                <span class="stat-value">${value}</span>
            </div>
        `;
    }

    private async showPlayerStats(playerId: number): Promise<void> {
        try {
            const response = await fetch(`/api/player/${playerId}`);
            const playerData = await response.json() as PlayerDetails;
            const playerName = `${playerData.first_name} ${playerData.second_name}`;
            
            // Update player info
            document.getElementById('playerName')!.textContent = playerName;
            document.getElementById('playerInfo')!.textContent = 
                `${playerData.position} - ${playerData.team}`;
            const photo = document.getElementById('playerPhoto') as HTMLImageElement;
            photo.src = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${playerData.photo}.png`;
            
            // Update actual stats
            const actualStats = document.getElementById('actualStats')!;
            actualStats.innerHTML = `
                ${this.createStatItem('Goals', playerData.actual_stats.goals)}
                ${this.createStatItem('Assists', playerData.actual_stats.assists)}
                ${this.createStatItem('Clean Sheets', playerData.actual_stats.clean_sheets)}
                ${this.createStatItem('Minutes', playerData.actual_stats.minutes)}
                <div class="total-points">
                    ${this.createStatItem('Total Points', playerData.actual_stats.points.total)}
                    <div class="points-breakdown">
                        <small>Goals: ${playerData.actual_stats.points.goals}</small>
                        <small>Assists: ${playerData.actual_stats.points.assists}</small>
                        <small>Clean Sheets: ${playerData.actual_stats.points.clean_sheets}</small>
                        <small>Appearances: ${playerData.actual_stats.points.appearances}</small>
                        <small>Bonus & Deductions: ${playerData.actual_stats.points.bonus_and_deductions}</small>
                    </div>
                </div>
            `;
            
            // Update expected stats
            const expectedStats = document.getElementById('expectedStats')!;
            expectedStats.innerHTML = `
                ${this.createStatItem('Raw xG', playerData.expected_stats.xG.toFixed(2))}
                ${this.createStatItem('Raw xA', playerData.expected_stats.xA.toFixed(2))}
                ${this.createStatItem('Expected Goals (rounded)', playerData.expected_stats.goals)}
                ${this.createStatItem('Expected Assists (rounded)', playerData.expected_stats.assists)}
                ${this.createStatItem('Clean Sheets', playerData.expected_stats.clean_sheets)}
                <div class="total-points">
                    ${this.createStatItem('Expected Points', playerData.expected_stats.points.total)}
                    <div class="points-breakdown">
                        <small>Goals: ${playerData.expected_stats.points.goals}</small>
                        <small>Assists: ${playerData.expected_stats.points.assists}</small>
                        <small>Clean Sheets: ${playerData.expected_stats.points.clean_sheets}</small>
                        <small>Appearances: ${playerData.expected_stats.points.appearances}</small>
                        <small>Bonus & Deductions: ${playerData.expected_stats.points.bonus_and_deductions}</small>
                    </div>
                </div>
            `;
            
            // Update UI state
            this.resultsContainer.style.display = 'none';
            this.searchInput.value = playerName;
            this.statsContainer.style.display = 'block';
        } catch (error) {
            console.error('Error fetching player stats:', error);
        }
    }
} 