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
let serverReady = false;

// Simple HTTP handler for health checks before Next.js is ready
const createEarlyHealthCheckServer = () => {
  const healthServer = createServer((req, res) => {
    const url = parse(req.url);
    if (url.pathname === '/api/healthcheck') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        status: 'initializing',
        message: 'Server is starting up',
        timestamp: new Date().toISOString()
      }));
    } else {
      res.statusCode = 503;
      res.end('Service is starting');
    }
  });
  
  healthServer.listen(port, hostname, () => {
    console.log(`Early health check server listening on port ${port}`);
  });
  
  return healthServer;
};

// Create the Next.js app
const app = next({ 
  dev,
  hostname,
  port,
  // Increase timeout for slow operations
  conf: {
    serverRuntimeConfig: {
      pageLoadTimeout: 60000, // 60 seconds
    }
  }
});

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

// Utility function to log errors with request details
const logRequestError = (req, err) => {
  const timestamp = new Date().toISOString();
  const method = req.method || 'UNKNOWN';
  const url = req.url || 'UNKNOWN';
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'UNKNOWN';
  const userAgent = req.headers['user-agent'] || 'UNKNOWN';
  
  console.error(`[${timestamp}] ERROR handling ${method} ${url}`);
  console.error(`[${timestamp}] IP: ${ip}, UA: ${userAgent}`);
  console.error(`[${timestamp}] Error details:`, err);
  
  if (err.stack) {
    console.error(`[${timestamp}] Stack trace:`, err.stack);
  }
};

// Main server startup function with error handling
async function startServer() {
  let earlyHealthServer;
  
  try {
    console.log(`[${new Date().toISOString()}] Starting server attempt ${restartCount + 1}/${MAX_RESTART_ATTEMPTS}...`);
    console.log(`Node environment: ${process.env.NODE_ENV}`);
    
    // Start early health check server to respond during startup
    if (process.env.NODE_ENV === 'production') {
      earlyHealthServer = createEarlyHealthCheckServer();
    }
    
    // Prepare the Next.js application
    console.log(`[${new Date().toISOString()}] Preparing Next.js application...`);
    await app.prepare();
    console.log(`[${new Date().toISOString()}] Next.js application prepared successfully`);
    
    // Close early health check server if it exists
    if (earlyHealthServer) {
      console.log(`[${new Date().toISOString()}] Closing early health check server...`);
      await new Promise(resolve => earlyHealthServer.close(resolve));
    }
    
    // Create the HTTP server
    console.log(`[${new Date().toISOString()}] Creating main HTTP server...`);
    const server = createServer(async (req, res) => {
      // Set timeout to prevent hanging requests
      req.setTimeout(30000);
      res.setTimeout(30000);
      
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
          // Reduce log spam for health checks
          if (process.env.DEBUG_HEALTH_CHECKS === 'true') {
            console.log(`[${new Date().toISOString()}] Health check requested`);
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            status: 'ok',
            ready: serverReady,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
          }));
          return;
        }
        
        // For non-health check requests, add a fallback error handler
        // just in case Next.js doesn't respond in time
        const timeoutId = setTimeout(() => {
          if (!res.writableEnded) {
            console.error(`[${new Date().toISOString()}] Request timeout for ${parsedUrl.pathname}`);
            res.statusCode = 504;
            res.end('Request timeout - server took too long to process your request');
          }
        }, 25000); // 25 second timeout
        
        try {
          // Let Next.js handle the request
          await handle(req, res, parsedUrl);
        } catch (nextJsError) {
          // Handle errors from Next.js
          logRequestError(req, nextJsError);
          
          // Only respond if headers haven't been sent yet
          if (!res.headersSent && !res.writableEnded) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Internal Server Error - The application encountered an error processing your request');
          }
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (err) {
        // Handle top-level errors
        logRequestError(req, err);
        
        if (!res.headersSent && !res.writableEnded) {
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      }
    });
    
    // Handle server-level errors
    server.on('error', (err) => {
      console.error(`[${new Date().toISOString()}] Server error:`, err);
      
      // Try to restart on critical errors if not exceeding max attempts
      if (restartCount < MAX_RESTART_ATTEMPTS) {
        restartCount++;
        console.log(`[${new Date().toISOString()}] Server crashed. Attempting restart ${restartCount}/${MAX_RESTART_ATTEMPTS}`);
        setTimeout(startServer, 5000); // Wait 5 seconds before restarting
      } else {
        console.error(`[${new Date().toISOString()}] Maximum restart attempts (${MAX_RESTART_ATTEMPTS}) reached. Exiting.`);
        process.exit(1);
      }
    });
    
    // Add event listeners for graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown(server));
    process.on('SIGINT', () => gracefulShutdown(server));
    
    // Handle uncaught exceptions and unhandled promise rejections
    process.on('uncaughtException', (err) => {
      console.error(`[${new Date().toISOString()}] Uncaught exception:`, err);
      gracefulShutdown(server, 1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
      // Don't exit for unhandled rejections, just log them
    });
    
    // Start listening
    console.log(`[${new Date().toISOString()}] Starting to listen on port ${port}...`);
    server.listen(port, hostname, (err) => {
      if (err) throw err;
      const addressInfo = server.address();
      const serverUrl = typeof addressInfo === 'string' 
        ? addressInfo 
        : `http://${addressInfo.address === '::' ? 'localhost' : addressInfo.address}:${addressInfo.port}`;
      
      serverReady = true;
      console.log(`[${new Date().toISOString()}] ✅ Server ready and listening on ${serverUrl}`);
      console.log(`[${new Date().toISOString()}] > Environment: ${process.env.NODE_ENV}`);
      console.log(`[${new Date().toISOString()}] > Database check: ${skipDbCheck ? 'SKIPPED' : 'ENABLED'}`);
      
      // Print a success message that Render might be looking for
      console.log('====================================');
      console.log('🚀 SERVER STARTUP SUCCESSFUL');
      console.log('====================================');
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error starting server:`, err);
    
    // Close early health server if it exists
    if (earlyHealthServer) {
      earlyHealthServer.close();
    }
    
    if (restartCount < MAX_RESTART_ATTEMPTS) {
      restartCount++;
      console.log(`[${new Date().toISOString()}] Error during startup. Attempting restart ${restartCount}/${MAX_RESTART_ATTEMPTS}`);
      setTimeout(startServer, 5000); // Wait 5 seconds before restarting
    } else {
      console.error(`[${new Date().toISOString()}] Maximum restart attempts (${MAX_RESTART_ATTEMPTS}) reached. Exiting.`);
      process.exit(1);
    }
  }
}

// Start the server
console.log(`[${new Date().toISOString()}] 🚀 Initializing server...`);
startServer(); 