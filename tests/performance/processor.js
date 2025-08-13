// Artillery processor functions for load testing

const crypto = require('crypto');

module.exports = {
  // Authenticate user and capture token
  authenticateUser,
  createTestScan,
  generateRandomData,
  measurePerformance,
  customMetrics,
  validateResponse,
};

async function authenticateUser(requestParams, context, events, done) {
  try {
    const response = await fetch(`${context.vars.target}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      context.vars.authToken = data.token;
      
      // Custom metric for login success
      events.emit('customStat', 'custom.login_success_rate', 100);
    } else {
      console.error('Authentication failed:', response.status);
      events.emit('customStat', 'custom.login_success_rate', 0);
    }
  } catch (error) {
    console.error('Authentication error:', error);
    events.emit('customStat', 'custom.login_success_rate', 0);
  }

  return done();
}

async function createTestScan(requestParams, context, events, done) {
  if (!context.vars.authToken) {
    console.error('No auth token available for scan creation');
    return done();
  }

  const startTime = Date.now();

  try {
    const response = await fetch(`${context.vars.target}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.vars.authToken}`,
      },
      body: JSON.stringify({
        name: `Load Test Scan ${generateRandomString()}`,
        type: 'compatibility',
        description: 'Automated load test scan creation',
      }),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.ok) {
      const data = await response.json();
      context.vars.scanId = data.data.scan.id;
      
      // Custom metric for scan creation time
      events.emit('customStat', 'custom.scan_creation_time', duration);
    } else {
      console.error('Scan creation failed:', response.status);
    }
  } catch (error) {
    console.error('Scan creation error:', error);
  }

  return done();
}

function generateRandomData(requestParams, context, events, done) {
  // Generate random data for testing
  context.vars.randomString = generateRandomString();
  context.vars.randomNumber = Math.floor(Math.random() * 1000);
  context.vars.randomEmail = `test${Date.now()}@example.com`;
  context.vars.timestamp = new Date().toISOString();

  return done();
}

function measurePerformance(requestParams, context, events, done) {
  const startTime = Date.now();
  
  // Store start time for later measurement
  context.vars._startTime = startTime;
  
  return done();
}

function customMetrics(requestParams, response, context, events, done) {
  if (context.vars._startTime) {
    const endTime = Date.now();
    const duration = endTime - context.vars._startTime;
    
    // Emit custom performance metrics based on the endpoint
    const url = requestParams.url || '';
    
    if (url.includes('/api/scans') && requestParams.method === 'POST') {
      events.emit('customStat', 'custom.scan_creation_time', duration);
    } else if (url.includes('/files') && requestParams.method === 'POST') {
      events.emit('customStat', 'custom.file_upload_time', duration);
    }
    
    // Clean up
    delete context.vars._startTime;
  }
  
  // Track response characteristics
  if (response && response.statusCode) {
    const status = response.statusCode;
    
    // Track success rates by endpoint type
    if (status >= 200 && status < 300) {
      events.emit('customStat', 'custom.success_rate', 100);
    } else if (status >= 400 && status < 500) {
      events.emit('customStat', 'custom.client_error_rate', 100);
    } else if (status >= 500) {
      events.emit('customStat', 'custom.server_error_rate', 100);
    }
  }
  
  return done();
}

function validateResponse(requestParams, response, context, events, done) {
  if (!response || !response.body) {
    console.error('No response body received');
    return done();
  }
  
  try {
    // Validate JSON responses
    if (response.headers && response.headers['content-type'] && 
        response.headers['content-type'].includes('application/json')) {
      
      const body = JSON.parse(response.body);
      
      // Validate API response structure
      if (requestParams.url && requestParams.url.includes('/api/')) {
        if (!body.hasOwnProperty('success')) {
          console.error('API response missing success field:', requestParams.url);
          events.emit('customStat', 'custom.validation_error_rate', 100);
        }
        
        // Check for error responses
        if (body.success === false && body.error) {
          console.log('API error response:', body.error, 'for URL:', requestParams.url);
        }
      }
      
      // Validate specific endpoint responses
      validateEndpointSpecificResponse(requestParams.url, body, events);
    }
  } catch (error) {
    console.error('Response validation error:', error);
    events.emit('customStat', 'custom.validation_error_rate', 100);
  }
  
  return done();
}

function validateEndpointSpecificResponse(url, body, events) {
  if (!url || !body) return;
  
  // Validate scan endpoints
  if (url.includes('/api/scans')) {
    if (url.includes('POST') || body.data?.scan) {
      const scan = body.data?.scan;
      if (scan && !scan.id) {
        console.error('Scan response missing ID');
        events.emit('customStat', 'custom.scan_validation_error', 100);
      }
    }
  }
  
  // Validate authentication endpoints
  if (url.includes('/api/auth/login')) {
    if (body.success && !body.token) {
      console.error('Login response missing token');
      events.emit('customStat', 'custom.auth_validation_error', 100);
    }
  }
  
  // Validate dashboard endpoints
  if (url.includes('/api/analytics/dashboard')) {
    if (body.success && !body.data) {
      console.error('Dashboard response missing data');
      events.emit('customStat', 'custom.dashboard_validation_error', 100);
    }
  }
}

// Utility functions
function generateRandomString(length = 8) {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

// Hook functions that Artillery calls automatically
module.exports.setJSONBody = function(requestParams, context, events, done) {
  if (requestParams.json) {
    requestParams.body = JSON.stringify(requestParams.json);
    delete requestParams.json;
  }
  return done();
};

module.exports.logRequest = function(requestParams, response, context, events, done) {
  console.log(`${requestParams.method} ${requestParams.url} - ${response.statusCode}`);
  return done();
};

// Performance monitoring hooks
module.exports.beforeRequest = function(requestParams, context, events, done) {
  context.vars._requestStart = Date.now();
  return done();
};

module.exports.afterResponse = function(requestParams, response, context, events, done) {
  if (context.vars._requestStart) {
    const duration = Date.now() - context.vars._requestStart;
    
    // Log slow requests
    if (duration > 5000) {
      console.warn(`Slow request detected: ${requestParams.method} ${requestParams.url} took ${duration}ms`);
    }
    
    delete context.vars._requestStart;
  }
  
  return done();
};