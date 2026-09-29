import prisma from '../../config/database';
import { CreateAgencyLeadDto, UpdateAgencyLeadStatusDto } from './agency-lead.dto';

export class AgencyLeadService {
  private static toResponse(lead: any) {
    return {
      id: lead.id.toString(),
      fullName: lead.full_name,
      phone: lead.phone,
      area: lead.area,
      message: lead.message,
      status: lead.status,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
    };
  }

  public static async create(data: CreateAgencyLeadDto) {
    const lead = await prisma.agency_leads.create({
      data: {
        full_name: data.fullName.trim(),
        phone: data.phone.trim(),
        area: data.area.trim(),
        message: data.message?.trim() || null,
      },
    });
    return this.toResponse(lead);
  }

  public static async getAll() {
    const leads = await prisma.agency_leads.findMany({ orderBy: { created_at: 'desc' } });
    return leads.map((lead) => this.toResponse(lead));
  }

  public static async updateStatus(id: string, data: UpdateAgencyLeadStatusDto) {
    const lead = await prisma.agency_leads.update({
      where: { id: BigInt(id) },
      data: { status: data.status, updated_at: new Date() },
    });
    return this.toResponse(lead);
  }
}