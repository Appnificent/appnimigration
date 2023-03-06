import { createTableIfNotExist, Migration } from 'appnimigration';

const command = createTableIfNotExist('__AppMigrations')
                  .addColumn('Name').type('nvarchar(255)').primary
                  .addColumn('DateTime').datetime2.default('GETDATE()');

export default new Migration(command);