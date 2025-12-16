// MongoDB/Mongoose connection is handled in mongoose.config.ts
// This file is kept for backward compatibility but no longer used
// All database operations now use Mongoose models directly

/* export const startDBcon = async (
  req: Request<{ school_name: string }>,
  _res: CustomResponse,
  next: NextFunction
) => {
  if (req.params.school_name && req.params.school_name.length > 0) {
    mysqlServerConfig.database = formatStringToDBName(req.params.school_name);
  }

  next();
};

export const startDBconFunc = async (school_name: string) => {
  if (school_name && school_name.length > 0) {
    mysqlServerConfig.database = school_name;
  }
}; */

/* const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER_NAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  multipleStatements: true
}); */

// const pool = mysql.createPool({
//     //connectionLimit: 10,
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'dbName',
// })

// module.exports = { pool, con };
