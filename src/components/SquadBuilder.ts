import { Player, PlayerStats } from '../types/index.js';
import { SquadManager } from '../managers/SquadManager.js';

export class SquadBuilder {
    private container: HTMLElement;
    private squadManager!: SquadManager;
    private searchModal: HTMLElement | null = null;
    private currentSlot: HTMLElement | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public async initialize(): Promise<void> {
        this.squadManager = new SquadManager();
        await this.render();
        this.setupEventListeners();
    }

    private async render(): Promise<void> {
        this.container.innerHTML = `
            <h1>Squad Builder</h1>
            <div class="container-sb">
                <div class="pitch-container-sb">
                    <div class="pitch-sb">
                        <div class="row-sb">
                            ${this.createPlayerSlots(1, 'GK')}
                        </div>
                        <div class="row-sb">
                            ${this.createPlayerSlots(5, 'DEF')}
                        </div>
                        <div class="row-sb">
                            ${this.createPlayerSlots(5, 'MID')}
                        </div>
                        <div class="row-sb">
                            ${this.createPlayerSlots(3, 'FWD')}
                        </div>
                    </div>
                </div>
                <div class="stats-container-sb">
                    <div class="stats-box-sb">
                        <h3>Squad Stats</h3>
                        <div class="stat-item-sb">
                            <span class="stat-label-sb">Total Points:</span>
                            <span class="stat-value-sb" id="total-points">0</span>
                        </div>
                        <div class="stat-item-sb">
                            <span class="stat-label-sb">Expected Points:</span>
                            <span class="stat-value-sb" id="total-xpts">0</span>
                        </div>
                    </div>
                    <div class="stats-box-sb">
                        <h3>Player Stats</h3>
                        <div class="player-stats-header-sb">
                            <span>Player</span>
                            <span>PPG</span>
                            <span>Pts</span>
                            <span>xPts</span>
                        </div>
                        <div id="player-stats-list"></div>
                    </div>
                </div>
            </div>
            <div class="search-modal-sb">
                <div class="modal-content-sb">
                    <div class="search-container-sb">
                        <input type="text" id="searchInput" placeholder="Search for a player...">
                    </div>
                    <ul class="player-list-sb"></ul>
                    <div class="buttons-sb">
                        <button class="button-sb secondary-sb" id="closeSearch">Close</button>
                    </div>
                </div>
            </div>
        `;

        this.searchModal = this.container.querySelector('.search-modal-sb');
    }

    private createPlayerSlots(count: number, position: string): string {
        return Array(count).fill(0).map(() => `
            <div class="position-slot-sb" data-position="${position}">
                <div class="position-tag-sb ${position}">${position}</div>
            </div>
        `).join('');
    }

    private setupEventListeners(): void {
        const searchInput = this.container.querySelector('#searchInput-sb') as HTMLInputElement;
        const playerList = this.container.querySelector('.player-list-sb') as HTMLElement;
        const closeButton = this.container.querySelector('#closeSearch-sb') as HTMLElement;
        const positionSlots = this.container.querySelectorAll('.position-slot-sb');

        positionSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                if (!(slot as HTMLElement).classList.contains('filled-sb')) {
                    this.currentSlot = slot as HTMLElement;
                    this.openSearch();
                }
            });
        });

        searchInput.addEventListener('input', async () => {
            const query = searchInput.value.trim();
            if (query.length < 2) {
                playerList.innerHTML = '';
                return;
            }

            try {
                const response = await fetch(`/api/players?search=${encodeURIComponent(query)}`);
                const players = await response.json();
                this.displaySearchResults(players, playerList);
            } catch (error) {
                console.error('Error searching players:', error);
            }
        });

        closeButton.addEventListener('click', () => this.closeSearch());
    }

    private displaySearchResults(players: Player[], container: HTMLElement): void {
        const position = this.currentSlot?.getAttribute('data-position');
        const filteredPlayers = players.filter(p => p.position === position);

        container.innerHTML = filteredPlayers.map(player => `
            <li class="player-item-sb" data-player-id="${player.id}">
                <img class="player-photo-sb" src="https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo}.png" 
                     alt="${player.first_name} ${player.second_name}">
                <div class="player-info-sb">
                    <div class="player-name-sb">${player.first_name} ${player.second_name}</div>
                    <div class="player-team-sb">${player.team}</div>
                </div>
            </li>
        `).join('');

        container.querySelectorAll('.player-item-sb').forEach(item => {
            item.addEventListener('click', () => this.handlePlayerSelection(item));
        });
    }

    private async handlePlayerSelection(playerElement: Element): Promise<void> {
        const playerId = playerElement.getAttribute('data-player-id');
        if (!playerId || !this.currentSlot) return;

        try {
            const response = await fetch(`/api/player/${playerId}`);
            const player = await response.json();
            await this.updatePlayerSlot(player);
        } catch (error) {
            console.error('Error fetching player details:', error);
        }
    }

    private async updatePlayerSlot(player: Player): Promise<void> {
        if (!this.currentSlot) return;

        this.currentSlot.innerHTML = `
            <div class="remove-player-sb">×</div>
            <img class="player-photo-sb" src="https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo}.png" 
                 alt="${player.first_name} ${player.second_name}">
            <div class="player-info-box-sb">
                <div class="player-name-sb">${player.first_name} ${player.second_name}</div>
                <div class="player-team-sb">${player.team}</div>
            </div>
            <div class="player-ppg-sb">${player.ppg.toFixed(1)}</div>
        `;

        const removeButton = this.currentSlot.querySelector('.remove-player-sb');
        if (removeButton) {
            removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removePlayer(this.currentSlot as HTMLElement);
            });
        }

        this.currentSlot.classList.add('filled-sb');
        await this.updateSquadStats();
        this.closeSearch();
    }

    private removePlayer(slot: HTMLElement): void {
        const position = slot.getAttribute('data-position');
        slot.innerHTML = `<div class="position-tag-sb ${position}">${position}</div>`;
        slot.classList.remove('filled-sb');
        this.updateSquadStats();
        this.updatePlayerStatsList();
    }

    private async updateSquadStats(): Promise<void> {
        const filledSlots = this.container.querySelectorAll('.position-slot-sb.filled-sb');
        let totalPoints = 0;
        let totalXpts = 0;

        for (const slot of filledSlots) {
            const playerName = slot.querySelector('.player-name-sb')?.textContent;
            if (!playerName) continue;

            try {
                const response = await fetch(`/api/players?search=${encodeURIComponent(playerName)}`);
                const players = await response.json();
                if (players.length > 0) {
                    const player = players[0];
                    totalPoints += player.points || 0;
                    totalXpts += player.xPts || 0;
                }
            } catch (error) {
                console.error('Error fetching player stats:', error);
            }
        }

        document.getElementById('total-points')!.textContent = totalPoints.toString();
        document.getElementById('total-xpts')!.textContent = totalXpts.toFixed(1);

        this.updatePlayerStatsList();
    }

    private async updatePlayerStatsList(): Promise<void> {
        const statsList = this.container.querySelector('#player-stats-list-sb') as HTMLElement;
        const filledSlots = this.container.querySelectorAll('.position-slot-sb.filled-sb');
        let statsHtml = '';

        for (const slot of filledSlots) {
            const playerName = slot.querySelector('.player-name-sb')?.textContent;
            if (!playerName) continue;

            try {
                const response = await fetch(`/api/players?search=${encodeURIComponent(playerName)}`);
                const players = await response.json();
                if (players.length > 0) {
                    const player = players[0];
                    statsHtml += `
                        <div class="player-stat-row-sb">
                            <span class="player-stat-name-sb">${player.first_name} ${player.second_name}</span>
                            <span class="player-stat-value-sb">${player.ppg.toFixed(2)}</span>
                            <span class="player-stat-value-sb">${player.points}</span>
                            <span class="player-stat-value-sb">${player.xPts.toFixed(1)}</span>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error fetching player stats:', error);
            }
        }

        statsList.innerHTML = statsHtml;
    }

    private openSearch(): void {
        if (this.searchModal) {
            this.searchModal.style.display = 'block';
            const searchInput = this.searchModal.querySelector('#searchInput-sb') as HTMLInputElement;
            searchInput.value = '';
            searchInput.focus();
        }
    }

    private closeSearch(): void {
        if (this.searchModal) {
            this.searchModal.style.display = 'none';
            this.currentSlot = null;
        }
    }
}