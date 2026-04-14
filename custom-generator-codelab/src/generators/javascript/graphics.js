/**
 * @fileoverview Java code generators for the graphics library blocks
 * (gfx_new_*, gfx_set_*, gfx_move, gfx_rotate, …).
 *
 * Generated code:
 *   Constructors  →  new ClassName(args)          [value]
 *                    new ClassName(args);\n        [statement]
 *   Methods       →  obj.method(args);\n           [statement]
 *   Getters       →  [obj.method(args), ORDER]    [value]
 */

import { Order, setExtendsClass } from './javascript_generator.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Shorthand for reading a numeric value input, falling back to a default. */
function num(block, generator, name, def = '0') {
  return generator.valueToCode(block, name, Order.NONE) || def;
}

/** Object receiver for a method call. */
function obj(block, generator, inputName = 'OBJ') {
  return generator.valueToCode(block, inputName, Order.MEMBER) || 'null';
}

// =============================================================================
// CONSTRUCTORS – value blocks (return [code, Order])
// =============================================================================

// ── Unified shape block ───────────────────────────────────────────────────────
export function gfx_new_shape(block, generator) {
  const shape = block.getFieldValue('SHAPE') || 'Circle';
  const n = (name, def) => generator.valueToCode(block, 'P_' + name, Order.NONE) || def;
  switch (shape) {
    case 'Circle':
      return [`new Circle(${n('X','0')}, ${n('Y','0')}, ${n('RADIUS','50')})`, Order.NEW];
    case 'Ellipse':
      return [`new Ellipse(${n('X','0')}, ${n('Y','0')}, ${n('RADIUS_X','100')}, ${n('RADIUS_Y','50')})`, Order.NEW];
    case 'Rectangle':
      return [`new Rectangle(${n('TOP','0')}, ${n('LEFT','0')}, ${n('WIDTH','100')}, ${n('HEIGHT','80')})`, Order.NEW];
    case 'RoundedRectangle':
      return [`new RoundedRectangle(${n('TOP','0')}, ${n('LEFT','0')}, ${n('WIDTH','100')}, ${n('HEIGHT','80')}, ${n('CORNER','10')})`, Order.NEW];
    case 'Triangle':
      return [`new Triangle(${n('X1','0')}, ${n('Y1','0')}, ${n('X2','100')}, ${n('Y2','0')}, ${n('X3','50')}, ${n('Y3','80')})`, Order.NEW];
    case 'Line':
      return [`new Line(${n('X1','0')}, ${n('Y1','0')}, ${n('X2','100')}, ${n('Y2','100')})`, Order.NEW];
    default:
      return ['null', Order.ATOMIC];
  }
}

export function gfx_new_shape_stmt(block, generator) {
  const [code] = gfx_new_shape(block, generator);
  return `${code};\n`;
}

export function gfx_new_world(block, generator) {
  const w = num(block, generator, 'WIDTH', '800');
  const h = num(block, generator, 'HEIGHT', '600');
  return [`new World(${w}, ${h})`, Order.NEW];
}

export function gfx_new_circle(block, generator) {
  const x = num(block, generator, 'X', '0');
  const y = num(block, generator, 'Y', '0');
  const r = num(block, generator, 'RADIUS', '50');
  return [`new Circle(${x}, ${y}, ${r})`, Order.NEW];
}

export function gfx_new_ellipse(block, generator) {
  const x  = num(block, generator, 'X',        '0');
  const y  = num(block, generator, 'Y',        '0');
  const rx = num(block, generator, 'RADIUS_X', '100');
  const ry = num(block, generator, 'RADIUS_Y', '50');
  return [`new Ellipse(${x}, ${y}, ${rx}, ${ry})`, Order.NEW];
}

export function gfx_new_rect(block, generator) {
  const t = num(block, generator, 'TOP',    '0');
  const l = num(block, generator, 'LEFT',   '0');
  const w = num(block, generator, 'WIDTH',  '100');
  const h = num(block, generator, 'HEIGHT', '80');
  return [`new Rectangle(${t}, ${l}, ${w}, ${h})`, Order.NEW];
}

export function gfx_new_rrect(block, generator) {
  const t = num(block, generator, 'TOP',    '0');
  const l = num(block, generator, 'LEFT',   '0');
  const w = num(block, generator, 'WIDTH',  '100');
  const h = num(block, generator, 'HEIGHT', '80');
  const c = num(block, generator, 'CORNER', '10');
  return [`new RoundedRectangle(${t}, ${l}, ${w}, ${h}, ${c})`, Order.NEW];
}

export function gfx_new_triangle(block, generator) {
  const x1 = num(block, generator, 'X1', '0');
  const y1 = num(block, generator, 'Y1', '0');
  const x2 = num(block, generator, 'X2', '100');
  const y2 = num(block, generator, 'Y2', '0');
  const x3 = num(block, generator, 'X3', '50');
  const y3 = num(block, generator, 'Y3', '80');
  return [`new Triangle(${x1}, ${y1}, ${x2}, ${y2}, ${x3}, ${y3})`, Order.NEW];
}

export function gfx_new_line(block, generator) {
  const x1 = num(block, generator, 'X1', '0');
  const y1 = num(block, generator, 'Y1', '0');
  const x2 = num(block, generator, 'X2', '100');
  const y2 = num(block, generator, 'Y2', '100');
  return [`new Line(${x1}, ${y1}, ${x2}, ${y2})`, Order.NEW];
}

export function gfx_new_text(block, generator) {
  const x    = num(block, generator, 'X',    '0');
  const y    = num(block, generator, 'Y',    '0');
  const size = num(block, generator, 'SIZE', '20');
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || '"Text"';
  return [`new Text(${x}, ${y}, ${size}, ${text})`, Order.NEW];
}

export function gfx_new_turtle(block, generator) {
  const x = num(block, generator, 'X', '400');
  const y = num(block, generator, 'Y', '300');
  return [`new Turtle(${x}, ${y})`, Order.NEW];
}

export function gfx_new_group(block, generator) {
  // Collect any SHAPE inputs created by the block's mutation.
  const parts = [];
  let i = 0;
  while (block.getInput('SHAPE' + i)) {
    const val = generator.valueToCode(block, 'SHAPE' + i, Order.NONE) || 'null';
    parts.push(val);
    i++;
  }
  const argStr = parts.length ? parts.join(', ') : '';
  return [`new Group(${argStr})`, Order.NEW];
}

export function gfx_new_bitmap(block, generator) {
  const cols   = num(block, generator, 'COLS',   '10');
  const rows   = num(block, generator, 'ROWS',   '10');
  const left   = num(block, generator, 'LEFT',   '0');
  const top    = num(block, generator, 'TOP',    '0');
  const width  = num(block, generator, 'WIDTH',  '200');
  const height = num(block, generator, 'HEIGHT', '200');
  return [`new Bitmap(${cols}, ${rows}, ${left}, ${top}, ${width}, ${height})`, Order.NEW];
}

export function gfx_new_polygon(block, generator) {
  const close = generator.valueToCode(block, 'CLOSE', Order.NONE) || 'true';
  return [`new Polygon(${close})`, Order.NEW];
}


// =============================================================================
// APPEARANCE – statement generators
// =============================================================================

export function gfx_set_fill_color(block, generator) {
  const o = obj(block, generator);
  const color = generator.valueToCode(block, 'COLOR', Order.NONE) || 'null';
  return `${o}.setFillColor(${color});\n`;
}

export function gfx_set_fill_color_alpha(block, generator) {
  const o     = obj(block, generator);
  const color = generator.valueToCode(block, 'COLOR', Order.NONE) || 'null';
  const alpha = num(block, generator, 'ALPHA', '1.0');
  return `${o}.setFillColor(${color}, ${alpha});\n`;
}

export function gfx_set_border_color(block, generator) {
  const o     = obj(block, generator);
  const color = generator.valueToCode(block, 'COLOR', Order.NONE) || 'null';
  return `${o}.setBorderColor(${color});\n`;
}

export function gfx_set_border_width(block, generator) {
  const o = obj(block, generator);
  const w = num(block, generator, 'WIDTH', '1');
  return `${o}.setBorderWidth(${w});\n`;
}

export function gfx_set_alpha(block, generator) {
  const o = obj(block, generator);
  const a = num(block, generator, 'ALPHA', '1.0');
  return `${o}.setAlpha(${a});\n`;
}

export function gfx_set_visible(block, generator) {
  const o = obj(block, generator);
  const v = generator.valueToCode(block, 'VISIBLE', Order.NONE) || 'true';
  return `${o}.setVisible(${v});\n`;
}

export function gfx_bring_to_front(block, generator) {
  const o = obj(block, generator);
  return `${o}.bringToFront();\n`;
}

export function gfx_send_to_back(block, generator) {
  const o = obj(block, generator);
  return `${o}.sendToBack();\n`;
}

export function gfx_set_text_content(block, generator) {
  const o    = obj(block, generator);
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || '""';
  return `${o}.setText(${text});\n`;
}

export function gfx_set_alignment(block, generator) {
  const o     = obj(block, generator);
  const align = block.getFieldValue('ALIGN') || 'Alignment.left';
  return `${o}.setAlignment(${align});\n`;
}

export function gfx_default_fill_color(block, generator) {
  const color = generator.valueToCode(block, 'COLOR', Order.NONE) || 'null';
  return `FilledShape.setDefaultFillColor(${color});\n`;
}

export function gfx_default_visibility(block, generator) {
  const v = generator.valueToCode(block, 'VISIBLE', Order.NONE) || 'true';
  return `Shape.setDefaultVisibility(${v});\n`;
}

// =============================================================================
// MOVEMENT – statement generators
// =============================================================================

export function gfx_move(block, generator) {
  const o  = obj(block, generator);
  const dx = num(block, generator, 'DX', '0');
  const dy = num(block, generator, 'DY', '0');
  return `${o}.move(${dx}, ${dy});\n`;
}

export function gfx_rotate(block, generator) {
  const o     = obj(block, generator);
  const angle = num(block, generator, 'ANGLE', '0');
  return `${o}.rotate(${angle});\n`;
}

export function gfx_rotate_around(block, generator) {
  const o     = obj(block, generator);
  const angle = num(block, generator, 'ANGLE', '0');
  const cx    = num(block, generator, 'CX',    '0');
  const cy    = num(block, generator, 'CY',    '0');
  return `${o}.rotate(${angle}, ${cx}, ${cy});\n`;
}

export function gfx_scale(block, generator) {
  const o  = obj(block, generator);
  const f  = num(block, generator, 'FACTOR', '1');
  return `${o}.scale(${f});\n`;
}

export function gfx_scale_around(block, generator) {
  const o  = obj(block, generator);
  const f  = num(block, generator, 'FACTOR', '1');
  const cx = num(block, generator, 'CX',     '0');
  const cy = num(block, generator, 'CY',     '0');
  return `${o}.scale(${f}, ${cx}, ${cy});\n`;
}

export function gfx_mirror_x(block, generator) {
  const o = obj(block, generator);
  return `${o}.mirrorX();\n`;
}

export function gfx_mirror_y(block, generator) {
  const o = obj(block, generator);
  return `${o}.mirrorY();\n`;
}

export function gfx_forward(block, generator) {
  const o = obj(block, generator);
  const l = num(block, generator, 'LENGTH', '10');
  return `${o}.forward(${l});\n`;
}

export function gfx_define_center(block, generator) {
  const o = obj(block, generator);
  const x = num(block, generator, 'X', '0');
  const y = num(block, generator, 'Y', '0');
  return `${o}.defineCenter(${x}, ${y});\n`;
}

export function gfx_define_direction(block, generator) {
  const o     = obj(block, generator);
  const angle = num(block, generator, 'ANGLE', '0');
  return `${o}.defineDirection(${angle});\n`;
}

export function gfx_turtle_turn(block, generator) {
  const o     = obj(block, generator);
  const angle = num(block, generator, 'ANGLE', '0');
  return `${o}.turn(${angle});\n`;
}

export function gfx_turtle_pen_up(block, generator) {
  return `${obj(block, generator)}.penUp();\n`;
}

export function gfx_turtle_pen_down(block, generator) {
  return `${obj(block, generator)}.penDown();\n`;
}

export function gfx_line_set_points(block, generator) {
  const o  = obj(block, generator);
  const x1 = num(block, generator, 'X1', '0');
  const y1 = num(block, generator, 'Y1', '0');
  const x2 = num(block, generator, 'X2', '0');
  const y2 = num(block, generator, 'Y2', '0');
  return `${o}.setPoints(${x1}, ${y1}, ${x2}, ${y2});\n`;
}

export function gfx_polygon_add_point(block, generator) {
  const o = obj(block, generator);
  const x = num(block, generator, 'X', '0');
  const y = num(block, generator, 'Y', '0');
  return `${o}.addPoint(${x}, ${y});\n`;
}

// =============================================================================
// CONTROL – value and statement generators
// =============================================================================

export function gfx_get_world(block, generator) {
  const o = obj(block, generator);
  return [`${o}.getWorld()`, Order.FUNCTION_CALL];
}

export function gfx_get_width(block, generator) {
  const o = obj(block, generator);
  return [`${o}.getWidth()`, Order.FUNCTION_CALL];
}

export function gfx_get_height(block, generator) {
  const o = obj(block, generator);
  return [`${o}.getHeight()`, Order.FUNCTION_CALL];
}

export function gfx_set_cursor(block, generator) {
  const o      = obj(block, generator);
  const cursor = block.getFieldValue('CURSOR') || 'default';
  return `${o}.setCursor("${cursor}");\n`;
}

export function gfx_group_add(block, generator) {
  const group = generator.valueToCode(block, 'GROUP', Order.MEMBER) || 'null';
  const shape = generator.valueToCode(block, 'OBJ',   Order.NONE)   || 'null';
  return `${group}.add(${shape});\n`;
}

export function gfx_get_collision_pairs(block, generator) {
  const g1     = generator.valueToCode(block, 'GROUP1',   Order.NONE) || 'null';
  const g2     = generator.valueToCode(block, 'GROUP2',   Order.NONE) || 'null';
  const maxOne = generator.valueToCode(block, 'MAX_ONE',  Order.NONE) || 'false';
  return [`${g1}.getCollisionPairs(${g2}, ${maxOne})`, Order.FUNCTION_CALL];
}

export function gfx_get_colliding_shapes(block, generator) {
  const group = generator.valueToCode(block, 'GROUP', Order.MEMBER) || 'null';
  const shape = generator.valueToCode(block, 'SHAPE', Order.NONE)   || 'null';
  return [`${group}.getCollidingShapes(${shape})`, Order.FUNCTION_CALL];
}

// Keyboard state – called inside act()
export function gfx_is_key_down(block, _generator) {
  const key = block.getFieldValue('KEY') || 'ArrowRight';
  return [`isKeyDown("${key}")`, Order.FUNCTION_CALL];
}

export function gfx_is_key_up(block, _generator) {
  const key = block.getFieldValue('KEY') || 'ArrowRight';
  return [`isKeyUp("${key}")`, Order.FUNCTION_CALL];
}

// =============================================================================
// EVENT HANDLER DECLARATIONS – @Override methods
// =============================================================================

/** Fixed Java parameter signatures for each graphics event. */
const GFX_EVENT_SIGNATURES = {
  'act':          '',
  'onKeyDown':    'String key',
  'onKeyUp':      'String key',
  'onKeyTyped':   'String key',
  'onMouseDown':  'double x, double y, int key',
  'onMouseUp':    'double x, double y, int key',
  'onMouseEnter': 'double x, double y',
  'onMouseLeave': 'double x, double y',
};

export function gfx_event_handler(block, generator) {
  const eventName = block.getFieldValue('EVENT') || 'act';
  const params    = GFX_EVENT_SIGNATURES[eventName] ?? '';
  const branch    = generator.statementToCode(block, 'STACK');
  const code = `@Override\npublic void ${eventName}(${params}) {\n${branch}}`;
  generator.definitions_['%method_' + eventName] = code;
  return null;
}

// Graphics inheritance
export function gfx_extends(block, _generator) {
  const parentClass = block.getFieldValue('PARENT_CLASS');
  if (parentClass) setExtendsClass(parentClass);
  return null;
}

// Color constant
export function gfx_color_const(block, _generator) {
  const color = block.getFieldValue('COLOR') || 'Color.black';
  return [color, Order.MEMBER];
}

// =============================================================================
// ADDITIONAL CONTROL – value and statement generators
// =============================================================================

// Shape position getters
export function gfx_get_x(block, generator) {
  const o = obj(block, generator);
  return [`${o}.getCenterX()`, Order.FUNCTION_CALL];
}

export function gfx_get_y(block, generator) {
  const o = obj(block, generator);
  return [`${o}.getCenterY()`, Order.FUNCTION_CALL];
}

// World controls
export function gfx_world_set_background(block, generator) {
  const o     = obj(block, generator);
  const color = generator.valueToCode(block, 'COLOR', Order.NONE) || 'null';
  return `${o}.setBackgroundColor(${color});\n`;
}

export function gfx_world_stop(block, generator) {
  return `${obj(block, generator)}.stop();\n`;
}

export function gfx_world_start(block, generator) {
  return `${obj(block, generator)}.start();\n`;
}

// Mouse state (called inside act(), no receiver)
export function gfx_is_mouse_down(_block, _generator) {
  return [`isMouseDown()`, Order.FUNCTION_CALL];
}

export function gfx_get_mouse_x(_block, _generator) {
  return [`getMouseX()`, Order.FUNCTION_CALL];
}

export function gfx_get_mouse_y(_block, _generator) {
  return [`getMouseY()`, Order.FUNCTION_CALL];
}

// Bitmap pixel operations
export function gfx_bitmap_set_pixel(block, generator) {
  const o     = obj(block, generator);
  const col   = num(block, generator, 'COL', '0');
  const row   = num(block, generator, 'ROW', '0');
  const color = generator.valueToCode(block, 'COLOR', Order.NONE) || 'null';
  return `${o}.setPixel(${col}, ${row}, ${color});\n`;
}

export function gfx_bitmap_get_pixel(block, generator) {
  const o   = obj(block, generator);
  const col = num(block, generator, 'COL', '0');
  const row = num(block, generator, 'ROW', '0');
  return [`${o}.getPixel(${col}, ${row})`, Order.FUNCTION_CALL];
}
