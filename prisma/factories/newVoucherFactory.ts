import { faker } from '@faker-js/faker';

function newVoucherFactory() {
  return {
    code: faker.internet.password(
      Math.ceil(Math.random() * 100),
      false,
      /^[a-zA-Z0-9]+$/
    ),
    discount: Math.ceil(Math.random() * 100)
  };
};

export default newVoucherFactory;