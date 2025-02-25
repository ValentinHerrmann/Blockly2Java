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
                // Type determination too complicated
                //{
                //    'kind': 'block',
                //    'type': 'logic_ternary',
                //},
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
                /* Only useful if used with lists/arrays
                {
                    'kind': 'block',
                    'type': 'controls_forEach',
                },*/
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
                /* Con easily be replaced with native operations
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
                },*/
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
                /* WTF
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
                },*/
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
                /* In Java unnötig
                {
                    'kind': 'block',
                    'type': 'text_multiline',
                },*/
                {
                    'kind': 'block',
                    'type': 'text_join',
                },
                /* Type determination for item not working
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
                },*/
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
                /* Can easily be replaced with String.length==0 (reduce number of blocks)
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
                },*/
                /* Type determination for item not working
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
                },*/
                /* Too complicated if char not already known (if not, this is basically a substring)
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
                },*/
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
                

                /* Type determination too complicated and uses gui --> replace with scanner when reusing
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
                },*/
            ],
        },
        {
            'kind': 'sep',
        },
        {
            'kind': 'category',
            'name': 'Variablen/Attribute',
            'categorystyle': 'variable_category',
            'custom': 'VARIABLE',
        },
        {
            'kind': 'category',
            'name': 'Methoden',
            'categorystyle': 'procedure_category',
            'custom': 'PROCEDURE',
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
                }
            ]
        }
    ],
};