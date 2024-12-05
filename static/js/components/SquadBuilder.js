import { SquadManager } from '../managers/SquadManager.js';
export class SquadBuilder {
    constructor(container) {
        this.container = container;
    }
    async initialize() {
        this.squadManager = new SquadManager();
        await this.render();
        this.setupEventListeners();
    }
    async render() {
        this.container.innerHTML = `
            <div class="container">
                <div class="main-content">
                    <div class="pitch">
                        <div class="row">
                            ${this.createPlayerSlots(1, 'GK')}
                        </div>
                        <div class="row">
                            ${this.createPlayerSlots(4, 'DEF')}
                        </div>
                        <div class="row">
                            ${this.createPlayerSlots(4, 'MID')}
                        </div>
                        <div class="row">
                            ${this.createPlayerSlots(2, 'FWD')}
                        </div>
                    </div>
                </div>
                <div class="sidebar">
                    <div class="stats-container">
                        <div class="stats-header">Squad Stats</div>
                        <div class="stats-row">
                            <span class="stats-label">Total Points</span>
                            <span class="stats-value" id="total-points">0</span>
                        </div>
                        <div class="stats-row">
                            <span class="stats-label">Expected Points</span>
                            <span class="stats-value" id="total-xpts">0</span>
                        </div>
                        <div class="stats-row">
                            <span class="stats-label">Average PPG</span>
                            <span class="stats-value" id="avg-ppg">0</span>
                        </div>
                    </div>
                    <div class="search-container mt-20">
                        <input type="text" class="search-input" placeholder="Search for a player...">
                        <div class="search-results"></div>
                    </div>
                </div>
            </div>
        `;
    }
    createPlayerSlots(count, position) {
        return Array(count).fill(0).map(() => `
            <div class="player-slot" data-position="${position}">
                <img src="/static/img/shirt.png" alt="Empty slot">
                <div class="name">${position}</div>
            </div>
        `).join('');
    }
    setupEventListeners() {
        const searchInput = this.container.querySelector('.search-input');
        const searchResults = this.container.querySelector('.search-results');
        const playerSlots = this.container.querySelectorAll('.player-slot');
        searchInput.addEventListener('input', async () => {
            const query = searchInput.value.trim();
            if (query.length < 2) {
                searchResults.innerHTML = '';
                return;
            }
            try {
                const response = await fetch(`/api/players?search=${encodeURIComponent(query)}`);
                const players = await response.json();
                this.displaySearchResults(players, searchResults);
            }
            catch (error) {
                console.error('Error searching players:', error);
            }
        });
        playerSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                searchInput.focus();
                searchInput.setAttribute('data-target-position', slot.getAttribute('data-position') || '');
            });
        });
    }
    displaySearchResults(players, container) {
        container.innerHTML = players.map(player => `
            <div class="player-item" data-player-id="${player.id}">
                <img src="https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo}.png" alt="${player.first_name} ${player.second_name}">
                <div class="player-info">
                    <div class="player-name">${player.first_name} ${player.second_name}</div>
                    <div class="player-team">${player.team} · ${player.position}</div>
                </div>
            </div>
        `).join('');
        container.querySelectorAll('.player-item').forEach(item => {
            item.addEventListener('click', () => this.handlePlayerSelection(item));
        });
    }
    async handlePlayerSelection(playerElement) {
        const playerId = playerElement.getAttribute('data-player-id');
        if (!playerId)
            return;
        try {
            const response = await fetch(`/api/player/${playerId}`);
            const player = await response.json();
            const targetPosition = document.querySelector('.search-input')
                .getAttribute('data-target-position');
            if (targetPosition && player.position === targetPosition) {
                this.updatePlayerSlot(player, targetPosition);
                this.updateSquadStats();
            }
        }
        catch (error) {
            console.error('Error fetching player details:', error);
        }
    }
    updatePlayerSlot(player, position) {
        const slot = this.container.querySelector(`.player-slot[data-position="${position}"]:not(.filled)`);
        if (!slot)
            return;
        slot.innerHTML = `
            <img src="https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo}.png" alt="${player.first_name} ${player.second_name}">
            <div class="name">${player.first_name} ${player.second_name}</div>
            <div class="remove-player">×</div>
        `;
        slot.classList.add('filled');
        slot.setAttribute('data-player-id', player.id.toString());
        const removeButton = slot.querySelector('.remove-player');
        if (removeButton) {
            removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removePlayer(slot);
            });
        }
    }
    removePlayer(slot) {
        const position = slot.getAttribute('data-position');
        slot.innerHTML = `
            <img src="/static/img/shirt.png" alt="Empty slot">
            <div class="name">${position}</div>
        `;
        slot.classList.remove('filled');
        slot.removeAttribute('data-player-id');
        this.updateSquadStats();
    }
    async updateSquadStats() {
        const filledSlots = this.container.querySelectorAll('.player-slot.filled');
        let totalPoints = 0;
        let totalXpts = 0;
        let totalPpg = 0;
        for (const slot of filledSlots) {
            const playerId = slot.getAttribute('data-player-id');
            if (!playerId)
                continue;
            try {
                const response = await fetch(`/api/player/${playerId}`);
                const player = await response.json();
                totalPoints += player.points || 0;
                totalXpts += player.xPts || 0;
                totalPpg += (player.points / (player.minutes / 90)) || 0;
            }
            catch (error) {
                console.error('Error fetching player stats:', error);
            }
        }
        const playerCount = filledSlots.length || 1;
        document.getElementById('total-points').textContent = totalPoints.toString();
        document.getElementById('total-xpts').textContent = totalXpts.toFixed(2);
        document.getElementById('avg-ppg').textContent = (totalPpg / playerCount).toFixed(2);
    }
}
//# sourceMappingURL=SquadBuilder.js.map