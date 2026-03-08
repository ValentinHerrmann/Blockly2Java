/**
 * Custom Blockly blocks for the learnj.de online-IDE graphics library.
 *
 * Categories:
 *  1. Grafik: Objekte   – constructors (value + statement) for World and all shapes
 *  2. Grafik: Erscheinung – color, border, visibility
 *  3. Grafik: Bewegung  – move, rotate, scale, mirror, turtle ops, compound ops
 *  4. Grafik: Steuerung – World getters, keyboard state, group/collision, color constants
 *
 * Generated Java:  new ClassName(args)   /   obj.method(args);
 */

import * as Blockly from 'blockly/core';

// ── palette ──────────────────────────────────────────────────────────────────
const C_OBJ   = '#00796b';   // teal       – object constructors
const C_PROP  = '#6a1b9a';   // deep purple – appearance/properties
const C_MOVE  = '#1565c0';   // navy blue   – movement / transforms
const C_CTRL  = '#4e342e';   // brown       – control / events

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper – build inputs for a "new Xxx" constructor block.
// First param is inline with the block label; remaining params are right-aligned.
// params: [ [inputName, fieldLabel, typeCheck?], ... ]  (typeCheck defaults to 'Number')
// ─────────────────────────────────────────────────────────────────────────────
function buildObjInputs(block, label, params) {
  if (params.length === 0) {
    block.appendDummyInput().appendField(label);
    return;
  }
  const [[n0, l0, c0 = 'Number'], ...rest] = params;
  block.appendValueInput(n0).setCheck(c0).appendField(label + ' ' + l0);
  for (const [n, l, c = 'Number'] of rest) {
    block.appendValueInput(n).setAlign(Blockly.inputs.Align.RIGHT).setCheck(c).appendField(l);
  }
}

// =============================================================================
// 1.  WORLD
// =============================================================================

Blockly.Blocks['gfx_new_world'] = {
  init: function () {
    buildObjInputs(this, 'neue Welt', [
      ['WIDTH',  'Breite:'],
      ['HEIGHT', 'Höhe:'],
    ]);
    this.setOutput(true, 'World');
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt einen neuen Grafikbereich. Gibt die World zurück (für spätere Methoden-Aufrufe).');
  },
};

Blockly.Blocks['gfx_new_world_stmt'] = {
  init: function () {
    buildObjInputs(this, 'neue Welt', [
      ['WIDTH',  'Breite:'],
      ['HEIGHT', 'Höhe:'],
    ]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt einen neuen Grafikbereich (ohne Rückgabe).');
  },
};

// =============================================================================
// 2.  CIRCLE
// =============================================================================

Blockly.Blocks['gfx_new_circle'] = {
  init: function () {
    buildObjInputs(this, 'neuer Kreis', [
      ['X',      'x:'],
      ['Y',      'y:'],
      ['RADIUS', 'Radius:'],
    ]);
    this.setOutput(true, 'Circle');
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt einen Kreis mit Mittelpunkt (x, y) und dem angegebenen Radius.');
  },
};

Blockly.Blocks['gfx_new_circle_stmt'] = {
  init: function () {
    buildObjInputs(this, 'neuer Kreis', [
      ['X',      'x:'],
      ['Y',      'y:'],
      ['RADIUS', 'Radius:'],
    ]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt einen Kreis (ohne Rückgabe).');
  },
};

// =============================================================================
// 3.  ELLIPSE
// =============================================================================

Blockly.Blocks['gfx_new_ellipse'] = {
  init: function () {
    buildObjInputs(this, 'neue Ellipse', [
      ['X',        'x:'],
      ['Y',        'y:'],
      ['RADIUS_X', 'rx:'],
      ['RADIUS_Y', 'ry:'],
    ]);
    this.setOutput(true, 'Ellipse');
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt eine Ellipse mit Mittelpunkt (x, y) und den Halbachsen rx/ry.');
  },
};

Blockly.Blocks['gfx_new_ellipse_stmt'] = {
  init: function () {
    buildObjInputs(this, 'neue Ellipse', [
      ['X',        'x:'],
      ['Y',        'y:'],
      ['RADIUS_X', 'rx:'],
      ['RADIUS_Y', 'ry:'],
    ]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt eine Ellipse (ohne Rückgabe).');
  },
};

// =============================================================================
// 4.  RECTANGLE
// =============================================================================

Blockly.Blocks['gfx_new_rect'] = {
  init: function () {
    buildObjInputs(this, 'neues Rechteck', [
      ['TOP',    'oben:'],
      ['LEFT',   'links:'],
      ['WIDTH',  'Breite:'],
      ['HEIGHT', 'Höhe:'],
    ]);
    this.setOutput(true, 'Rectangle');
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt ein Rechteck (oben-links-Ecke + Breite/Höhe).');
  },
};

Blockly.Blocks['gfx_new_rect_stmt'] = {
  init: function () {
    buildObjInputs(this, 'neues Rechteck', [
      ['TOP',    'oben:'],
      ['LEFT',   'links:'],
      ['WIDTH',  'Breite:'],
      ['HEIGHT', 'Höhe:'],
    ]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt ein Rechteck (ohne Rückgabe).');
  },
};

// =============================================================================
// 5.  ROUNDED RECTANGLE
// =============================================================================

Blockly.Blocks['gfx_new_rrect'] = {
  init: function () {
    buildObjInputs(this, 'neues abger. Rechteck', [
      ['TOP',    'oben:'],
      ['LEFT',   'links:'],
      ['WIDTH',  'Breite:'],
      ['HEIGHT', 'Höhe:'],
      ['CORNER', 'Ecke:'],
    ]);
    this.setOutput(true, 'RoundedRectangle');
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt ein Rechteck mit abgerundeten Ecken.');
  },
};

Blockly.Blocks['gfx_new_rrect_stmt'] = {
  init: function () {
    buildObjInputs(this, 'neues abger. Rechteck', [
      ['TOP',    'oben:'],
      ['LEFT',   'links:'],
      ['WIDTH',  'Breite:'],
      ['HEIGHT', 'Höhe:'],
      ['CORNER', 'Ecke:'],
    ]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt ein Rechteck mit abgerundeten Ecken (ohne Rückgabe).');
  },
};

// =============================================================================
// 6.  TRIANGLE
// =============================================================================

Blockly.Blocks['gfx_new_triangle'] = {
  init: function () {
    buildObjInputs(this, 'neues Dreieck', [
      ['X1', 'x1:'],
      ['Y1', 'y1:'],
      ['X2', 'x2:'],
      ['Y2', 'y2:'],
      ['X3', 'x3:'],
      ['Y3', 'y3:'],
    ]);
    this.setOutput(true, 'Triangle');
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt ein Dreieck mit drei Eckpunkten.');
  },
};

Blockly.Blocks['gfx_new_triangle_stmt'] = {
  init: function () {
    buildObjInputs(this, 'neues Dreieck', [
      ['X1', 'x1:'],
      ['Y1', 'y1:'],
      ['X2', 'x2:'],
      ['Y2', 'y2:'],
      ['X3', 'x3:'],
      ['Y3', 'y3:'],
    ]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt ein Dreieck (ohne Rückgabe).');
  },
};

// =============================================================================
// 7.  LINE
// =============================================================================

Blockly.Blocks['gfx_new_line'] = {
  init: function () {
    buildObjInputs(this, 'neue Linie', [
      ['X1', 'x1:'],
      ['Y1', 'y1:'],
      ['X2', 'x2:'],
      ['Y2', 'y2:'],
    ]);
    this.setOutput(true, 'Line');
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt eine Linie zwischen zwei Punkten.');
  },
};

Blockly.Blocks['gfx_new_line_stmt'] = {
  init: function () {
    buildObjInputs(this, 'neue Linie', [
      ['X1', 'x1:'],
      ['Y1', 'y1:'],
      ['X2', 'x2:'],
      ['Y2', 'y2:'],
    ]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt eine Linie (ohne Rückgabe).');
  },
};

// =============================================================================
// 8.  TEXT
// =============================================================================

Blockly.Blocks['gfx_new_text'] = {
  init: function () {
    buildObjInputs(this, 'neuer Text', [
      ['X',    'x:'],
      ['Y',    'y:'],
      ['SIZE', 'Größe:'],
      ['TEXT', 'Text:', 'String'],
    ]);
    this.setOutput(true, 'Text');
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt ein Text-Objekt an Position (x, y) mit der angegebenen Schriftgröße.');
  },
};

Blockly.Blocks['gfx_new_text_stmt'] = {
  init: function () {
    buildObjInputs(this, 'neuer Text', [
      ['X',    'x:'],
      ['Y',    'y:'],
      ['SIZE', 'Größe:'],
      ['TEXT', 'Text:', 'String'],
    ]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt ein Text-Objekt (ohne Rückgabe).');
  },
};

// =============================================================================
// 9.  TURTLE
// =============================================================================

Blockly.Blocks['gfx_new_turtle'] = {
  init: function () {
    buildObjInputs(this, 'neue Schildkröte', [
      ['X', 'x:'],
      ['Y', 'y:'],
    ]);
    this.setOutput(true, 'Turtle');
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt eine Turtle an Position (x, y). Die Turtle zeichnet beim Vorwärtsgehen.');
  },
};

Blockly.Blocks['gfx_new_turtle_stmt'] = {
  init: function () {
    buildObjInputs(this, 'neue Schildkröte', [
      ['X', 'x:'],
      ['Y', 'y:'],
    ]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt eine Turtle (ohne Rückgabe).');
  },
};

// =============================================================================
// 10.  GROUP
// =============================================================================

Blockly.Blocks['gfx_new_group'] = {
  init: function () {
    this.appendDummyInput().appendField('neue Gruppe');
    this.setOutput(true, 'Group');
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt eine leere Gruppe. Objekte können danach mit add() hinzugefügt werden.');
  },
};

Blockly.Blocks['gfx_new_group_stmt'] = {
  init: function () {
    this.appendDummyInput().appendField('neue Gruppe');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt eine leere Gruppe (ohne Rückgabe).');
  },
};

// =============================================================================
// 11.  BITMAP
// =============================================================================

Blockly.Blocks['gfx_new_bitmap'] = {
  init: function () {
    buildObjInputs(this, 'neues Bitmap', [
      ['COLS',   'Spalten:'],
      ['ROWS',   'Zeilen:'],
      ['LEFT',   'links:'],
      ['TOP',    'oben:'],
      ['WIDTH',  'Breite:'],
      ['HEIGHT', 'Höhe:'],
    ]);
    this.setOutput(true, 'Bitmap');
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt ein Bitmap-Raster (Spalten×Zeilen Felder) an der angegebenen Position.');
  },
};

Blockly.Blocks['gfx_new_bitmap_stmt'] = {
  init: function () {
    buildObjInputs(this, 'neues Bitmap', [
      ['COLS',   'Spalten:'],
      ['ROWS',   'Zeilen:'],
      ['LEFT',   'links:'],
      ['TOP',    'oben:'],
      ['WIDTH',  'Breite:'],
      ['HEIGHT', 'Höhe:'],
    ]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt ein Bitmap-Raster (ohne Rückgabe).');
  },
};

// =============================================================================
// 12.  POLYGON
// =============================================================================

Blockly.Blocks['gfx_new_polygon'] = {
  init: function () {
    buildObjInputs(this, 'neues Polygon', [
      ['CLOSE', 'geschlossen:', 'Boolean'],
    ]);
    this.setOutput(true, 'Polygon');
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt ein Polygon (geschlossen/gefüllt wenn true, offenene Linie wenn false). Punkte mit addPoint() hinzufügen.');
  },
};

Blockly.Blocks['gfx_new_polygon_stmt'] = {
  init: function () {
    buildObjInputs(this, 'neues Polygon', [
      ['CLOSE', 'geschlossen:', 'Boolean'],
    ]);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_OBJ);
    this.setTooltip('Erstellt ein Polygon (ohne Rückgabe).');
  },
};

// =============================================================================
// APPEARANCE BLOCKS  (all are statement blocks with an OBJ input)
// =============================================================================

Blockly.Blocks['gfx_set_fill_color'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Füllfarbe von');
    this.appendValueInput('COLOR').setCheck(null).appendField('auf');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_PROP);
    this.setTooltip('Setzt die Füllfarbe eines Grafikobjekts. Farbe als String ("#ff0000"), Color-Konstante oder Zahl.');
  },
};

Blockly.Blocks['gfx_set_fill_color_alpha'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Füllfarbe von');
    this.appendValueInput('COLOR').setCheck(null).appendField('auf');
    this.appendValueInput('ALPHA').setCheck('Number').appendField('Alpha:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_PROP);
    this.setTooltip('Setzt die Füllfarbe mit Transparenz (Alpha 0=unsichtbar, 1=opak).');
  },
};

Blockly.Blocks['gfx_set_border_color'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Randfarbe von');
    this.appendValueInput('COLOR').setCheck(null).appendField('auf');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_PROP);
    this.setTooltip('Setzt die Randfarbe (Rahmenfarbe) eines Grafikobjekts.');
  },
};

Blockly.Blocks['gfx_set_border_width'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Randbreite von');
    this.appendValueInput('WIDTH').setCheck('Number').appendField('auf');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_PROP);
    this.setTooltip('Setzt die Randbreite (Linienstärke des Rahmens).');
  },
};

Blockly.Blocks['gfx_set_alpha'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Transparenz von');
    this.appendValueInput('ALPHA').setCheck('Number').appendField('auf');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_PROP);
    this.setTooltip('Setzt die Transparenz (0=unsichtbar, 1=opak).');
  },
};

Blockly.Blocks['gfx_set_visible'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Sichtbarkeit von');
    this.appendValueInput('VISIBLE').setCheck('Boolean').appendField('auf');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_PROP);
    this.setTooltip('Zeigt oder versteckt ein Grafikobjekt (true=sichtbar, false=versteckt).');
  },
};

Blockly.Blocks['gfx_bring_to_front'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('in den Vordergrund:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_PROP);
    this.setTooltip('Bringt das Objekt in den Vordergrund (wird zuletzt gezeichnet).');
  },
};

Blockly.Blocks['gfx_send_to_back'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('in den Hintergrund:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_PROP);
    this.setTooltip('Schickt das Objekt in den Hintergrund (wird zuerst gezeichnet).');
  },
};

// setText / setAlignment only for Text objects
Blockly.Blocks['gfx_set_text_content'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Text-Inhalt von');
    this.appendValueInput('TEXT').setCheck('String').appendField('auf');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_PROP);
    this.setTooltip('Ändert den angezeigten Text eines Text-Objekts.');
  },
};

Blockly.Blocks['gfx_set_alignment'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Ausrichtung von');
    this.appendDummyInput()
      .appendField('auf')
      .appendField(new Blockly.FieldDropdown([
        ['links',  'Alignment.left'],
        ['mitte',  'Alignment.center'],
        ['rechts', 'Alignment.right'],
      ]), 'ALIGN');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_PROP);
    this.setTooltip('Setzt die Textausrichtung (links / mitte / rechts).');
  },
};

// Static defaults
Blockly.Blocks['gfx_default_fill_color'] = {
  init: function () {
    this.appendDummyInput().appendField('Standard-Füllfarbe (alle Formen)');
    this.appendValueInput('COLOR').setCheck(null).appendField('auf');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_PROP);
    this.setTooltip('Setzt die Standard-Füllfarbe für alle neu erstellten FilledShape-Objekte (FilledShape.setDefaultFillColor).');
  },
};

Blockly.Blocks['gfx_default_visibility'] = {
  init: function () {
    this.appendDummyInput().appendField('Standard-Sichtbarkeit (alle Formen)');
    this.appendValueInput('VISIBLE').setCheck('Boolean').appendField('auf');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_PROP);
    this.setTooltip('Setzt die Standard-Sichtbarkeit für alle neu erstellten Shape-Objekte (Shape.setDefaultVisibility).');
  },
};

// =============================================================================
// MOVEMENT BLOCKS
// =============================================================================

Blockly.Blocks['gfx_move'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('bewege');
    this.appendValueInput('DX').setCheck('Number').appendField('um dx:');
    this.appendValueInput('DY').setCheck('Number').appendField('dy:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Verschiebt das Objekt um (dx, dy). Positive dy = nach unten.');
  },
};

Blockly.Blocks['gfx_rotate'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('rotiere');
    this.appendValueInput('ANGLE').setCheck('Number').appendField('um');
    this.appendDummyInput().appendField('Grad');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Dreht das Objekt um den Mittelpunkt (positive Werte = Uhrzeigersinn).');
  },
};

Blockly.Blocks['gfx_rotate_around'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('rotiere');
    this.appendValueInput('ANGLE').setCheck('Number').appendField('um');
    this.appendDummyInput().appendField('Grad um Punkt');
    this.appendValueInput('CX').setCheck('Number').appendField('cx:');
    this.appendValueInput('CY').setCheck('Number').appendField('cy:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Dreht das Objekt um einen bestimmten Drehpunkt (cx, cy).');
  },
};

Blockly.Blocks['gfx_scale'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('skaliere');
    this.appendValueInput('FACTOR').setCheck('Number').appendField('Faktor:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Skaliert das Objekt vom Mittelpunkt aus (Faktor > 1 = vergrößern, < 1 = verkleinern).');
  },
};

Blockly.Blocks['gfx_scale_around'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('skaliere');
    this.appendValueInput('FACTOR').setCheck('Number').appendField('Faktor:');
    this.appendDummyInput().appendField('um Punkt');
    this.appendValueInput('CX').setCheck('Number').appendField('cx:');
    this.appendValueInput('CY').setCheck('Number').appendField('cy:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Skaliert das Objekt von einem bestimmten Mittelpunkt aus.');
  },
};

Blockly.Blocks['gfx_mirror_x'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('spiegele X-Achse:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Spiegelt das Objekt an der X-Achse (oben/unten).');
  },
};

Blockly.Blocks['gfx_mirror_y'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('spiegele Y-Achse:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Spiegelt das Objekt an der Y-Achse (links/rechts).');
  },
};

Blockly.Blocks['gfx_forward'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('vorwärts');
    this.appendValueInput('LENGTH').setCheck('Number').appendField('um');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Bewegt das Objekt in die aktuelle Blickrichtung (für Turtle und zusammengesetzte Objekte).');
  },
};

Blockly.Blocks['gfx_define_center'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Zentrum von');
    this.appendValueInput('X').setCheck('Number').appendField('setzen auf x:');
    this.appendValueInput('Y').setCheck('Number').appendField('y:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Legt den Dreh-/Bewegungsmittelpunkt eines zusammengesetzten Objekts fest.');
  },
};

Blockly.Blocks['gfx_define_direction'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Richtung von');
    this.appendValueInput('ANGLE').setCheck('Number').appendField('setzen auf');
    this.appendDummyInput().appendField('Grad');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Legt die Anfangsrichtung eines zusammengesetzten Objekts fest.');
  },
};

// Turtle-specific
Blockly.Blocks['gfx_turtle_turn'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('drehe Schildkröte');
    this.appendValueInput('ANGLE').setCheck('Number').appendField('um');
    this.appendDummyInput().appendField('Grad');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Dreht die Blickrichtung der Turtle um den angegebenen Winkel.');
  },
};

Blockly.Blocks['gfx_turtle_pen_up'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Stift heben:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Hebt den Stift der Turtle (Bewegung ohne Zeichnen).');
  },
};

Blockly.Blocks['gfx_turtle_pen_down'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Stift senken:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Senkt den Stift der Turtle (Bewegung mit Zeichnen).');
  },
};

// Line-specific
Blockly.Blocks['gfx_line_set_points'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('setze Linienpunkte von');
    this.appendValueInput('X1').setCheck('Number').appendField('x1:');
    this.appendValueInput('Y1').setCheck('Number').appendField('y1:');
    this.appendValueInput('X2').setCheck('Number').appendField('x2:');
    this.appendValueInput('Y2').setCheck('Number').appendField('y2:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Ändert beide Endpunkte einer Linie.');
  },
};

// Polygon-specific
Blockly.Blocks['gfx_polygon_add_point'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Punkt hinzufügen zu');
    this.appendValueInput('X').setCheck('Number').appendField('x:');
    this.appendValueInput('Y').setCheck('Number').appendField('y:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_MOVE);
    this.setTooltip('Fügt einen weiteren Punkt zum Polygon hinzu.');
  },
};

// =============================================================================
// CONTROL BLOCKS (World, Group, keyboard, color constants)
// =============================================================================

// World getters (value blocks)
Blockly.Blocks['gfx_get_world'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Welt von');
    this.setInputsInline(true);
    this.setOutput(true, 'World');
    this.setColour(C_CTRL);
    this.setTooltip('Gibt die zugehörige World zurück (getWorld()).');
  },
};

Blockly.Blocks['gfx_get_width'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Breite der Welt');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(C_CTRL);
    this.setTooltip('Gibt die Breite (Koordinatenbreite) der World zurück.');
  },
};

Blockly.Blocks['gfx_get_height'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Höhe der Welt');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(C_CTRL);
    this.setTooltip('Gibt die Höhe (Koordinatenhöhe) der World zurück.');
  },
};

Blockly.Blocks['gfx_set_cursor'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Cursor von');
    this.appendDummyInput()
      .appendField('auf')
      .appendField(new Blockly.FieldDropdown([
        ['Standard',       'default'],
        ['Zeiger (Hand)',  'pointer'],
        ['Warten',         'progress'],
        ['Fadenkreuz',     'crosshair'],
        ['Verschieben',    'move'],
        ['Verboten',       'not-allowed'],
      ]), 'CURSOR');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_CTRL);
    this.setTooltip('Ändert das Mauszeigersymbol im Grafikbereich (world.setCursor(…)).');
  },
};

// Group operations
Blockly.Blocks['gfx_group_add'] = {
  init: function () {
    this.appendValueInput('GROUP').setCheck(null).appendField('füge zu Gruppe');
    this.appendValueInput('OBJ').setCheck(null).appendField('hinzu:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_CTRL);
    this.setTooltip('Fügt ein Grafikobjekt zu einer Gruppe hinzu.');
  },
};

Blockly.Blocks['gfx_get_collision_pairs'] = {
  init: function () {
    this.appendValueInput('GROUP1').setCheck(null).appendField('Kollisionspaare von');
    this.appendValueInput('GROUP2').setCheck(null).appendField('mit');
    this.appendValueInput('MAX_ONE').setCheck('Boolean').appendField('max. einer pro Form:');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(C_CTRL);
    this.setTooltip('Gibt Kollisionspaare zwischen zwei Gruppen zurück (getCollisionPairs).');
  },
};

Blockly.Blocks['gfx_get_colliding_shapes'] = {
  init: function () {
    this.appendValueInput('GROUP').setCheck(null).appendField('kollidierend mit');
    this.appendValueInput('SHAPE').setCheck(null).appendField('in Gruppe');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(C_CTRL);
    this.setTooltip('Gibt alle Objekte einer Gruppe zurück, die mit dem angegebenen Objekt kollidieren.');
  },
};

// Keyboard state (value blocks – used inside act())
Blockly.Blocks['gfx_is_key_down'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Taste gedrückt:')
      .appendField(new Blockly.FieldTextInput('ArrowRight'), 'KEY');
    this.setOutput(true, 'Boolean');
    this.setColour(C_CTRL);
    this.setTooltip('Gibt true zurück, wenn die genannte Taste gerade gedrückt ist. Typische Werte: ArrowRight, ArrowLeft, ArrowUp, ArrowDown, " " (Leertaste), w, a, s, d …');
  },
};

Blockly.Blocks['gfx_is_key_up'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Taste losgelassen:')
      .appendField(new Blockly.FieldTextInput('ArrowRight'), 'KEY');
    this.setOutput(true, 'Boolean');
    this.setColour(C_CTRL);
    this.setTooltip('Gibt true zurück, wenn die genannte Taste aktuell NICHT gedrückt ist.');
  },
};

// =============================================================================
// ADDITIONAL CONTROL BLOCKS
// =============================================================================

// Shape position getters
Blockly.Blocks['gfx_get_x'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('x-Position von');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(C_CTRL);
    this.setTooltip('Gibt die x-Koordinate des Objekts zurück.');
  },
};

Blockly.Blocks['gfx_get_y'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('y-Position von');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(C_CTRL);
    this.setTooltip('Gibt die y-Koordinate des Objekts zurück.');
  },
};

// World controls
Blockly.Blocks['gfx_world_set_background'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Hintergrundfarbe von');
    this.appendValueInput('COLOR').setCheck(null).appendField('setzen auf');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_CTRL);
    this.setTooltip('Setzt die Hintergrundfarbe der World (world.setBackgroundColor(color)).');
  },
};

Blockly.Blocks['gfx_world_stop'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Animation stoppen:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_CTRL);
    this.setTooltip('Stoppt die Animations-Schleife (world.stop()). Die act()-Methode wird nicht mehr aufgerufen.');
  },
};

Blockly.Blocks['gfx_world_start'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Animation starten:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_CTRL);
    this.setTooltip('Startet die Animations-Schleife (world.start()).');
  },
};

// Mouse state – value blocks (used inside act() without a receiver)
Blockly.Blocks['gfx_is_mouse_down'] = {
  init: function () {
    this.appendDummyInput().appendField('Maus gedrückt');
    this.setOutput(true, 'Boolean');
    this.setColour(C_CTRL);
    this.setTooltip('Gibt true zurück, wenn die Maustaste gerade gedrückt ist (isMouseDown()). Innerhalb von act() verwenden.');
  },
};

Blockly.Blocks['gfx_get_mouse_x'] = {
  init: function () {
    this.appendDummyInput().appendField('Maus x');
    this.setOutput(true, 'Number');
    this.setColour(C_CTRL);
    this.setTooltip('Gibt die aktuelle x-Koordinate des Mauszeigers zurück (getMouseX()). Innerhalb von act() verwenden.');
  },
};

Blockly.Blocks['gfx_get_mouse_y'] = {
  init: function () {
    this.appendDummyInput().appendField('Maus y');
    this.setOutput(true, 'Number');
    this.setColour(C_CTRL);
    this.setTooltip('Gibt die aktuelle y-Koordinate des Mauszeigers zurück (getMouseY()). Innerhalb von act() verwenden.');
  },
};

// Bitmap pixel operations
Blockly.Blocks['gfx_bitmap_set_pixel'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Pixel setzen in');
    this.appendValueInput('COL').setCheck('Number').appendField('Spalte:');
    this.appendValueInput('ROW').setCheck('Number').appendField('Zeile:');
    this.appendValueInput('COLOR').setCheck(null).appendField('Farbe:');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(C_CTRL);
    this.setTooltip('Setzt die Farbe eines Pixels im Bitmap (bitmap.setPixel(col, row, color)).');
  },
};

Blockly.Blocks['gfx_bitmap_get_pixel'] = {
  init: function () {
    this.appendValueInput('OBJ').setCheck(null).appendField('Farbe von Pixel in');
    this.appendValueInput('COL').setCheck('Number').appendField('Spalte:');
    this.appendValueInput('ROW').setCheck('Number').appendField('Zeile:');
    this.setInputsInline(true);
    this.setOutput(true, 'String');
    this.setColour(C_CTRL);
    this.setTooltip('Gibt die Farbe eines Pixels als Farbstring zurück (bitmap.getPixel(col, row)).');
  },
};

// ── Graphics inheritance block ──────────────────────────────────────────────
// Declares that the current class extends one of the graphics library classes.
// Generates the same 'extends ClassName' clause as java_extends.
Blockly.Blocks['gfx_extends'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('erbt von Grafik-Klasse')
      .appendField(
        new Blockly.FieldDropdown([
          ['Actor',             'Actor'],
          ['World',             'World'],
          ['Circle',            'Circle'],
          ['Ellipse',           'Ellipse'],
          ['Rectangle',         'Rectangle'],
          ['RoundedRectangle',  'RoundedRectangle'],
          ['Triangle',          'Triangle'],
          ['Line',              'Line'],
          ['Polygon',           'Polygon'],
          ['Text',              'Text'],
          ['Turtle',            'Turtle'],
          ['Group',             'Group'],
          ['Bitmap',            'Bitmap'],
        ]),
        'PARENT_CLASS'
      );
    this.setPreviousStatement(false, null);
    this.setNextStatement(false, null);
    this.setColour('#5B6B8A');   // same as java_extends (INHERIT_COLOUR)
    this.setTooltip('Legt fest, von welcher Grafik-Klasse diese Klasse erbt (z.B. extends Circle).');
    this.setHelpUrl('');
  },
};

// ── Graphics event-handler declarations ─────────────────────────────────────
// Creates an @Override method stub for the events defined by the learnj.de
// graphics API (act, onKeyDown/Up, onMouse*).
const GFX_EVENT_LIST = [
  ['act()  — Animationsschritt',                      'act'],
  ['onKeyDown(key)  — Taste gedrückt',                'onKeyDown'],
  ['onKeyUp(key)  — Taste losgelassen',               'onKeyUp'],
  ['onKeyTyped(key)  — Taste angeschlagen',           'onKeyTyped'],
  ['onMouseDown(x, y, key)  — Maustaste gedrückt',          'onMouseDown'],
  ['onMouseUp(x, y, key)  — Maustaste losgelassen',         'onMouseUp'],
  ['onMouseEnter()  — Maus betritt Objekt',           'onMouseEnter'],
  ['onMouseLeave()  — Maus verlässt Objekt',          'onMouseLeave'],
];

/** Variable names to create in the workspace for each event's parameters. */
const GFX_EVENT_PARAM_VARS = {
  'act':          [],
  'onKeyDown':    ['key'],
  'onKeyUp':      ['key'],
  'onKeyTyped':   ['key'],
  'onMouseDown':  ['x', 'y', 'key'],
  'onMouseUp':    ['x', 'y', 'key'],
  'onMouseEnter': [],
  'onMouseLeave': [],
};

Blockly.Blocks['gfx_event_handler'] = {
  init: function () {
    this.appendDummyInput('TOP_LINE')
      .appendField('Ereignis-Methode')
      .appendField(
        new Blockly.FieldDropdown(GFX_EVENT_LIST, (newValue) => {
          // Defer so the field value is already committed when we read it.
          setTimeout(() => { if (!this.disposed) this.syncParamVars_(newValue); }, 0);
          return undefined;  // accept the change
        }),
        'EVENT'
      );
    this.appendStatementInput('STACK').setCheck(null);
    this.setPreviousStatement(false, null);
    this.setNextStatement(false, null);
    this.setColour('#995599');  // same as NORMAL_METHOD_COLOUR
    this.setTooltip(
      'Definiert eine Ereignis-Methode die automatisch aufgerufen wird.\n' +
      'act() läuft bei jedem Animationsschritt.\n' +
      'onKeyDown / onKeyUp / onKeyTyped erhalten den Tastennamen als Variable "key".\n' +
      'onMouseDown / onMouseUp erhalten Position (x, y) und Maustaste (0 = links, 2 = rechts) als Variable "key".\n' +
      'onMouseEnter / onMouseLeave haben keine Parameter.'
    );
    this.setHelpUrl('');
  },

  /** Creates workspace variables for the selected event's parameters. */
  syncParamVars_: function (eventName) {
    const ws = this.workspace;
    if (!ws) return;
    for (const name of (GFX_EVENT_PARAM_VARS[eventName] ?? [])) {
      if (!ws.getVariable(name, '')) ws.createVariable(name, '');
    }
  },

  onchange: function (event) {
    if (!this.workspace || this.workspace.isDragging()) return;
    const relevant = event.type === Blockly.Events.BLOCK_CREATE
                  || event.type === Blockly.Events.BLOCK_DRAG;
    if (relevant && event.blockId === this.id) {
      this.syncParamVars_(this.getFieldValue('EVENT') || 'act');
    }
  },
};

// Color constant – produces e.g. "Color.red" as a String expression
Blockly.Blocks['gfx_color_const'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Farbe:')
      .appendField(new Blockly.FieldDropdown([
        ['rot',          'Color.red'],
        ['blau',         'Color.blue'],
        ['grün',         'Color.green'],
        ['gelb',         'Color.yellow'],
        ['orange',       'Color.orange'],
        ['lila',         'Color.purple'],
        ['schwarz',      'Color.black'],
        ['weiß',         'Color.white'],
        ['grau',         'Color.gray'],
        ['pink',         'Color.pink'],
        ['cyan',         'Color.cyan'],
        ['magenta',      'Color.magenta'],
        ['braun',        'Color.brown'],
        ['transparent',  'null'],
      ]), 'COLOR');
    this.setOutput(true, 'String');
    this.setColour(C_CTRL);
    this.setTooltip('Eine vordefinierte Farb-Konstante (z. B. Color.red).');
  },
};
