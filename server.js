const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Configuration
const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0'; // Listen on all interfaces
const skipDbCheck = process.env.SKIP_DB_CHECK === 'true';

// Maximum number of server restarts due to error
const MAX_RESTART_ATTEMPTS = 5;
let restartCount = 0;

// Create the Next.js app
const app = next({ dev });
const handle = app.getRequestHandler();

// Graceful shutdown function
const gracefulShutdown = (server, exitCode = 0) => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(exitCode);
  });
  
  // Force close if graceful shutdown takes too long
  setTimeout(() => {
    console.log('Force closing server after timeout');
    process.exit(exitCode);
  }, 10000);
};

// Main server startup function with error handling
async function startServer() {
  try {
    console.log(`Starting server attempt ${restartCount + 1}/${MAX_RESTART_ATTEMPTS}...`);
    console.log(`Node environment: ${process.env.NODE_ENV}`);
    
    // Prepare the Next.js application
    await app.prepare();
    
    // Create the HTTP server
    const server = createServer(async (req, res) => {
      try {
        // Basic request logging in production
        if (process.env.NODE_ENV === 'production') {
          const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
          console.log(`${new Date().toISOString()} | ${ip} | ${req.method} ${req.url}`);
        }
        
        // Set security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // Parse the URL
        const parsedUrl = parse(req.url, true);
        
        // Health check endpoint for Render
        if (parsedUrl.pathname === '/api/healthcheck') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            status: 'ok',
            timestamp: new Date().toISOString()
          }));
          return;
        }
        
        // Let Next.js handle the request
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error(`Error handling request: ${req.url}`, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    
    // Handle server-level errors
    server.on('error', (err) => {
      console.error('Server error:', err);
      
      // Try to restart on critical errors if not exceeding max attempts
      if (restartCount < MAX_RESTART_ATTEMPTS) {
        restartCount++;
        console.log(`Server crashed. Attempting restart ${restartCount}/${MAX_RESTART_ATTEMPTS}`);
        setTimeout(startServer, 5000); // Wait 5 seconds before restarting
      } else {
        console.error(`Maximum restart attempts (${MAX_RESTART_ATTEMPTS}) reached. Exiting.`);
        process.exit(1);
      }
    });
    
    // Add event listeners for graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown(server));
    process.on('SIGINT', () => gracefulShutdown(server));
    
    // Handle uncaught exceptions and unhandled promise rejections
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      gracefulShutdown(server, 1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit for unhandled rejections, just log them
    });
    
    // Start listening
    server.listen(port, hostname, (err) => {
      if (err) throw err;
      const addressInfo = server.address();
      const serverUrl = typeof addressInfo === 'string' 
        ? addressInfo 
        : `http://${addressInfo.address === '::' ? 'localhost' : addressInfo.address}:${addressInfo.port}`;
      
      console.log(`> Ready on ${serverUrl}`);
      console.log(`> Environment: ${process.env.NODE_ENV}`);
      console.log(`> Database check: ${skipDbCheck ? 'SKIPPED' : 'ENABLED'}`);
    });
  } catch (err) {
    console.error('Error starting server:', err);
    if (restartCount < MAX_RESTART_ATTEMPTS) {
      restartCount++;
      console.log(`Error during startup. Attempting restart ${restartCount}/${MAX_RESTART_ATTEMPTS}`);
      setTimeout(startServer, 5000); // Wait 5 seconds before restarting
    } else {
      console.error(`Maximum restart attempts (${MAX_RESTART_ATTEMPTS}) reached. Exiting.`);
      process.exit(1);
    }
  }
}

// Start the server
startServer(); 