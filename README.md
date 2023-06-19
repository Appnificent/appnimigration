# Available commands
```npm run appnimigration init```

## init
Initializes migrations for the project. Creates migration folder and initial migration that creates necessary table in the database.

## create [name]
Creates new migration. After the creation the file is saved in the ```migrations``` folder. Helpers like ```alterTable()`` are available for the migration command.

## migrate [direction]
Runs the migration, direction means up or down. Down is always one step.

# Configuration
Config object should be stored in the root of the project and called ```appnimigration.config.js```. Configuration object should export query method that is used to run queries against the database.

```
module.exports = {
  query: async (query, bind) => {
    const res = await db.query(query, bind);
    return res.recordset;
  },
}
```