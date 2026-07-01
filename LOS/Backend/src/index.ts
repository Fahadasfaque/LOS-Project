import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler } from './middlewares/error';
import swaggerDocument from './swagger/swagger.json';

// Initialize environment configurations
dotenv.config();

// Fail Fast: Validate required environment variables before booting
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`[CRITICAL CONFIG ERROR] Missing environment variable: ${key}.`);
    process.exit(1);
  }
}

// Validate ENCRYPTION_KEY format (AES-256-GCM requires a 32-byte key represented as a 64-char hex string)
const encryptionKey = process.env.ENCRYPTION_KEY || '';
const isValidHexKey = /^[0-9a-fA-F]{64}$/.test(encryptionKey);
if (!isValidHexKey) {
  console.error('[CRITICAL CONFIG ERROR] ENCRYPTION_KEY must be a 64-character hexadecimal string representing 32 bytes.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5000;

// Restrict CORS to local development ports and local network IPs
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server or curl requests (no origin header)
      if (!origin) {
        return callback(null, true);
      }
      
      // Allow localhost, 127.0.0.1, and local network IPs (e.g. 192.168.x.x, 172.16.x.x - 172.31.x.x, 10.x.x.x) on port 3000 or 5000
      const isLocalhostOrNetwork = 
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|10\.\d+\.\d+\.\d+):(3000|5000)$/.test(origin);
      
      if (isLocalhostOrNetwork) {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked] Origin: ${origin} does not match allowed local dev patterns.`);
        callback(null, false);
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Expose OpenAPI interactive docs at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Route all API requests under v1 prefix
app.use('/api/v1', routes);

// Global Error Handler Middleware (Must be registered last)
app.use(errorHandler);

// Launch backend listener
app.listen(port, () => {
  console.log(`[LOS-BACKEND] Server listening on http://localhost:${port}`);
  console.log(`[LOS-BACKEND] OpenAPI Swagger documentation hosted at http://localhost:${port}/api-docs`);
});
