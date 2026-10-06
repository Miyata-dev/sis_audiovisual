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
  // Ruta para verificar asistencia y palabra al recargar
  @Get('user-status')
  async getUserStatus(
    @Query('userId') userId: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.votesService.getUserSessionStatus(Number(userId), Number(sessionId));
  }
  @Get('dashboard/live')
  async getLiveDashboard() {
    return this.votesService.getLiveDashboard();
  }

  @Post()
  async emitirVoto(
    @Body('userId') userId: number,
    @Body('votingEventId') votingEventId: number,
    @Body('option') option: string,
  ) {
    return this.votesService.emitirVoto(userId, votingEventId, option);
  }

  @Post('attendance')
  async registrarAsistencia(
    @Body('userId') userId: number,
    @Body('sessionId') sessionId: number,
  ) {
    return this.votesService.registrarAsistencia(userId, sessionId);
  }

  @Post('speak')
  async solicitarPalabra(
    @Body('userId') userId: number,
    @Body('sessionId') sessionId: number,
  ) {
    return this.votesService.solicitarPalabra(userId, sessionId);
  }
  @Post('speak/cancel')
  async cancelarPalabra(
    @Body('userId') userId: number,
    @Body('sessionId') sessionId: number,
  ) {
    return this.votesService.cancelarPalabra(userId, sessionId);
  }
  @Post('close')
  async cerrarVotacion(@Body('votingEventId') votingEventId: number) {
    return this.votesService.cerrarVotacion(votingEventId);
  }
  @Post('speak/grant')
  async otorgarPalabra(@Body('solicitudId') solicitudId: number) {
    return this.votesService.otorgarPalabra(solicitudId);
  }

  @Post('speak/end')
  async terminarPalabra(@Body('solicitudId') solicitudId: number) {
    return this.votesService.terminarPalabra(solicitudId);
  }
}