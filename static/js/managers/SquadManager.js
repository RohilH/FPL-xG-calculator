export class SquadManager {
    constructor() {
        this.squadPlayers = new Map();
        this.currentSlot = null;
    }
    openSearch(position, slot) {
        this.currentSlot = slot;
        const searchInput = document.querySelector('#searchInput');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
            searchInput.setAttribute('data-target-position', position);
        }
    }
    async addPlayer(player, slot) {
        try {
            const response = await fetch(`/api/player/${player.id}`);
            const playerData = await response.json();
            const displayStats = {
                ppg: playerData.points / (playerData.minutes / 90),
                points: playerData.points,
                xPts: playerData.xPts
            };
            const playerWithStats = {
                ...player,
                currentStats: displayStats
            };
            this.squadPlayers.set(slot, playerWithStats);
            this.updateSlot(slot, playerWithStats);
            this.updateSquadStats();
        }
        catch (error) {
            console.error('Error fetching player stats:', error);
        }
    }
    removePlayer(event, slot) {
        event.stopPropagation();
        this.squadPlayers.delete(slot);
        this.resetSlot(slot);
        this.updateSquadStats();
    }
    resetSquad() {
        this.squadPlayers.clear();
        document.querySelectorAll('.position-slot').forEach(slot => {
            this.resetSlot(slot);
        });
        this.updateSquadStats();
    }
    updateSlot(slot, player) {
        const position = slot.getAttribute('data-position');
        slot.innerHTML = `
            <div class="player-card">
                <img class="player-photo" 
                     src="https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo}.png"
                     onerror="this.src='https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png'"
                     alt="${player.first_name} ${player.second_name}">
                <div class="player-info-box">
                    <div class="player-name">${player.first_name} ${player.second_name}</div>
                    <div class="player-team">${player.team}</div>
                </div>
                <div class="player-ppg">${player.currentStats.ppg.toFixed(2)}</div>
                <div class="remove-player">×</div>
            </div>
        `;
        slot.classList.add('filled');
        const removeButton = slot.querySelector('.remove-player');
        if (removeButton) {
            removeButton.addEventListener('click', (e) => this.removePlayer(e, slot));
        }
    }
    resetSlot(slot) {
        const position = slot.getAttribute('data-position');
        slot.innerHTML = `<span>${position}</span>`;
        slot.classList.remove('filled');
    }
    updateSquadStats() {
        let totalPoints = 0;
        let totalXpts = 0;
        let totalPpg = 0;
        let playerCount = 0;
        this.squadPlayers.forEach(player => {
            totalPoints += player.currentStats.points;
            totalXpts += player.currentStats.xPts;
            totalPpg += player.currentStats.ppg;
            playerCount++;
        });
        const avgPpg = playerCount > 0 ? totalPpg / playerCount : 0;
        document.getElementById('totalPoints').textContent = totalPoints.toString();
        document.getElementById('totalXpts').textContent = totalXpts.toFixed(2);
        document.getElementById('avgPpg').textContent = avgPpg.toFixed(2);
    }
}
//# sourceMappingURL=SquadManager.js.map