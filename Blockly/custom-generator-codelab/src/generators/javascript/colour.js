import {Order} from './javascript_generator.js'; // Assuming java_generator.js exists with necessary Java-related definitions.

export function colour_picker(block, generator) {
  // Colour picker.
  const code = '"' + block.getFieldValue('COLOUR') + '"';
  return [code, Order.ATOMIC];
};

export function colour_random(block, generator) {
  // Generate a random colour.
  const functionName = generator.provideFunction_('colourRandom', `
public String ${generator.FUNCTION_NAME_PLACEHOLDER_}() {
  int num = (int)(Math.random() * (Math.pow(2, 24)));
  return String.format("#%06x", num);
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
public String ${generator.FUNCTION_NAME_PLACEHOLDER_}(int r, int g, int b) {
  r = Math.max(Math.min(r, 100), 0) * 255 / 100;
  g = Math.max(Math.min(g, 100), 0) * 255 / 100;
  b = Math.max(Math.min(b, 100), 0) * 255 / 100;
  return String.format("#%02x%02x%02x", r, g, b);
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
public String ${generator.FUNCTION_NAME_PLACEHOLDER_}(String c1, String c2, double ratio) {
  ratio = Math.max(Math.min(ratio, 1.0), 0.0);
  int r1 = Integer.parseInt(c1.substring(1, 3), 16);
  int g1 = Integer.parseInt(c1.substring(3, 5), 16);
  int b1 = Integer.parseInt(c1.substring(5, 7), 16);
  int r2 = Integer.parseInt(c2.substring(1, 3), 16);
  int g2 = Integer.parseInt(c2.substring(3, 5), 16);
  int b2 = Integer.parseInt(c2.substring(5, 7), 16);
  int r = (int)(r1 * (1 - ratio) + r2 * ratio);
  int g = (int)(g1 * (1 - ratio) + g2 * ratio);
  int b = (int)(b1 * (1 - ratio) + b2 * ratio);
  return String.format("#%02x%02x%02x", r, g, b);
}
`);
  const code = functionName + '(' + c1 + ', ' + c2 + ', ' + ratio + ')';
  return [code, Order.FUNCTION_CALL];
};
