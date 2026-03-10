// List of preconfigured toolbox templates.
// Files live under src/toolbox_templates so they are easy to edit or extend.
import klasse9OhneGrafik from './klasse9_ohneGrafik.json';
import klasse9MitTurtle from './klasse9_mitTurtle.json';
import klasse9MitGrafik from './klasse9_mitGrafik.json'
import allesConfig from './alles.json';
import ohneTurtleConfig from './ohne_turtle.json';
import nurTurtleGrafikConfig from './nur_turtle_grafik.json';

export const templates = [
  { id: 'klasse9_ohneGrafik',          label: 'Klasse 9 ohne Grafik',         config: klasse9OhneGrafik },
  { id: 'klasse9_mitTurtle',           label: 'Klasse 9 mit Turtle',          config: klasse9MitTurtle },
  { id: 'klasse9_mitGrafik',          label: 'Klasse 9 mit Grafik',         config: klasse9MitGrafik },
  { id: 'alles',            label: 'Alles',             config: allesConfig },
  { id: 'ohne_turtle',      label: 'Ohne Turtle',       config: ohneTurtleConfig },
  { id: 'nur_turtle_grafik',label: 'Nur Turtle Grafik', config: nurTurtleGrafikConfig },
];

export default templates;
