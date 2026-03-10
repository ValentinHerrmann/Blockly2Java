export const farbenCategory = {
    'kind': 'category',
    'name': 'Farben',
    'categorystyle': 'colour_category',
    'contents': [
        { 'kind': 'block', 'type': 'colour_picker' },
        { 'kind': 'block', 'type': 'colour_random' },
        {
            'kind': 'block',
            'type': 'colour_rgb',
            'inputs': {
                'RED':   { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } },
                'GREEN': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 50  } } },
                'BLUE':  { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0   } } },
            },
        },
        {
            'kind': 'block',
            'type': 'colour_blend',
            'inputs': {
                'COLOUR1': { 'shadow': { 'type': 'colour_picker', 'fields': { 'COLOUR': '#ff0000' } } },
                'COLOUR2': { 'shadow': { 'type': 'colour_picker', 'fields': { 'COLOUR': '#3333ff' } } },
                'RATIO':   { 'shadow': { 'type': 'math_number',   'fields': { 'NUM': 0.5 } } },
            },
        },
        // Farb-Konstante
        {
            'kind': 'block', 'type': 'gfx_color_const',
        },
    ],
};
