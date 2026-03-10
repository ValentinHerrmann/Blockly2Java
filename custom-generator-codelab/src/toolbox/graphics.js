export const graphicsCategories = [
    // ── Grafik ────────────────────────────────────────────────────────────
    { 'kind': 'sep' },
    {
        'kind': 'category',
        'name': 'Grafik: Objekte',
        'colour': '#00796b',
        'contents': [
            // ── Vererbung ─────────────────────────────────────────────────
            { 'kind': 'block', 'type': 'gfx_extends' },
            // ── World ──────────────────────────────────────────────────────
            {
                'kind': 'block', 'type': 'java_local_var_set',
                'fields': { 'VAR': { 'name': 'world1', 'type': 'local' } },
                'inputs': {
                    'VALUE': { 'block': {
                        'type': 'gfx_new_world',
                        'inputs': {
                            'WIDTH':  { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 800 } } },
                            'HEIGHT': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 600 } } },
                        },
                    }},
                },
            },
            // ── Shapes (unified) ──────────────────────────────────────────
            {
                'kind': 'block', 'type': 'java_local_var_set',
                'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } },
                'inputs': {
                    'VALUE': { 'block': { 'type': 'gfx_new_shape' } },
                },
            },
            // ── Polygon ───────────────────────────────────────────────────
            {
                'kind': 'block', 'type': 'java_local_var_set',
                'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } },
                'inputs': {
                    'VALUE': { 'block': {
                        'type': 'gfx_new_polygon',
                        'inputs': {
                            'CLOSE': { 'shadow': { 'type': 'logic_boolean', 'fields': { 'BOOL': 'TRUE' } } },
                        },
                    }},
                },
            },
            // ── Text ──────────────────────────────────────────────────────
            {
                'kind': 'block', 'type': 'java_local_var_set',
                'fields': { 'VAR': { 'name': 'text', 'type': 'local' } },
                'inputs': {
                    'VALUE': { 'block': {
                        'type': 'gfx_new_text',
                        'inputs': {
                            'X':    { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } },
                            'Y':    { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } },
                            'SIZE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 20 } } },
                            'TEXT': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': 'Hallo!' } } },
                        },
                    }},
                },
            },
            // ── Group ─────────────────────────────────────────────────────
            {
                'kind': 'block', 'type': 'java_local_var_set',
                'fields': { 'VAR': { 'name': 'group1', 'type': 'local' } },
                'inputs': {
                    'VALUE': { 'block': { 'type': 'gfx_new_group' } },
                },
            },
            // ── Bitmap ────────────────────────────────────────────────────
            {
                'kind': 'block', 'type': 'java_local_var_set',
                'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } },
                'inputs': {
                    'VALUE': { 'block': {
                        'type': 'gfx_new_bitmap',
                        'inputs': {
                            'COLS':   { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 10  } } },
                            'ROWS':   { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 10  } } },
                            'LEFT':   { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0   } } },
                            'TOP':    { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0   } } },
                            'WIDTH':  { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 200 } } },
                            'HEIGHT': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 200 } } },
                        },
                    }},
                },
            },
        ],
    },
    {
        'kind': 'category',
        'name': 'Grafik: Erscheinung',
        'colour': '#6a1b9a',
        'contents': [
            // Füllfarbe
            { 'kind': 'block', 'type': 'gfx_set_fill_color',
                'inputs': { 
                    'OBJ': { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } } } },
                    'COLOR': { 'shadow': { 'type': 'colour_picker', 'fields': { 'COLOUR': '#ff0000' } } }
                },
            },
            {
                'kind': 'block', 'type': 'gfx_set_fill_color_alpha',
                'inputs': {
                    'OBJ':   { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } } } },
                    'COLOR': { 'shadow': { 'type': 'colour_picker', 'fields': { 'COLOUR': '#ff0000' } } },
                    'ALPHA': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0.5 } } },
                },
            },
            // Rand
            { 'kind': 'block', 'type': 'gfx_set_border_color',
                'inputs': { 
                    'OBJ': { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } } } },
                    'COLOR': { 'shadow': { 'type': 'colour_picker', 'fields': { 'COLOUR': '#ff0000' } } },
                },
            },
            {
                'kind': 'block', 'type': 'gfx_set_border_width',
                'inputs': {
                    'OBJ':   { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } } } },
                    'WIDTH': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 2 } } },
                },
            },
            // Transparenz
            {
                'kind': 'block', 'type': 'gfx_set_alpha',
                'inputs': {
                    'OBJ':   { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } } } },
                    'ALPHA': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1.0 } } },
                },
            },
            // Sichtbarkeit / Reihenfolge
            { 'kind': 'block', 'type': 'gfx_set_visible',
                'inputs': { 
                    'OBJ': { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } } } },
                    'VISIBLE': { 'shadow': { 'type': 'logic_boolean', 'fields': { 'BOOL': true } } }
                },
            },
            { 'kind': 'block', 'type': 'gfx_bring_to_front',
                'inputs': { 'OBJ': { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } } } } },
            },
            { 'kind': 'block', 'type': 'gfx_send_to_back',
                'inputs': { 'OBJ': { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } } } } },
            },
            // Text-spezifisch
            {
                'kind': 'block', 'type': 'gfx_set_text_content',
                'inputs': {
                    'OBJ': { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } } } },
                    'TEXT': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': 'Hallo!' } } },
                },
            },
            { 'kind': 'block', 'type': 'gfx_set_alignment',
                'inputs': { 'OBJ': { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'text', 'type': 'local' } } } } },
            },
            // Globale Standards
            { 'kind': 'block', 'type': 'gfx_default_fill_color' ,
                'inputs': { 'COLOR': { 'shadow': { 'type': 'colour_picker', 'fields': { 'COLOUR': '#ff0000' } } } }
            },
            { 'kind': 'block', 'type': 'gfx_default_visibility' ,
                'inputs': { 'VISIBLE': { 'shadow': { 'type': 'logic_boolean', 'fields': { 'BOOL': true } } } }
            },
        ],
    },
    {
        'kind': 'category',
        'name': 'Grafik: Bewegung',
        'colour': '#1565c0',
        'contents': [
            // move / rotate / scale
            {
                'kind': 'block', 'type': 'gfx_move',
                'inputs': {
                    'DX': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 5 } } },
                    'DY': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                },
            },
            {
                'kind': 'block', 'type': 'gfx_rotate',
                'inputs': {
                    'ANGLE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 5 } } },
                },
            },
            {
                'kind': 'block', 'type': 'gfx_rotate_around',
                'inputs': {
                    'ANGLE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 5   } } },
                    'CX':    { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 400 } } },
                    'CY':    { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 300 } } },
                },
            },
            {
                'kind': 'block', 'type': 'gfx_scale',
                'inputs': {
                    'FACTOR': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1.1 } } },
                },
            },
            {
                'kind': 'block', 'type': 'gfx_scale_around',
                'inputs': {
                    'FACTOR': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1.1 } } },
                    'CX':     { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 400 } } },
                    'CY':     { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 300 } } },
                },
            },
            { 'kind': 'block', 'type': 'gfx_mirror_x' },
            { 'kind': 'block', 'type': 'gfx_mirror_y' },
            // Line
            {
                'kind': 'block', 'type': 'gfx_line_set_points',
                'inputs': {
                    'X1': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0   } } },
                    'Y1': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0   } } },
                    'X2': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } },
                    'Y2': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } },
                },
            },
            // Polygon
            {
                'kind': 'block', 'type': 'gfx_polygon_add_point',
                'inputs': {
                    'X': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                    'Y': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                },
            },
        ],
    },
    {
        'kind': 'category',
        'name': 'Grafik: Turtle',
        'colour': '#2e7d32',
        'contents': [
            // Konstruktoren
            {
                'kind': 'block', 'type': 'java_local_var_set',
                'fields': { 'VAR': { 'name': 'turtle', 'type': 'local' } },
                'inputs': {
                    'VALUE': { 'block': {
                        'type': 'gfx_new_turtle',
                        'inputs': {
                            'X': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 400 } } },
                            'Y': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 300 } } },
                        },
                    }},
                },
            },
            // Bewegung
            {
                'kind': 'block', 'type': 'gfx_forward',
                'inputs': {
                    'OBJ':    { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'turtle', 'type': 'local' } } } },
                    'LENGTH': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 50 } } },
                },
            },
            {
                'kind': 'block', 'type': 'gfx_turtle_turn',
                'inputs': {
                    'OBJ':   { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'turtle', 'type': 'local' } } } },
                    'ANGLE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 90 } } },
                },
            },
            {
                'kind': 'block', 'type': 'gfx_define_direction',
                'inputs': {
                    'OBJ':   { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'turtle', 'type': 'local' } } } },
                    'ANGLE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                },
            },
            // Stift
            {
                'kind': 'block', 'type': 'gfx_turtle_pen_up',
                'inputs': {
                    'OBJ': { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'turtle', 'type': 'local' } } } },
                },
            },
            {
                'kind': 'block', 'type': 'gfx_turtle_pen_down',
                'inputs': {
                    'OBJ': { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'turtle', 'type': 'local' } } } },
                },
            },
            // Zentrum (zusammengesetzte Objekte)
            {
                'kind': 'block', 'type': 'gfx_define_center',
                'inputs': {
                    'OBJ': { 'shadow': { 'type': 'java_local_var_get', 'fields': { 'VAR': { 'name': 'turtle', 'type': 'local' } } } },
                    'X':   { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                    'Y':   { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                },
            },
        ],
    },
    {
        'kind': 'category',
        'name': 'Grafik: Steuerung',
        'colour': '#4e342e',
        'contents': [
            // Ereignis-Methoden (@Override)
            {
                'kind': 'block', 'type': 'gfx_event_handler',
                'fields': { 'EVENT': 'act' },
            },
            // World-Methoden
            { 'kind': 'block', 'type': 'gfx_get_world' },
            { 'kind': 'block', 'type': 'gfx_get_width' },
            { 'kind': 'block', 'type': 'gfx_get_height' },
            { 'kind': 'block', 'type': 'gfx_set_cursor' },
            { 'kind': 'block', 'type': 'gfx_world_set_background' },
            { 'kind': 'block', 'type': 'gfx_world_stop' },
            { 'kind': 'block', 'type': 'gfx_world_start' },
            // Objekt-Position
            { 'kind': 'block', 'type': 'gfx_get_x' },
            { 'kind': 'block', 'type': 'gfx_get_y' },
            // Tastatur-Zustand (innerhalb von act() verwenden)
            {
                'kind': 'block', 'type': 'gfx_is_key_down',
                'fields': { 'KEY': 'ArrowRight' },
            },
            {
                'kind': 'block', 'type': 'gfx_is_key_up',
                'fields': { 'KEY': 'ArrowRight' },
            },
            // Maus-Zustand (innerhalb von act() verwenden)
            { 'kind': 'block', 'type': 'gfx_is_mouse_down' },
            { 'kind': 'block', 'type': 'gfx_get_mouse_x' },
            { 'kind': 'block', 'type': 'gfx_get_mouse_y' },
            // Gruppe / Kollision
            { 'kind': 'block', 'type': 'gfx_group_add' },
            {
                'kind': 'block', 'type': 'gfx_get_collision_pairs',
                'inputs': {
                    'MAX_ONE': { 'shadow': { 'type': 'logic_boolean', 'fields': { 'BOOL': 'FALSE' } } },
                },
            },
            { 'kind': 'block', 'type': 'gfx_get_colliding_shapes' },
            // Bitmap-Pixel
            {
                'kind': 'block', 'type': 'gfx_bitmap_set_pixel',
                'inputs': {
                    'COL': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                    'ROW': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                },
            },
            {
                'kind': 'block', 'type': 'gfx_bitmap_get_pixel',
                'inputs': {
                    'COL': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                    'ROW': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                },
            },
        ],
    },
];
