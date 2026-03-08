// List of preconfigured toolbox templates.
// Files live under src/toolbox_templates so they are easy to edit or extend.
import klasse9Config from './klasse9.json';
import allesConfig from './alles.json';
import ohneTurtleConfig from './ohne_turtle.json';
import nurTurtleGrafikConfig from './nur_turtle_grafik.json';

export const templates = [
  { id: 'klasse9',          label: 'Klasse 9',         config: klasse9Config },
  { id: 'alles',            label: 'Alles',             config: allesConfig },
  { id: 'ohne_turtle',      label: 'Ohne Turtle',       config: ohneTurtleConfig },
  { id: 'nur_turtle_grafik',label: 'Nur Turtle Grafik', config: nurTurtleGrafikConfig },
];

export default templates;
