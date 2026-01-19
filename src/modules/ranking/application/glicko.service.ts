import { Injectable, Logger } from '@nestjs/common';
import { Glicko2, Glicko2Settings } from 'glicko2';
import {
  PlayerRatingData,
  MatchPlayerInput,
  PlayerRatingResult,
  TeamRating,
  MatchCalculationResult,
} from '../domain/rating.interface';

@Injectable()
export class GlickoService {
  private readonly logger = new Logger(GlickoService.name);

  private readonly glickoSettings: Glicko2Settings = {
    tau: 0.5,      // System constant - controls volatility change rate
    rating: 1500,  // Default rating for new players
    rd: 350,       // Default rating deviation for new players
    vol: 0.06,     // Default volatility for new players
  };

  calculateDoublesMatch(
    matchId: string,
    players: MatchPlayerInput[],
    playerRatings: Map<string, PlayerRatingData>,
  ): MatchCalculationResult {
    this.logger.log(`[Glicko] Calculating ratings for match ${matchId} with ${players.length} players`);

    // Separate players by team
    const team1Players = players.filter(p => p.team === 1);
    const team2Players = players.filter(p => p.team === 2);

    if (team1Players.length === 0 || team2Players.length === 0) {
      throw new Error('Both teams must have at least one player');
    }

    // Get team ratings from player data
    const team1 = this.calculateTeamRating(1, team1Players, playerRatings);
    const team2 = this.calculateTeamRating(2, team2Players, playerRatings);

    this.logger.log(`[Glicko] Team 1 Rating: ${team1.combinedRating.toFixed(2)}, RD: ${team1.combinedRd.toFixed(2)}`);
    this.logger.log(`[Glicko] Team 2 Rating: ${team2.combinedRating.toFixed(2)}, RD: ${team2.combinedRd.toFixed(2)}`);

    const team1Result = team1Players[0].result;
    const matchOutcome = team1Result === 'WIN' ? 1 : team1Result === 'LOSE' ? 0 : 0.5;

    // Create Glicko-2 ranking system for team-level calculation
    const ranking = new Glicko2(this.glickoSettings);

    // Create virtual players for each team
    const glickoTeam1 = ranking.makePlayer(team1.combinedRating, team1.combinedRd, team1.combinedVolatility);
    const glickoTeam2 = ranking.makePlayer(team2.combinedRating, team2.combinedRd, team2.combinedVolatility);

    // Add match result
    ranking.addMatch(glickoTeam1, glickoTeam2, matchOutcome);

    // Calculate new ratings
    ranking.calculatePlayersRatings();

    // Get new team ratings
    const newTeam1Rating = glickoTeam1.getRating();
    const newTeam1Rd = glickoTeam1.getRd();
    const newTeam1Vol = glickoTeam1.getVol();

    const newTeam2Rating = glickoTeam2.getRating();
    const newTeam2Rd = glickoTeam2.getRd();
    const newTeam2Vol = glickoTeam2.getVol();

    // Calculate rating changes for teams
    const team1RatingChange = newTeam1Rating - team1.combinedRating;
    const team2RatingChange = newTeam2Rating - team2.combinedRating;

    this.logger.log(`[Glicko] Team 1 change: ${team1RatingChange > 0 ? '+' : ''}${team1RatingChange.toFixed(2)}`);
    this.logger.log(`[Glicko] Team 2 change: ${team2RatingChange > 0 ? '+' : ''}${team2RatingChange.toFixed(2)}`);

    // Distribute rating changes to individual players
    const playerResults: PlayerRatingResult[] = [];

    // Process Team 1 players
    for (const player of team1Players) {
      const result = this.calculatePlayerNewRating(
        player,
        playerRatings.get(player.id)!,
        team1,
        team1RatingChange,
        newTeam1Rd,
        newTeam1Vol,
        team2, // opponent team
      );
      playerResults.push(result);
    }

    // Process Team 2 players
    for (const player of team2Players) {
      const result = this.calculatePlayerNewRating(
        player,
        playerRatings.get(player.id)!,
        team2,
        team2RatingChange,
        newTeam2Rd,
        newTeam2Vol,
        team1, // opponent team
      );
      playerResults.push(result);
    }

    return {
      matchId,
      playerResults,
      team1Rating: newTeam1Rating,
      team2Rating: newTeam2Rating,
      processedAt: new Date(),
    };
  }

  private calculateTeamRating(
    teamNumber: number,
    teamPlayers: MatchPlayerInput[],
    playerRatings: Map<string, PlayerRatingData>,
  ): TeamRating {
    const players: PlayerRatingData[] = [];
    let totalRating = 0;
    let totalRd = 0;
    let totalVol = 0;

    for (const player of teamPlayers) {
      const playerData = playerRatings.get(player.id);
      if (!playerData) {
        // Create default rating for new player
        const defaultPlayer: PlayerRatingData = {
          id: player.id,
          rating: this.glickoSettings.rating!,
          ratingDeviation: this.glickoSettings.rd!,
          volatility: this.glickoSettings.vol!,
        };
        players.push(defaultPlayer);
        totalRating += defaultPlayer.rating;
        totalRd += defaultPlayer.ratingDeviation;
        totalVol += defaultPlayer.volatility;
      } else {
        players.push(playerData);
        totalRating += playerData.rating;
        totalRd += playerData.ratingDeviation;
        totalVol += playerData.volatility;
      }
    }

    const count = players.length;
    return {
      teamNumber,
      players,
      combinedRating: totalRating / count,
      combinedRd: totalRd / count,
      combinedVolatility: totalVol / count,
    };
  }

  private calculatePlayerNewRating(
    player: MatchPlayerInput,
    playerData: PlayerRatingData,
    team: TeamRating,
    teamRatingChange: number,
    newTeamRd: number,
    newTeamVol: number,
    opponentTeam: TeamRating,
  ): PlayerRatingResult {
    const ratingBefore = playerData.rating;
    const rdBefore = playerData.ratingDeviation;
    const volBefore = playerData.volatility;

    const ratingAfter = ratingBefore + teamRatingChange;

    // Calculate new RD - proportional to team RD change
    const rdRatio = newTeamRd / team.combinedRd;
    const rdAfter = Math.max(30, Math.min(350, rdBefore * rdRatio));

    // Calculate new volatility - proportional to team volatility change
    const volRatio = newTeamVol / team.combinedVolatility;
    const volatilityAfter = Math.max(0.03, Math.min(0.15, volBefore * volRatio));

    return {
      playerId: player.id,
      team: player.team,
      result: player.result,
      ratingBefore,
      ratingAfter,
      ratingChange: teamRatingChange,
      rdBefore,
      rdAfter,
      volatilityBefore: volBefore,
      volatilityAfter: volatilityAfter,
      opponentRating: opponentTeam.combinedRating,
      opponentRd: opponentTeam.combinedRd,
    };
  }

  calculateSinglesMatch(
    matchId: string,
    player1: MatchPlayerInput,
    player2: MatchPlayerInput,
    player1Rating: PlayerRatingData,
    player2Rating: PlayerRatingData,
  ): MatchCalculationResult {
    this.logger.log(`[Glicko] Calculating singles match ${matchId}`);

    const ranking = new Glicko2(this.glickoSettings);

    const glickoPlayer1 = ranking.makePlayer(
      player1Rating.rating,
      player1Rating.ratingDeviation,
      player1Rating.volatility,
    );
    const glickoPlayer2 = ranking.makePlayer(
      player2Rating.rating,
      player2Rating.ratingDeviation,
      player2Rating.volatility,
    );

    const outcome = player1.result === 'WIN' ? 1 : player1.result === 'LOSE' ? 0 : 0.5;

    ranking.addMatch(glickoPlayer1, glickoPlayer2, outcome);
    ranking.calculatePlayersRatings();

    const results: PlayerRatingResult[] = [
      {
        playerId: player1.id,
        team: player1.team,
        result: player1.result,
        ratingBefore: player1Rating.rating,
        ratingAfter: glickoPlayer1.getRating(),
        ratingChange: glickoPlayer1.getRating() - player1Rating.rating,
        rdBefore: player1Rating.ratingDeviation,
        rdAfter: glickoPlayer1.getRd(),
        volatilityBefore: player1Rating.volatility,
        volatilityAfter: glickoPlayer1.getVol(),
        opponentRating: player2Rating.rating,
        opponentRd: player2Rating.ratingDeviation,
      },
      {
        playerId: player2.id,
        team: player2.team,
        result: player2.result,
        ratingBefore: player2Rating.rating,
        ratingAfter: glickoPlayer2.getRating(),
        ratingChange: glickoPlayer2.getRating() - player2Rating.rating,
        rdBefore: player2Rating.ratingDeviation,
        rdAfter: glickoPlayer2.getRd(),
        volatilityBefore: player2Rating.volatility,
        volatilityAfter: glickoPlayer2.getVol(),
        opponentRating: player1Rating.rating,
        opponentRd: player1Rating.ratingDeviation,
      },
    ];

    return {
      matchId,
      playerResults: results,
      team1Rating: glickoPlayer1.getRating(),
      team2Rating: glickoPlayer2.getRating(),
      processedAt: new Date(),
    };
  }

  getDefaultRating(): PlayerRatingData {
    return {
      id: '',
      rating: this.glickoSettings.rating!,
      ratingDeviation: this.glickoSettings.rd!,
      volatility: this.glickoSettings.vol!,
    };
  }

  calculateRdDecay(lastMatchAt: Date | null, currentRd: number): number {
    if (!lastMatchAt) {
      return currentRd;
    }

    const daysSinceLastMatch = Math.floor(
      (Date.now() - lastMatchAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Increase RD by approximately 1.5 per day of inactivity, capped at 350
    const rdIncrease = daysSinceLastMatch * 1.5;
    return Math.min(350, currentRd + rdIncrease);
  }
}
