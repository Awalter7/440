
export  const parseValue = (value, property) => {
    if (value === undefined || value === null || value === "") return null;

    const str = String(value).trim();
    if (/^-?[\d.]+$/.test(str)) {
        const num = parseFloat(str);
        if (
        property &&
        ["rotate", "rotateX", "rotateY", "rotateZ", "skewX", "skewY"].includes(property)
        ) {
        return { number: num, unit: "deg" };
        }
        return { number: num, unit: "" };
    }

    const match = str.match(/^(-?[\d.]+)(px|vw|vh|%|em|rem|deg|turn|rad)?$/);
    if (!match) return null;

    return { number: parseFloat(match[1]), unit: match[2] || "" };
};


export const interpolate = (start, end, progress, easing, property) => {
    const s = parseValue(start, property);
    const e = parseValue(end, property);
    if (!s || !e) return undefined;

    if (s.unit !== e.unit) {
        console.warn(`Unit mismatch: ${start} vs ${end}. Using start value unit.`);
    }

    const eased = easing ? easing(progress) : progress;
    const interpolated = s.number + (e.number - s.number) * eased;
    return s.unit ? `${interpolated}${s.unit}` : interpolated;
};


