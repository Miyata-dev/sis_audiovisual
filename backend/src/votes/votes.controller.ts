import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { VotesService } from './votes.service.js';

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Get('active')
  async getActiveVotingEvent() {
    return this.votesService.getActiveVotingEvent();
  }

  // Ruta para verificar si el usuario ya votó
  @Get('check')
  async checkUserVote(
    @Query('userId') userId: string,
    @Query('votingEventId') votingEventId: string,
  ) {
    return this.votesService.checkUserVote(Number(userId), Number(votingEventId));
  }

  @Post()
  async emitirVoto(
    @Body('userId') userId: number,
    @Body('votingEventId') votingEventId: number,
    @Body('option') option: string,
  ) {
    return this.votesService.emitirVoto(userId, votingEventId, option);
  }
}