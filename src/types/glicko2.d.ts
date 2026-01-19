// Type definitions for glicko2
// Project: https://github.com/mmai/glicko2js

declare module 'glicko2' {
  export interface Glicko2Settings {
    /** The system constant (τ) which constrains the change in volatility over time. Default: 0.5 */
    tau?: number;
    /** Default rating for new players. Default: 1500 */
    rating?: number;
    /** Default rating deviation for new players. Default: 350 */
    rd?: number;
    /** Default volatility for new players. Default: 0.06 */
    vol?: number;
  }

  export interface PlayerRating {
    /** Get the player's rating */
    getRating(): number;
    /** Set the player's rating */
    setRating(rating: number): void;
    /** Get the player's rating deviation */
    getRd(): number;
    /** Set the player's rating deviation */
    setRd(rd: number): void;
    /** Get the player's volatility */
    getVol(): number;
    /** Set the player's volatility */
    setVol(vol: number): void;
    /** Get the player's ID */
    id?: string | number;
    /** Outcome history */
    outcomes?: Array<[PlayerRating, number]>;
    /** Add a result against another player */
    addResult(opponent: PlayerRating, score: number): void;
    /** Update the player's rating based on the outcomes */
    update(): void;
  }

  export type RaceResult = [PlayerRating[], number];
  export type MatchResult = [PlayerRating, PlayerRating, number];

  export class Glicko2 {
    constructor(settings?: Glicko2Settings);
    
    /** Create a new player with optional initial values */
    makePlayer(rating?: number, rd?: number, vol?: number): PlayerRating;
    
    /** Create a race (for free-for-all type competitions) */
    makeRace(results: RaceResult[]): void;
    
    /** Update ratings after a rating period */
    calculatePlayersRatings(): void;
    
    /** Get match outcomes as tuples */
    addMatch(player1: PlayerRating, player2: PlayerRating, outcome: number): void;
    
    /** Get the list of all players */
    getPlayers(): PlayerRating[];
    
    /** Remove all outcomes (for testing) */
    removePlayers(): void;
  }

  export default Glicko2;
}
