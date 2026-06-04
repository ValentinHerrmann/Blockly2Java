import { logikCategory } from './toolbox/logic.js';
import { schleifenCategory } from './toolbox/loops.js';
import { matheCategory } from './toolbox/math.js';
import { textCategory } from './toolbox/text.js';
import { arraysCategory } from './toolbox/arrays.js';
import { farbenCategory } from './toolbox/colors.js';
import { javaCategories } from './toolbox/java.js';
import { graphicsCategories } from './toolbox/graphics.js';

export const toolbox = {
    'kind': 'categoryToolbox',
    'contents': [
        logikCategory,
        schleifenCategory,
        matheCategory,
        textCategory,
        arraysCategory,
        farbenCategory,
        { 'kind': 'sep' },
        ...javaCategories,
        ...graphicsCategories,
    ],
};
