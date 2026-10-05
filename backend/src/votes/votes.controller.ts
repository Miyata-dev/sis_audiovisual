import { Controller, Post, Body } from '@nestjs/common';
import { VotesService } from './votes.service.js';
@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  async emitirVoto(
    @Body('userId') userId: number,
    @Body('votingEventId') votingEventId: number,
    @Body('option') option: string,
  ) {
    return this.votesService.emitirVoto(userId, votingEventId, option);
  }
}