import { createTableIfNotExist, Migration, CURRENT_DATE } from '@appnificent/appnimigration';

const command = createTableIfNotExist('__AppMigrations')
                  .addColumn('Name').string(255).primary
                  .addColumn('DateTime').datetime.default(CURRENT_DATE);

export default new Migration(command);