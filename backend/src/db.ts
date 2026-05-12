import { Pool } from "pg";

/**
 * PostgreSQL
 */
export const pool = new Pool({

  host: "localhost",

  port: 5432,

  user: "postgres",

  password: "1234",

  database: "couture_db",
});

pool.connect()

  .then(() => {

    console.log(
      "✅ Connecté à PostgreSQL"
    );
  })

  .catch((err) => {

    console.error(
      "❌ Erreur PostgreSQL :",
      err
    );
  });