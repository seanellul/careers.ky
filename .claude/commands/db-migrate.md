---
description: Create and run a database migration
---

Help create and execute a database migration for careers.ky:

1. **Name**: Ask the user what the migration does (e.g., "add employer_logo column") if not provided as an argument.

2. **Create file**: Generate a new SQL migration file in `migrations/` with a timestamp prefix:
   - Filename format: `YYYYMMDD_HHMMSS_description.sql`
   - Include both `-- UP` and `-- DOWN` sections
   - Write the SQL for the requested schema change

3. **Review**: Show the migration SQL and ask the user to confirm before running.

4. **Execute**: Run the UP migration against the dev database using the project's database connection.

5. **Verify**: Query the database to confirm the migration was applied correctly (e.g., check table schema, row counts).

If the migration fails, show the error and offer to run the DOWN section to rollback.
