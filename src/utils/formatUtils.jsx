export function splitTextIntoLines(text, maxLength = 30) {
  if (!text || typeof text !== 'string') return text;
  
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if (currentLine.length + word.length + 1 <= maxLength) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  lines.push(currentLine);
  return lines.join('\n');
}

export function formatNumber(value, maxDecimals = 3) {
  if (value === null || value === undefined) return "";
  
  if (typeof value === "string") {
    value = value.replace(/,/g, '.');
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    value = num;
  }
  
  if (typeof value !== "number") return value;
  
  const factor = Math.pow(10, maxDecimals);
  const rounded = Math.round(value * factor) / factor;
  
  const parts = rounded.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.length > 1 ? parts.join('.') : parts[0];
}

export function shouldFormatAsNumber(header, value) {
  if (value === null || value === undefined) return false;
  const headerStr = header?.toString().toLowerCase() || '';
  const isNumericValue = !isNaN(parseFloat(value.toString().replace(/,/g, '.'))) && isFinite(value);
  
  return isNumericValue && (
    headerStr.includes('costo') ||
    headerStr.includes('precio') || 
    headerStr.includes('total') || 
    headerStr.includes('importe') ||
    headerStr.includes('cantidad') ||
    headerStr.includes('rendimiento') ||
    headerStr.includes('unitario') ||
    headerStr.includes('monto') ||
    headerStr.includes('Unit') ||
    headerStr.includes('Cant.') ||    
    headerStr.includes('valor')
  );
}