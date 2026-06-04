export const arraysCategory = {
    'kind': 'category',
    'name': 'Arrays',
    'categorystyle': 'list_category',
    'contents': [
        { 'kind': 'block', 'type': 'lists_create_with' },
        {
            'kind': 'block',
            'type': 'lists_repeat',
            'inputs': { 'NUM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 5 } } } },
        },
        {
            'kind': 'block',
            'type': 'lists_length',
            'inputs': {
                'VALUE': {
                    'shadow': {
                        'type': 'java_local_var_get',
                        'fields': { 'VAR': { 'name': 'array', 'type': 'local' } }
                    }
                }
            }
        },
        {
            'kind': 'block',
            'type': 'lists_isEmpty',
            'inputs': {
                'VALUE': {
                    'shadow': {
                        'type': 'java_local_var_get',
                        'fields': { 'VAR': { 'name': 'array', 'type': 'local' } }
                    }
                }
            }
        },
        {
            'kind': 'block',
            'type': 'lists_getIndex',
            'inputs': {
                'VALUE': {
                    'shadow': {
                        'type': 'java_local_var_get',
                        'fields': { 'VAR': { 'name': 'array', 'type': 'local' } }
                    }
                }
            },
        },
        {
            'kind': 'block',
            'type': 'lists_setIndex',
            'inputs': {
                'LIST': {
                    'shadow': {
                        'type': 'java_local_var_get',
                        'fields': { 'VAR': { 'name': 'array', 'type': 'local' } }
                    }
                }
            },
        },
    ],
};
