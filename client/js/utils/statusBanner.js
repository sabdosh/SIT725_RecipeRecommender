// /client/js/utils/statusBanner.js
export function showStatus(message, type = 'info') {
  const colors = {
    error: '#f44336',
    success: '#4CAF50',
    info: '#2196F3'
  };
  
  console.log(`${type}: ${message}`);
  // For now, just use alert. Can be enhanced later.
  alert(message);
}