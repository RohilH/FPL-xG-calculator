import { Player } from '../types/index.js';

type SortableFields = keyof Pick<Player, 
    'points' | 'xPts' | 'cost' | 'selected' | 'form' | 'minutes' | 
    'goals' | 'assists' | 'clean_sheets' | 'xG' | 'xA'
>;

interface SortOption {
    value: SortableFields;
    label: string;
}

export class StatsTable {
    private container: HTMLElement;
    private players: Player[] = [];
    private currentView: string = 'all';
    private currentSort: SortableFields = 'points';
    private tbody: HTMLElement;

    private readonly sortOptions: SortOption[] = [
        { value: 'points', label: 'Total Points' },
        { value: 'xPts', label: 'Expected Points' },
        { value: 'cost', label: 'Cost' },
        { value: 'selected', label: 'Selection %' },
        { value: 'form', label: 'Form' },
        { value: 'minutes', label: 'Minutes' },
        { value: 'goals', label: 'Goals' },
        { value: 'assists', label: 'Assists' },
        { value: 'clean_sheets', label: 'Clean Sheets' },
        { value: 'xG', label: 'Expected Goals' },
        { value: 'xA', label: 'Expected Assists' }
    ];

    constructor(container: HTMLElement) {
        this.container = container;
        this.tbody = document.createElement('tbody');
        this.initialize();
    }

    private async initialize(): Promise<void> {
        this.container.innerHTML = `
            <h1>FPL Statistics</h1>
            
            <div class="controls">
                <div>
                    <label for="viewSelect">View:</label>
                    <select id="viewSelect" class="view-select">
                        <option value="all">All players</option>
                        <option value="GK">Goalkeepers</option>
                        <option value="DEF">Defenders</option>
                        <option value="MID">Midfielders</option>
                        <option value="FWD">Forwards</option>
                    </select>
                </div>
                <div>
                    <label for="sortSelect">Sort by:</label>
                    <select id="sortSelect" class="sort-select">
                        ${this.sortOptions.map(option => 
                            `<option value="${option.value}">${option.label}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>

            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Cost</th>
                        <th>Selected</th>
                        <th>Form</th>
                        <th>Pts</th>
                        <th>xPts</th>
                        <th>Mins</th>
                        <th>Goals</th>
                        <th>Assists</th>
                        <th>CS</th>
                        <th>xG</th>
                        <th>xA</th>
                    </tr>
                </thead>
                <tbody id="statsTableBody"></tbody>
            </table>
        `;

        this.tbody = this.container.querySelector('#statsTableBody') as HTMLElement;
        this.setupEventListeners();
        await this.fetchStats();
    }

    private setupEventListeners(): void {
        const viewSelect = this.container.querySelector('#viewSelect') as HTMLSelectElement;
        const sortSelect = this.container.querySelector('#sortSelect') as HTMLSelectElement;
        const tableHeaders = this.container.querySelectorAll('th');

        viewSelect.addEventListener('change', () => {
            this.currentView = viewSelect.value;
            this.updateTable();
        });

        sortSelect.addEventListener('change', () => {
            this.currentSort = sortSelect.value as SortableFields;
            this.updateTable();
        });

        tableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = this.getColumnKey(header.textContent || '');
                if (column) {
                    this.currentSort = column;
                    sortSelect.value = column;
                    this.updateTable();
                }
            });
        });
    }

    private getColumnKey(headerText: string): SortableFields | null {
        const columnMap: { [key: string]: SortableFields } = {
            'Cost': 'cost',
            'Selected': 'selected',
            'Form': 'form',
            'Pts': 'points',
            'xPts': 'xPts',
            'Mins': 'minutes',
            'Goals': 'goals',
            'Assists': 'assists',
            'CS': 'clean_sheets',
            'xG': 'xG',
            'xA': 'xA'
        };
        return columnMap[headerText] || null;
    }

    private async fetchStats(): Promise<void> {
        try {
            const response = await fetch('/api/stats');
            this.players = await response.json();
            this.updateTable();
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }

    private updateTable(): void {
        const filteredPlayers = this.currentView === 'all'
            ? this.players
            : this.players.filter(player => player.position === this.currentView);

        const sortedPlayers = [...filteredPlayers].sort((a, b) => {
            const aValue = a[this.currentSort];
            const bValue = b[this.currentSort];
            return (bValue as number) - (aValue as number);
        });

        this.tbody.innerHTML = sortedPlayers.map(player => this.createPlayerRow(player)).join('');
    }

    private createPlayerRow(player: Player): string {
        const positionClass = player.position;
        return `
            <tr data-player-id="${player.id}">
                <td>
                    <div class="player-info">
                        <img class="player-photo" 
                             src="https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo}.png"
                             onerror="this.src='https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png'"
                             alt="${player.first_name} ${player.second_name}">
                        <div>
                            <div class="player-name">${player.first_name} ${player.second_name}</div>
                            <div class="player-team">
                                ${player.team}
                                <span class="position-tag ${positionClass}">${positionClass}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td>${(player.cost || 0).toFixed(1)}</td>
                <td>${player.selected}%</td>
                <td>${player.form}</td>
                <td>${player.points}</td>
                <td>${player.xPts?.toFixed(2) || '-'}</td>
                <td>${player.minutes}</td>
                <td>${player.goals}</td>
                <td>${player.assists}</td>
                <td>${player.clean_sheets}</td>
                <td>${player.xG?.toFixed(2) || '-'}</td>
                <td>${player.xA?.toFixed(2) || '-'}</td>
            </tr>
        `;
    }
} 