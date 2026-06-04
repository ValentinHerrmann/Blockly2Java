export const listenCategory = {
    'kind': 'category',
    'name': 'Listen',
    'categorystyle': 'list_category',
    'contents': [
        { 'kind': 'block', 'type': 'list_create_with' },
        {
            'kind': 'block',
            'type': 'list_repeat',
            'inputs': { 'NUM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 5 } } } },
        },
        { 'kind': 'block', 'type': 'list_length' },
        { 'kind': 'block', 'type': 'list_isEmpty' },
        {
            'kind': 'block',
            'type': 'list_indexOf',
            'inputs': { 'VALUE': { 'block': { 'type': 'variables_get' } } },
        },
        {
            'kind': 'block',
            'type': 'list_getIndex',
            'inputs': { 'VALUE': { 'block': { 'type': 'variables_get' } } },
        },
        {
            'kind': 'block',
            'type': 'list_setIndex',
            'inputs': { 'LIST': { 'block': { 'type': 'variables_get' } } },
        },
        {
            'kind': 'block',
            'type': 'list_getSublist',
            'inputs': { 'LIST': { 'block': { 'type': 'variables_get' } } },
        },
        {
            'kind': 'block',
            'type': 'list_split',
            'inputs': { 'DELIM': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': ',' } } } },
        },
        { 'kind': 'block', 'type': 'list_sort' },
        { 'kind': 'block', 'type': 'list_reverse' },
    ],
};
