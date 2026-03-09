export const toolbox = {
    'kind': 'categoryToolbox',
    'contents': [
        {
            'kind': 'category',
            'name': 'Logik',
            'categorystyle': 'logic_category',
            'contents': [
                {
                    'kind': 'block',
                    'type': 'controls_if',
                },
                {
                    'kind': 'block',
                    'type': 'logic_compare',
                },
                {
                    'kind': 'block',
                    'type': 'logic_operation',
                },
                {
                    'kind': 'block',
                    'type': 'logic_negate',
                },
                {
                    'kind': 'block',
                    'type': 'logic_boolean',
                },
                {
                    'kind': 'block',
                    'type': 'logic_null',
                },
                {
                    'kind': 'block',
                    'type': 'logic_ternary',
                },
            ],
        },
        {
            'kind': 'category',
            'name': 'Schleifen',
            'categorystyle': 'loop_category',
            'contents': [
                {
                    'kind': 'block',
                    'type': 'controls_repeat_ext',
                    'inputs': {
                        'TIMES': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 10,
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'controls_whileUntil',
                },
                {
                    'kind': 'block',
                    'type': 'controls_for',
                    'inputs': {
                        'FROM': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 0,
                                },
                            },
                        },
                        'TO': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 10,
                                },
                            },
                        },
                        'BY': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 1,
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'controls_forEach',
                },
                {
                    'kind': 'block',
                    'type': 'controls_flow_statements',
                },
            ],
        },
        {
            'kind': 'category',
            'name': 'Mathe',
            'categorystyle': 'math_category',
            'contents': [
                {
                    'kind': 'block',
                    'type': 'math_number',
                    'fields': {
                        'NUM': 123,
                    },
                },
                {
                    'kind': 'block',
                    'type': 'math_arithmetic',
                    'inputs': {
                        'A': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 1,
                                },
                            },
                        },
                        'B': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 1,
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'math_single',
                    'inputs': {
                        'NUM': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 9,
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'math_trig',
                    'inputs': {
                        'NUM': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 45,
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'math_constant',
                },
                {
                    'kind': 'block',
                    'type': 'math_number_property',
                    'inputs': {
                        'NUMBER_TO_CHECK': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 0,
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'math_round',
                    'fields': {
                        'OP': 'ROUND',
                    },
                    'inputs': {
                        'NUM': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 3.1,
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'math_on_list',
                    'fields': {
                        'OP': 'SUM',
                    },
                },
                {
                    'kind': 'block',
                    'type': 'math_modulo',
                    'inputs': {
                        'DIVIDEND': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 64,
                                },
                            },
                        },
                        'DIVISOR': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 10,
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'math_constrain',
                    'inputs': {
                        'VALUE': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 50,
                                },
                            },
                        },
                        'LOW': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 1,
                                },
                            },
                        },
                        'HIGH': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 100,
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'math_random_int',
                    'inputs': {
                        'FROM': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 1,
                                },
                            },
                        },
                        'TO': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 100,
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'math_random_float',
                },
                {
                    'kind': 'block',
                    'type': 'math_atan2',
                    'inputs': {
                        'X': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 1,
                                },
                            },
                        },
                        'Y': {
                            'shadow': {
                                'type': 'math_number',
                                'fields': {
                                    'NUM': 1,
                                },
                            },
                        },
                    },
                },
            ],
        },
        {
            'kind': 'category',
            'name': 'Text',
            'categorystyle': 'text_category',
            'contents': [
                {
                    'kind': 'block',
                    'type': 'text',
                },
                {
                    'kind': 'block',
                    'type': 'text_multiline',
                },
                {
                    'kind': 'block',
                    'type': 'text_join',
                },
                {
                    'kind': 'block',
                    'type': 'text_append',
                    'inputs': {
                        'TEXT': {
                            'shadow': {
                                'type': 'text',
                                'fields': {
                                    'TEXT': '',
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'text_length',
                    'inputs': {
                        'VALUE': {
                            'shadow': {
                                'type': 'text',
                                'fields': {
                                    'TEXT': 'abc',
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'text_isEmpty',
                    'inputs': {
                        'VALUE': {
                            'shadow': {
                                'type': 'text',
                                'fields': {
                                    'TEXT': '',
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'text_indexOf',
                    'inputs': {
                        'VALUE': {
                            'block': {
                                'type': 'variables_get',
                            },
                        },
                        'FIND': {
                            'shadow': {
                                'type': 'text',
                                'fields': {
                                    'TEXT': 'abc',
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'text_charAt',
                    'inputs': {
                        'VALUE': {
                            'block': {
                                'type': 'variables_get',
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'text_getSubstring',
                    'inputs': {
                        'STRING': {
                            'block': {
                                'type': 'variables_get',
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'text_changeCase',
                    'inputs': {
                        'TEXT': {
                            'shadow': {
                                'type': 'text',
                                'fields': {
                                    'TEXT': 'abc',
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'text_trim',
                    'inputs': {
                        'TEXT': {
                            'shadow': {
                                'type': 'text',
                                'fields': {
                                    'TEXT': 'abc',
                                },
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'text_count',
                    'inputs': {
                        'SUB': {
                            'shadow': {
                                'type': 'text',
                            },
                        },
                        'TEXT': {
                            'shadow': {
                                'type': 'text',
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'text_replace',
                    'inputs': {
                        'FROM': {
                            'shadow': {
                                'type': 'text',
                            },
                        },
                        'TO': {
                            'shadow': {
                                'type': 'text',
                            },
                        },
                        'TEXT': {
                            'shadow': {
                                'type': 'text',
                            },
                        },
                    },
                },
                {
                    'kind': 'block',
                    'type': 'text_reverse',
                    'inputs': {
                        'TEXT': {
                            'shadow': {
                                'type': 'text',
                            },
                        },
                    },
                },
                {
                    "kind": "BLOCK",
                    "type": "text_print",
                    "inputs": {
                        "TEXT": {
                            "shadow": {
                                "type": "text",
                                "fields": { "TEXT": "abc" }
                            }
                        }
                    }
                },
                {
                    "kind": "BLOCK",
                    "type": "text_prompt_ext",
                    "inputs": {
                        "TEXT": {
                            "shadow": {
                                "type": "text",
                                "fields": {"TEXT": "abc"}
                            }
                        }
                    }
                },
            ],
        },
        {
            'kind': 'category',
            'name': 'Listen',
            'categorystyle': 'list_category',
            'contents': [
                { 'kind': 'block', 'type': 'lists_create_with' },
                {
                    'kind': 'block',
                    'type': 'lists_repeat',
                    'inputs': { 'NUM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 5 } } } },
                },
                { 'kind': 'block', 'type': 'lists_length' },
                { 'kind': 'block', 'type': 'lists_isEmpty' },
                {
                    'kind': 'block',
                    'type': 'lists_indexOf',
                    'inputs': { 'VALUE': { 'block': { 'type': 'variables_get' } } },
                },
                {
                    'kind': 'block',
                    'type': 'lists_getIndex',
                    'inputs': { 'VALUE': { 'block': { 'type': 'variables_get' } } },
                },
                {
                    'kind': 'block',
                    'type': 'lists_setIndex',
                    'inputs': { 'LIST': { 'block': { 'type': 'variables_get' } } },
                },
                {
                    'kind': 'block',
                    'type': 'lists_getSublist',
                    'inputs': { 'LIST': { 'block': { 'type': 'variables_get' } } },
                },
                {
                    'kind': 'block',
                    'type': 'lists_split',
                    'inputs': { 'DELIM': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': ',' } } } },
                },
                { 'kind': 'block', 'type': 'lists_sort' },
                { 'kind': 'block', 'type': 'lists_reverse' },
            ],
        },
        {
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
            ],
        },
        {
            'kind': 'sep',
        },
        {
            'kind': 'category',
            'name': 'Variablen',
            'colour': '#55AA55',
            'custom': 'JAVA_VARIABLES_ALL',
        },
        {
            'kind': 'category',
            'name': 'Attribute',
            'categorystyle': 'variable_category',
            'custom': 'JAVA_ATTR',
        },
        {
            'kind': 'category',
            'name': 'Parameter',
            'colour': '#CC8800',
            'custom': 'JAVA_PARAM',
        },
        {
            'kind': 'sep',
        },
        {
            'kind': 'category',
            'name': 'Methoden',
            'colour': '#995599',
            'custom': 'JAVA_METHOD_NORMAL',
        },
        {
            'kind': 'category',
            'name': 'K-Methoden',
            'colour': '#bf4040',
            'custom': 'JAVA_METHOD_STATIC',
        },
        {
            kind: "category",
            name: "Klassen",
            colour: 260,
                contents: [
                {
                    kind: "block",
                    type: "defconstructor"
                },
                {
                    kind: "block",
                    type: "callconstructor"
                },
                {
                    kind: "block",
                    type: "java_extends"
                },
                {
                    kind: "block",
                    type: "java_super_call"
                }
            ]
        },
        // ── Grafik ────────────────────────────────────────────────────────────
        {
            'kind': 'sep',
        },
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
                    'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } },
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
                // Farb-Konstante
                { 'kind': 'block', 'type': 'gfx_color_const' },
                // Füllfarbe
                { 'kind': 'block', 'type': 'gfx_set_fill_color' },
                {
                    'kind': 'block', 'type': 'gfx_set_fill_color_alpha',
                    'inputs': {
                        'ALPHA': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0.5 } } },
                    },
                },
                // Rand
                { 'kind': 'block', 'type': 'gfx_set_border_color' },
                {
                    'kind': 'block', 'type': 'gfx_set_border_width',
                    'inputs': {
                        'WIDTH': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 2 } } },
                    },
                },
                // Transparenz
                {
                    'kind': 'block', 'type': 'gfx_set_alpha',
                    'inputs': {
                        'ALPHA': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1.0 } } },
                    },
                },
                // Sichtbarkeit / Reihenfolge
                { 'kind': 'block', 'type': 'gfx_set_visible' },
                { 'kind': 'block', 'type': 'gfx_bring_to_front' },
                { 'kind': 'block', 'type': 'gfx_send_to_back' },
                // Text-spezifisch
                {
                    'kind': 'block', 'type': 'gfx_set_text_content',
                    'inputs': {
                        'TEXT': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': 'Hallo!' } } },
                    },
                },
                { 'kind': 'block', 'type': 'gfx_set_alignment' },
                // Globale Standards
                { 'kind': 'block', 'type': 'gfx_default_fill_color' },
                { 'kind': 'block', 'type': 'gfx_default_visibility' },
                // Farb-Blöcke aus der Farben-Kategorie hier nochmal zur Erinnerung
                { 'kind': 'block', 'type': 'colour_picker' },
                {
                    'kind': 'block', 'type': 'colour_rgb',
                    'inputs': {
                        'RED':   { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } },
                        'GREEN': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 50  } } },
                        'BLUE':  { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0   } } },
                    },
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
                    'fields': { 'VAR': { 'name': 'grafik', 'type': 'local' } },
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
                        'LENGTH': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 50 } } },
                    },
                },
                {
                    'kind': 'block', 'type': 'gfx_turtle_turn',
                    'inputs': {
                        'ANGLE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 90 } } },
                    },
                },
                {
                    'kind': 'block', 'type': 'gfx_define_direction',
                    'inputs': {
                        'ANGLE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                    },
                },
                // Stift
                { 'kind': 'block', 'type': 'gfx_turtle_pen_up' },
                { 'kind': 'block', 'type': 'gfx_turtle_pen_down' },
                // Zentrum (zusammengesetzte Objekte)
                {
                    'kind': 'block', 'type': 'gfx_define_center',
                    'inputs': {
                        'X': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                        'Y': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
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
                        'COL':   { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                        'ROW':   { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                    },
                },
                {
                    'kind': 'block', 'type': 'gfx_bitmap_get_pixel',
                    'inputs': {
                        'COL':   { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                        'ROW':   { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                    },
                },
            ],
        },
    ],
};
