import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

const config: ReturnType<typeof definePrismaConfig<{
  orm: ReturnType<typeof ormConfig>;
}>> = definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: process.env['DIRECT_URL']!,
    },
  }),
});

export default config;
