import services from '../../src/services/voucherService';
import prisma from '../../src/config/database';
import newVoucherFactory from '../../prisma/factories/newVoucherFactory';

beforeEach(async () => {
  await prisma.$queryRaw`TRUNCATE TABLE vouchers CASCADE`;
  await prisma.$queryRaw`ALTER SEQUENCE vouchers_id_seq RESTART WITH 1`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Testing voucher services...', () => {
  it('Creating voucher...',  async () => {
    const body = newVoucherFactory();
    await services.createVoucher(body.code, body.discount);
    const results = await prisma.voucher.findFirst({
      where: {
        code: body.code,
        discount: body.discount
      }
    });
    expect(results).toBeTruthy();
  });

  it('Attempting to create existing voucher...', async () => {
    const voucher = newVoucherFactory();
    await prisma.voucher.create({
      data: {
        code: voucher.code,
        discount: voucher.discount
      }
    });
    let results = false;
    try {
      await services.createVoucher(voucher.code, voucher.discount);
    } catch (err) {
      if (err.message === 'Voucher already exist.') {
        results = true;
      }
    }
    expect(results).toBe(true);
  });

  it('Applying voucher...', async() => {
    const voucher = newVoucherFactory();
    await prisma.voucher.create({
      data: {
        code: voucher.code,
        discount: voucher.discount
      }
    });
    const amount = 100 + Math.ceil(Math.random() * 100);
    const finalAmount = amount * (1 - voucher.discount / 100);
    const results = await services.applyVoucher(voucher.code, amount);
    const usedVoucher = await prisma.voucher.findUnique({
      where: { code: voucher.code }
    });
    expect(results).toEqual({
      amount,
      discount: voucher.discount,
      finalAmount,
      applied: finalAmount !== amount
    });
    expect(usedVoucher.used).toBe(true);
  });
  it('Applying voucher to a less than 100 amount...', async() => {
    const voucher = newVoucherFactory();
    await prisma.voucher.create({
      data: {
        code: voucher.code,
        discount: voucher.discount
      }
    });
    const amount = Math.ceil(Math.random() * 100);
    const results = await services.applyVoucher(voucher.code, amount);
    const usedVoucher = await prisma.voucher.findUnique({
      where: { code: voucher.code }
    });
    expect(results).toEqual({
      amount,
      discount: voucher.discount,
      finalAmount: amount,
      applied: false
    });
    expect(usedVoucher.used).toBe(false);
  });
  it('Applying inexistant voucher...', async () => {
    const voucher = newVoucherFactory();
    const amount = Math.ceil(Math.random() * 100);
    let results = false;
    try {
      await services.applyVoucher(voucher.code, amount);
    } catch (err) {
      if (err.message === 'Voucher does not exist.') results = true;
    }
    expect(results).toBe(true);
  })
});
