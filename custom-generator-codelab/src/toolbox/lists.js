export const listenCategory = {
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
};
