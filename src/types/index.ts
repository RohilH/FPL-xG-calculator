export interface Player {
    id: number;
    first_name: string;
    second_name: string;
    team: string;
    position: string;
    photo: string;
    points: number;
    minutes: number;
    ppg: number;
    xPts: number;
    cost: number;
    selected: number;
    form: number;
    goals: number;
    assists: number;
    clean_sheets: number;
    xG: number;
    xA: number;
}

export interface PlayerStats {
    ppg: number;
    points: number;
    xPts: number;
}

export interface GameweekStats {
    points: number;
    minutes: number;
    goals: number;
    assists: number;
    clean_sheets: number;
    xPts: number;
}

export interface Gameweek {
    id: number;
    name: string;
    average_points: number;
    highest_points: number;
    is_current: boolean;
}

export interface ExtendedPlayerStats extends PlayerStats {
    name: string;
    points: number;
    xPts: number;
    ppg: number;
}

export type GameweekCache = Map<string, GameweekStats>;
