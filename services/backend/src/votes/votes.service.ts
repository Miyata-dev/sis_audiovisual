import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class VotesService {
  
  async getActiveVotingEvent(sessionId?: number) {
    const whereClause: any = { status: 'ACTIVO' };
    if (sessionId) {
      whereClause.sessionId = sessionId;
    }
    
    const activeEvent = await prisma.votingEvent.findFirst({
      where: whereClause,
      orderBy: { id: 'desc' },
    });
    
    return activeEvent || null;
  }

  async checkUserVote(userId: number, votingEventId: number) {
    const voto = await prisma.vote.findUnique({
      where: { userId_votingEventId: { userId, votingEventId } },
    });
    return { hasVoted: !!voto, option: voto?.option || null };
  }

  async emitirVoto(userId: number, votingEventId: number, option: string) {
    try {
      // 1. Candado de seguridad por Rol
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { Role: true } });
      const roleName = user?.Role?.name?.toLowerCase() || '';
      if (roleName.includes('presidente') || roleName.includes('admin')) {
         throw new BadRequestException('Acción denegada: El Presidente no puede emitir votos.');
      }

      const votoExistente = await prisma.vote.findUnique({
        where: { userId_votingEventId: { userId, votingEventId } },
      });
      if (votoExistente) throw new BadRequestException('El usuario ya ha emitido un voto en este tema.');

      const nuevoVoto = await prisma.vote.create({
        data: { userId, votingEventId, option },
      });
      return { success: true, data: nuevoVoto };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }
  
  async registrarAsistencia(userId: number, sessionId: number) {
    //Candado de seguridad por Rol
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { Role: true } });
    const roleName = user?.Role?.name?.toLowerCase() || '';
    if (roleName.includes('presidente') || roleName.includes('admin')) {
       throw new BadRequestException('El Presidente no suma en la asistencia de los 29 Consejeros.');
    }

    const existe = await prisma.attendance.findUnique({
      where: { userId_sessionId: { userId, sessionId } },
    });
    if (existe) return { success: true, message: 'Asistencia ya registrada' };

    await prisma.attendance.create({ data: { userId, sessionId } });
    return { success: true };
  }

  async solicitarPalabra(userId: number, sessionId: number) {
    //Candado de seguridad por Rol
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { Role: true } });
    const roleName = user?.Role?.name?.toLowerCase() || '';
    if (roleName.includes('presidente') || roleName.includes('admin')) {
       throw new BadRequestException('El Presidente no necesita pedir la palabra en la cola.');
    }

    await prisma.speakingRequest.create({
      data: { userId, sessionId, status: 'PENDIENTE' },
    });
    return { success: true };
  }
  
  async cancelarPalabra(userId: number, sessionId: number) {
    await prisma.speakingRequest.deleteMany({
      where: { userId, sessionId, status: { in: ['PENDIENTE', 'HABLANDO'] } },
    });
    return { success: true };
  }
  
  async getUserSessionStatus(userId: number, sessionId: number) {
    const asistencia = await prisma.attendance.findUnique({
      where: { userId_sessionId: { userId, sessionId } },
    });
    const palabra = await prisma.speakingRequest.findFirst({
      where: { userId, sessionId, status: { in: ['PENDIENTE', 'HABLANDO'] } },
    });
    return {
      presente: !!asistencia,
      palabraSolicitada: !!palabra,
      estadoPalabra: palabra ? palabra.status : null,
    };
  }
  
  async getLiveDashboard(requestedSessionId?: number) {
    let sessionId = requestedSessionId;

    if (!sessionId) {
      const ultimaSesion = await prisma.session.findFirst({
        orderBy: { id: 'desc' }
      });
      if (!ultimaSesion) {
        return { evento: null, resultados: {}, asistentes: [], solicitudes: [], historial: [] };
      }
      sessionId = ultimaSesion.id;
    }

    const eventoEnEstaSesion = await prisma.votingEvent.findFirst({
      where: { 
        status: 'ACTIVO',
        sessionId: sessionId 
      },
      orderBy: { id: 'desc' },
    });

    let conteoVotos: any[] = [];
    if (eventoEnEstaSesion) {
      conteoVotos = await prisma.vote.findMany({
        where: { votingEventId: eventoEnEstaSesion.id },
        select: { option: true },
      });
    }

    const asistencia = await prisma.attendance.findMany({
      where: { sessionId: sessionId },
      include: { User: { select: { name: true } } },
    });

    const colaPalabra = await prisma.speakingRequest.findMany({
      where: { sessionId: sessionId, status: { in: ['PENDIENTE', 'HABLANDO'] } },
      orderBy: { requestedAt: 'asc' },
      include: { User: { select: { name: true } } },
    });

    const temasFinalizados = await prisma.votingEvent.findMany({
      where: { status: 'FINALIZADO', sessionId: sessionId },
      orderBy: { id: 'desc' },
    });
    
    const todosLosVotosHistorial = await prisma.vote.findMany({
      where: { votingEventId: { in: temasFinalizados.map(t => t.id) } }
    });

    const historial = temasFinalizados.map(tema => {
      const votosTema = todosLosVotosHistorial.filter(v => v.votingEventId === tema.id);
      const resultados = votosTema.reduce((acc, curr) => {
        acc[curr.option] = (acc[curr.option] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return { id: tema.id, title: tema.title, resultados, totalVotos: votosTema.length };
    });

    return {
      evento: eventoEnEstaSesion, 
      resultados: conteoVotos.reduce((acc, curr) => {
        acc[curr.option] = (acc[curr.option] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      asistentes: asistencia.map(a => a.User.name),
      solicitudes: colaPalabra.map(p => ({
        id: p.id, nombre: p.User.name, hora: p.requestedAt, status: p.status,
      })),
      historial,
    };
  }
  
  async crearVotacion(title: string, sessionId: number) {
    const activaEnEstaSesion = await prisma.votingEvent.findFirst({ 
      where: { status: 'ACTIVO', sessionId: sessionId } 
    });
    
    if (activaEnEstaSesion) throw new BadRequestException('Ya existe un tema activo en esta sesión. Ciérralo primero.');
    
    const nuevoEvento = await prisma.votingEvent.create({ data: { title, sessionId, status: 'ACTIVO' } });
    return { success: true, data: nuevoEvento };
  }

  async otorgarPalabra(solicitudId: number) {
    await prisma.speakingRequest.updateMany({
      where: { status: 'HABLANDO' },
      data: { status: 'FINALIZADO' },
    });
    const solicitud = await prisma.speakingRequest.update({
      where: { id: solicitudId },
      data: { status: 'HABLANDO' },
    });
    return { success: true, data: solicitud };
  }

  async terminarPalabra(solicitudId: number) {
    const solicitud = await prisma.speakingRequest.update({
      where: { id: solicitudId },
      data: { status: 'FINALIZADO' },
    });
    return { success: true, data: solicitud };
  }
  
  async cerrarVotacion(votingEventId: number) {
    const evento = await prisma.votingEvent.findUnique({ where: { id: votingEventId } });
    if (!evento) throw new NotFoundException('Evento no encontrado');

    const eventoCerrado = await prisma.votingEvent.update({
      where: { id: votingEventId },
      data: { status: 'FINALIZADO' },
    });

    await prisma.speakingRequest.updateMany({
      where: { sessionId: evento.sessionId, status: { in: ['PENDIENTE', 'HABLANDO'] } },
      data: { status: 'FINALIZADO' },
    });
    return { success: true, data: eventoCerrado };
  }

  async getSessions() {
    return prisma.session.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async createSession(title: string, theme: string) {
    return prisma.session.create({
      data: {
        title,
        theme, 
        status: 'ABIERTA',
      },
    });
  }

  async finalizarSesionCompleta(sessionId: number) {
    await prisma.votingEvent.updateMany({
      where: { sessionId: sessionId, status: 'ACTIVO' },
      data: { status: 'FINALIZADO' }
    });

    await prisma.speakingRequest.updateMany({
      where: { sessionId: sessionId, status: { in: ['PENDIENTE', 'HABLANDO'] } },
      data: { status: 'FINALIZADO' },
    });

    return prisma.session.update({
      where: { id: sessionId },
      data: { status: 'FINALIZADA' },
    });
  }
  async generarReporteVotacion(votingEventId: number) {
    const evento = await prisma.votingEvent.findUnique({
      where: { id: votingEventId },
      include: { Session: true }
    });
    
    if (!evento) throw new NotFoundException('Evento de votación no encontrado');

    // Obtenemos todos los votos con el nombre del Consejero que lo emitió
    const votos = await prisma.vote.findMany({
      where: { votingEventId },
      include: { User: { select: { name: true } } },
      orderBy: { timestamp: 'asc' }
    });

    // Contamos los totales
    let favor = 0, contra = 0, abstencion = 0;
    votos.forEach(v => {
      if (v.option === 'favor') favor++;
      if (v.option === 'contra') contra++;
      if (v.option === 'abstencion') abstencion++;
    });

    // Armamos el archivo CSV 
    let csv = '\uFEFF'; 
    csv += `REPORTE OFICIAL DE VOTACION\n\n`;
    csv += `Sesion:,"${evento.Session.title}"\n`;
    csv += `Tema General:,"${evento.Session.theme || 'Sin tema'}"\n`;
    csv += `Materia Votada:,"${evento.title}"\n`;
    csv += `Estado:,"${evento.status}"\n\n`;
    
    csv += `RESUMEN DE VOTOS\n`;
    csv += `A Favor:,${favor}\n`;
    csv += `En Contra:,${contra}\n`;
    csv += `Abstencion:,${abstencion}\n`;
    csv += `Total Votos Emitidos:,${votos.length}\n\n`;

    csv += `DETALLE DE CONSEJEROS\n`;
    csv += `Nombre Consejero,Voto Emitido,Fecha y Hora (Local)\n`;

    votos.forEach(v => {
      const fecha = new Date(v.timestamp).toLocaleString('es-CL');
      csv += `"${v.User.name}","${v.option.toUpperCase()}","${fecha}"\n`;
    });

    return { success: true, csv };
  }
  async generarReporteSesionCompleta(sessionId: number) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    const eventos = await prisma.votingEvent.findMany({
      where: { sessionId, status: 'FINALIZADO' },
      include: {
        Vote: { include: { User: { select: { name: true } } }, orderBy: { timestamp: 'asc' } }
      }
    });

    let csv = '\uFEFF'; // Para que Excel lea los tildes
    csv += `REPORTE CONSOLIDADO DE VOTACIONES\n\n`;
    csv += `Sesion:,"${session.title}"\n`;
    csv += `Tema General:,"${session.theme || 'Sin tema'}"\n`;
    csv += `Fecha de emision:,"${new Date().toLocaleString('es-CL')}"\n\n`;

    if (eventos.length === 0) {
      csv += `No se registraron votaciones en esta sesion.\n`;
      return { success: true, csv };
    }

    // Iteramos sobre todos los temas votados en esa sesión
    for (const evento of eventos) {
      csv += `------------------------------------------------\n`;
      csv += `Materia Votada:,"${evento.title}"\n`;
      
      let favor = 0, contra = 0, abstencion = 0;
      evento.Vote.forEach(v => {
        if (v.option === 'favor') favor++;
        if (v.option === 'contra') contra++;
        if (v.option === 'abstencion') abstencion++;
      });

      csv += `A Favor:,${favor}\n`;
      csv += `En Contra:,${contra}\n`;
      csv += `Abstencion:,${abstencion}\n`;
      csv += `Total Votos Emitidos:,${evento.Vote.length}\n\n`;

      csv += `Detalle de Consejeros:\n`;
      csv += `Nombre Consejero,Voto Emitido,Fecha y Hora (Local)\n`;
      evento.Vote.forEach(v => {
        const fecha = new Date(v.timestamp).toLocaleString('es-CL');
        csv += `"${v.User.name}","${v.option.toUpperCase()}","${fecha}"\n`;
      });
      csv += `\n\n`;
    }

    return { success: true, csv };
  }
}