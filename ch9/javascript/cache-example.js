const cache = {};                     

function query(key) {
  if (cache[key]) {                   
    return cache[key];
  }

  const result = expensiveQuery(key); 
  cache[key] = result;
  return result;
}

function expensiveQuery(key) {
  return "mock data";
}