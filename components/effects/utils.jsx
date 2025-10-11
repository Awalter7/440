export const parseValue = (value, property) => {
  if (value === undefined || value === null || value === "") return null;

  const str = String(value).trim();

  // Check if it's a calc() expression
  if (str.startsWith("calc(") && str.endsWith(")")) {
    return parseCalc(str, property);
  }

  // Plain number without unit
  if (/^-?[\d.]+$/.test(str)) {
    const num = parseFloat(str);
    if (
      property &&
      ["rotate", "rotateX", "rotateY", "rotateZ", "skewX", "skewY"].includes(property)
    ) {
      return { number: num, unit: "deg", isCalc: false };
    }
    return { number: num, unit: "", isCalc: false };
  }

  // Number with unit
  const match = str.match(/^(-?[\d.]+)(px|vw|vh|%|em|rem|deg|turn|rad)?$/);
  if (!match) return null;

  return { 
    number: parseFloat(match[1]), 
    unit: match[2] || "", 
    isCalc: false 
  };
};

const parseCalc = (calcStr, property) => {
  // Extract content between calc( and )
  const content = calcStr.slice(5, -1).trim();
  
  // Split by operators while preserving them
  const parts = content.split(/([+\-*/])/g).map(p => p.trim()).filter(p => p);
  
  const parsedParts = [];
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // If it's an operator, store it as-is
    if (['+', '-', '*', '/'].includes(part)) {
      parsedParts.push({ operator: part });
    } else {
      // Parse the value
      const parsed = parseValue(part, property);
      if (parsed) {
        parsedParts.push(parsed);
      }
    }
  }
  
  return {
    isCalc: true,
    parts: parsedParts
  };
};

const interpolateCalcParts = (startParts, endParts, progress, easing) => {
  const eased = easing ? easing(progress) : progress;
  const result = [];
  
  for (let i = 0; i < startParts.length; i++) {
    const startPart = startParts[i];
    const endPart = endParts[i];
    
    // Copy operators as-is
    if (startPart.operator) {
      result.push(startPart);
      continue;
    }
    
    // Interpolate values
    if (startPart.unit !== endPart.unit) {
      console.warn(`Unit mismatch in calc(): ${startPart.unit} vs ${endPart.unit}`);
    }
    
    const interpolated = startPart.number + (endPart.number - startPart.number) * eased;
    result.push({
      number: interpolated,
      unit: startPart.unit
    });
  }
  
  return result;
};


function parsePadding(paddingStr) {
  const values = paddingStr.trim().split(/\s+/);

  switch (values.length) {
    case 1:
      return [values[0], values[0], values[0], values[0]]; // top, right, bottom, left
    case 2:
      return [values[0], values[1], values[0], values[1]];
    case 3:
      return [values[0], values[1], values[2], values[1]];
    case 4:
      return [values[0], values[1], values[2], values[3]];
    default:
      return ["0px", "0px", "0px", "0px"];
  }
}


const stringifyCalc = (parts) => {
  let result = "calc(";
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (part.operator) {
      result += ` ${part.operator} `;
    } else {
      result += part.unit ? `${part.number}${part.unit}` : part.number;
    }
  }
  
  result += ")";
  return result;
};

export const interpolate = (start, end, progress, easing, property) => {


    const s = parseValue(start, property);
    const e = parseValue(end, property);
    
    if (!s || !e) return undefined;

    // Handle calc() interpolation
    if (s.isCalc && e.isCalc) {
        if (s.parts.length !== e.parts.length) {
            console.warn(`calc() structure mismatch. Using start value.`);
            return start;
        }
        
        const interpolatedParts = interpolateCalcParts(s.parts, e.parts, progress, easing);
        return stringifyCalc(interpolatedParts);
    }

    // One is calc(), one isn't - can't interpolate
    if (s.isCalc || e.isCalc) {
        console.warn(`Cannot interpolate between calc() and non-calc() values.`);
        return progress < 0.5 ? start : end;
    }

    // Standard interpolation for non-calc values
    if (s.unit !== e.unit) {
        console.warn(`Unit mismatch: ${start} vs ${end}. Using start value unit.`);
    }

    const eased = easing ? easing(progress) : progress;
    const interpolated = s.number + (e.number - s.number) * eased;
    return s.unit ? `${interpolated}${s.unit}` : interpolated;
};

// Example usage:
// interpolate("calc(100vw - 40px)", "calc(90vw - 40px)", 0.5, null, "width")
// Result: "calc(95vw - 40px)"