const migrationManagerQueries = {
    mssql: {
        insertMigrationQuery: 'INSERT INTO __AppMigrations([Name], [DateTime]) VALUES(@name, GETDATE())',
        lastMigrationDateQuery: 'SELECT TOP 1 [DateTime] FROM __AppMigrations ORDER BY [DateTime] DESC',
        latestMigrationsQuery: 'SELECT * FROM __AppMigrations WHERE [DateTime] = @lastDateTime',
        deleteMigrationQuery: 'DELETE FROM __AppMigrations WHERE [Name] = @name',
        existingMigrationsQuery: 'SELECT * FROM __AppMigrations'
    },
    mysql: {
        insertMigrationQuery: 'INSERT INTO __AppMigrations(`Name`, `DateTime`) VALUES(:name, NOW())',
        lastMigrationDateQuery: 'SELECT TOP 1 `DateTime` FROM __AppMigrations ORDER BY `DateTime` DESC',
        latestMigrationsQuery: 'SELECT * FROM __AppMigrations WHERE `DateTime` = :lastDateTime',
        deleteMigrationQuery: 'DELETE FROM __AppMigrations WHERE `Name` = :name',
        existingMigrationsQuery: 'SELECT * FROM __AppMigrations'
    }
};
export default migrationManagerQueries;
