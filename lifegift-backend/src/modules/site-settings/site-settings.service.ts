import prisma from '../../config/database';
import { UpdateSiteSettingsDto } from './site-settings.dto';

const defaults = {
  phonePrimary: '0907754688',
  phoneSecondary: '0911730069',
  email: 'quatangcuocsong5524@gmail.com',
  address: 'Lô 5 tầng 1, CT1B Mễ Trì Plaza VOV, P. Đại Mỗ, TP. Hà Nội',
  mapQuery: 'Lô 5 tầng 1, CT1B Mễ Trì Plaza VOV, P. Đại Mỗ, Hà Nội',
  hanoiFee: 25000,
  majorCityFee: 35000,
  otherProvinceFee: 45000,
  freeShippingThreshold: 600000,
  bankName: 'Ngân hàng demo',
  bankAccount: 'Đang cập nhật',
  bankOwner: 'LIFEGIFT',
};

function toDatabase(data: UpdateSiteSettingsDto) {
  return {
    phone_primary: data.phonePrimary,
    phone_secondary: data.phoneSecondary,
    email: data.email,
    address: data.address,
    map_query: data.mapQuery,
    hanoi_fee: data.hanoiFee,
    major_city_fee: data.majorCityFee,
    other_province_fee: data.otherProvinceFee,
    free_shipping_threshold: data.freeShippingThreshold,
    bank_name: data.bankName,
    bank_account: data.bankAccount,
    bank_owner: data.bankOwner,
  };
}

function toResponse(settings: any) {
  return {
    phonePrimary: settings.phone_primary,
    phoneSecondary: settings.phone_secondary,
    email: settings.email,
    address: settings.address,
    mapQuery: settings.map_query,
    hanoiFee: settings.hanoi_fee,
    majorCityFee: settings.major_city_fee,
    otherProvinceFee: settings.other_province_fee,
    freeShippingThreshold: settings.free_shipping_threshold,
    bankName: settings.bank_name,
    bankAccount: settings.bank_account,
    bankOwner: settings.bank_owner,
  };
}

export class SiteSettingsService {
  public static async get() {
    const values = toDatabase(defaults);
    const settings = await prisma.site_settings.upsert({
      where: { id: 1 },
      create: { id: 1, ...values },
      update: {},
    });
    return toResponse(settings);
  }

  public static async update(data: UpdateSiteSettingsDto) {
    const settings = await prisma.site_settings.upsert({
      where: { id: 1 },
      create: { id: 1, ...toDatabase(data) },
      update: { ...toDatabase(data), updated_at: new Date() },
    });
    return toResponse(settings);
  }
}