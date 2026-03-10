import {Order} from './javascript_generator.js'; // Assuming java_generator.js exists with necessary Java-related definitions.

export function colour_picker(block, generator) {
  // Colour picker.
  const code = '"' + block.getFieldValue('COLOUR') + '"';
  return [code, Order.ATOMIC];
};

export function colour_random(block, generator) {
  // Generate a random colour.
  const functionName = generator.provideFunction_('colourRandom', `
public static String ${generator.FUNCTION_NAME_PLACEHOLDER_}() {
  int num = (int)(Math.random() * 16777216);
  String d = "0123456789abcdef";
  return "#" + d.charAt((num >> 20) & 15) + d.charAt((num >> 16) & 15)
             + d.charAt((num >> 12) & 15) + d.charAt((num >> 8) & 15)
             + d.charAt((num >> 4) & 15) + d.charAt(num & 15);
}
`);
  const code = functionName + '()';
  return [code, Order.FUNCTION_CALL];
};

export function colour_rgb(block, generator) {
  // Compose a colour from RGB components expressed as percentages.
  const red = generator.valueToCode(block, 'RED', Order.NONE) || "0";
  const green = generator.valueToCode(block, 'GREEN', Order.NONE) || "0";
  const blue = generator.valueToCode(block, 'BLUE', Order.NONE) || "0";
  const functionName = generator.provideFunction_('colourRgb', `
public static String ${generator.FUNCTION_NAME_PLACEHOLDER_}(int r, int g, int b) {
  r = Math.max(Math.min(r, 100), 0) * 255 / 100;
  g = Math.max(Math.min(g, 100), 0) * 255 / 100;
  b = Math.max(Math.min(b, 100), 0) * 255 / 100;
  String d = "0123456789abcdef";
  return "#" + d.charAt(r / 16) + d.charAt(r % 16)
             + d.charAt(g / 16) + d.charAt(g % 16)
             + d.charAt(b / 16) + d.charAt(b % 16);
}
`);
  const code = functionName + '(' + red + ', ' + green + ', ' + blue + ')';
  return [code, Order.FUNCTION_CALL];
};

export function colour_blend(block, generator) {
  // Blend two colours together.
  const c1 = generator.valueToCode(block, 'COLOUR1', Order.NONE) || "\"#000000\"";
  const c2 = generator.valueToCode(block, 'COLOUR2', Order.NONE) || "\"#000000\"";
  const ratio = generator.valueToCode(block, 'RATIO', Order.NONE) || "0.5";
  const functionName = generator.provideFunction_('colourBlend', `
public static String ${generator.FUNCTION_NAME_PLACEHOLDER_}(String c1, String c2, double ratio) {
  ratio = Math.max(Math.min(ratio, 1.0), 0.0);
  String d = "0123456789abcdef";
  int r1 = d.indexOf(c1.charAt(1)) * 16 + d.indexOf(c1.charAt(2));
  int g1 = d.indexOf(c1.charAt(3)) * 16 + d.indexOf(c1.charAt(4));
  int b1 = d.indexOf(c1.charAt(5)) * 16 + d.indexOf(c1.charAt(6));
  int r2 = d.indexOf(c2.charAt(1)) * 16 + d.indexOf(c2.charAt(2));
  int g2 = d.indexOf(c2.charAt(3)) * 16 + d.indexOf(c2.charAt(4));
  int b2 = d.indexOf(c2.charAt(5)) * 16 + d.indexOf(c2.charAt(6));
  int r = (int)(r1 * (1 - ratio) + r2 * ratio);
  int g = (int)(g1 * (1 - ratio) + g2 * ratio);
  int b = (int)(b1 * (1 - ratio) + b2 * ratio);
  return "#" + d.charAt(r / 16) + d.charAt(r % 16)
             + d.charAt(g / 16) + d.charAt(g % 16)
             + d.charAt(b / 16) + d.charAt(b % 16);
}
`);
  const code = functionName + '(' + c1 + ', ' + c2 + ', ' + ratio + ')';
  return [code, Order.FUNCTION_CALL];
};
