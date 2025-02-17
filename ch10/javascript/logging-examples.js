const winston = require('winston');
const globalLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.printf((info) =>
    `\n\n==== ${info.message} =====\n`
  ),
  transports: [new winston.transports.Console()]
});

const logLevelsExample = () => {
  globalLogger.debug('logLevelsExample');

  const logger = winston.createLogger({            
    level: 'info',                                 
    format: winston.format.simple(),               
    transports: [new winston.transports.Console()] 
  });

  logger.info('Hello, World!');                    

  logger.debug('A message at debug level');
  logger.info('A message at info level');
  logger.error('A message at error level');

  logger.info('Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
  logger.info('Fusce vitae nisl neque.');
  logger.info('Phasellus sed volutpat arcu.');
  logger.info('Cras a nunc a risus cursus egestas eget sit amet nibh.');
  logger.error('Etiam sed turpis at nisl aliquam viverra.');
  logger.info('Integer orci metus, eleifend non risus vel, elementum iaculis urna.');
  logger.info('Duis ac urna et leo imperdiet rutrum eleifend et nisl.');
};

const logFormattingExample = () => {
  globalLogger.debug('logFormattingExample');

  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(                          
      winston.format.timestamp(),                            
      winston.format.printf(({timestamp, level, message}) => 
        `${timestamp} [${level}]: ${message}`
      ),
    ),
    transports: [new winston.transports.Console()]
  });

  logger.info('A message at info level');
  logger.warn('A message at warn level');
  logger.error('A message at error level');
};

const logFormattingContextExample = () => {
  globalLogger.debug('logFormattingContextExample');

  const req = {
    ip: '1.2.3.4',
    method: 'GET',
    path: '/foo'
  }

  const logger = winston.createLogger({
    level: 'info',
    defaultMeta: req,                                                          
    format: winston.format.combine(
      winston.format.timestamp(),                                              
      winston.format.printf(({timestamp, ip, method, path, level, message}) => 
        `${timestamp} ${ip} ${method} ${path} [${level}]: ${message}`
      ),
    ),
    transports: [new winston.transports.Console()]
  });

  logger.info('A message at info level');
  logger.warn('A message at warn level');
  logger.error('A message at error level');
};

const multipleLoggersExample = () => {
  globalLogger.debug('multipleLoggersExample');

  const req = {
    ip: '1.2.3.4',
    method: 'GET',
    path: '/foo'
  }

  const createLogger = (name, level) => {                           
    return winston.createLogger({
      level: level,
      defaultMeta: req,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.label({label: name}),                        
        winston.format.printf(
          ({timestamp, label, ip, method, path, level, message}) => 
          `${timestamp} [${label}] ${ip} ${method} ${path} [${level}]: ${message}`
        ),
      ),
      transports: [new winston.transports.Console()]
    });
  };

  const loggerA = createLogger('A', 'info');                        
  const loggerB = createLogger('B', 'warn');                        

  loggerA.info('A message at info level');
  loggerB.info('A message at info level');
  loggerA.warn('A message at warn level');
  loggerB.warn('A message at warn level');
};

const structuredLoggingExample = () => {
  globalLogger.debug('structuredLoggingExample');

  const req = {
    ip: '1.2.3.4',
    method: 'GET',
    path: '/foo'
  }

  const createLogger = (name, level) => {
    return winston.createLogger({
      level: level,
      defaultMeta: req,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.label({label: name}),
        winston.format.json() 
      ),
      transports: [new winston.transports.Console()]
    });
  };
  const loggerA = createLogger('A', 'info');

  loggerA.info('A message at info level');

  req.id = '53ebcb5a-038d-4e6a-a171-7132000c68fd';
  const user = {
    id: 53345644345655,
  };
  const product = {
    id: 1098174593,
    price: '$54.99',
    name: "Fundamentals of DevOps and Software Delivery"
  }
  loggerA.info({
    request_id: req.id,
    user_id: user.id,
    action: "complete-purchase",
    product_id: product.id,
    product_price: product.price,
    message: `User bought ${product.name}`
  });
};

const logToFileExample = () => {
  globalLogger.debug('logToFileExample');

  const req = {
    ip: '1.2.3.4',
    method: 'GET',
    path: '/foo'
  }

  const createLogger = (name, level) => {
    return winston.createLogger({
      level: level,
      defaultMeta: req,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.label({label: name}),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 
          filename: `module${name}.log`
        })
      ]
    });
  };

  const loggerA = createLogger('A', 'info');
  const loggerB = createLogger('B', 'info');

  loggerA.info('A message at info level');
  loggerB.info('A message at info level');
};

const logRotationExample = () => {
  globalLogger.debug('logRotationExample');

  const req = {
    ip: '1.2.3.4',
    method: 'GET',
    path: '/foo'
  }

  const createLogger = (name, level) => {
    return winston.createLogger({
      level: level,
      defaultMeta: req,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.label({label: name}),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: `module${name}.log`,
          maxsize: 10000000,  
          maxFiles: 10,       
          zippedArchive: true 
        })
      ]
    });
  };

  const loggerA = createLogger('A', 'info');
  const loggerB = createLogger('B', 'info');

  loggerA.info('A message at info level');
  loggerB.info('A message at info level');
};

logLevelsExample();
logFormattingExample();
logFormattingContextExample();
multipleLoggersExample();
structuredLoggingExample();
logToFileExample();
logRotationExample();