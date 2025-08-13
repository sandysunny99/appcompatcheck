// Test JavaScript file for scanning
function deprecatedFunction() {
  // This function uses deprecated APIs
  return document.all; // Deprecated API
}

function securityIssue() {
  // Security vulnerability
  const userInput = document.getElementById('input').value;
  eval(userInput); // Dangerous eval usage
}

function compatibilityIssue() {
  // Modern JS feature that might not be compatible
  const result = [1, 2, 3].flatMap(x => [x, x * 2]);
  return result;
}

// Using innerHTML which could be a security risk
function updateContent(content) {
  document.getElementById('content').innerHTML = content;
}

// Missing error handling
function riskyOperation() {
  JSON.parse('invalid json');
}

// Good code example
function goodFunction() {
  const data = { message: 'Hello World' };
  return JSON.stringify(data);
}

export { deprecatedFunction, securityIssue, compatibilityIssue, updateContent, riskyOperation, goodFunction };