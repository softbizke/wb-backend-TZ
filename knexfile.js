module.exports = {
    development: {
      client: "pg",
      connection: {
        host: "127.0.0.1",
        user: "postgres",
        password: "p@ssport1X",
        database: "TOS",
        charset: "utf8",
      },
      migrations: {
        directory: "./migrations",
      },
      seeds: {
        directory: "./seeds",
      },
    },
  };
  