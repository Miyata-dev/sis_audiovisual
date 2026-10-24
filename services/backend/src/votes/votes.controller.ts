import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { VotesService } from './votes.service.js';

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  // CORRECCIÓN: Ahora pide el sessionId para buscar la votación activa de esa sesión
  @Get('active')
  async getActiveVotingEvent(@Query('sessionId') sessionId?: string) {
    const id = sessionId && sessionId !== 'nueva' ? parseInt(sessionId) : undefined;
    return this.votesService.getActiveVotingEvent(id);
  }

  @Get('check')
  async checkUserVote(
    @Query('userId') userId: string,
    @Query('votingEventId') votingEventId: string,
  ) {
    return this.votesService.checkUserVote(Number(userId), Number(votingEventId));
  }
  
  @Get('user-status')
  async getUserStatus(
    @Query('userId') userId: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.votesService.getUserSessionStatus(Number(userId), Number(sessionId));
  }
  
  @Get('dashboard/live')
  async getLiveDashboard(@Query('sessionId') sessionId?: string) {
    const id = sessionId && sessionId !== 'nueva' ? parseInt(sessionId) : undefined;
    return this.votesService.getLiveDashboard(id);
  }
  
  @Get('sessions')
  async getSessions() {
    return this.votesService.getSessions();
  }
  @Get('report')
  async generarReporte(@Query('votingEventId') votingEventId: string) {
    return this.votesService.generarReporteVotacion(Number(votingEventId));
  }
  @Get('report/session')
  async generarReporteSesion(@Query('sessionId') sessionId: string) {
    return this.votesService.generarReporteSesionCompleta(Number(sessionId));
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
  
  @Post('create')
  async crearVotacion(
    @Body('title') title: string,
    @Body('sessionId') sessionId: number,
  ) {
    return this.votesService.crearVotacion(title, sessionId || 3);
  }
  
  @Post('sessions/create')
  async createSession(
    @Body('title') title: string,
    @Body('theme') theme: string 
  ) {
    return this.votesService.createSession(title, theme);
  }

  @Post('sessions/close')
  async finalizarSesionCompleta(@Body('sessionId') sessionId: number) {
    return this.votesService.finalizarSesionCompleta(sessionId);
  }
}