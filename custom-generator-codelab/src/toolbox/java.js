export const javaCategories = [
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
    { 'kind': 'sep' },
    {
        'kind': 'category',
        'name': 'Methoden',
        'colour': '#995599',
        'custom': 'JAVA_METHOD_NORMAL',
    },
    {
        'kind': 'category',
        'name': 'Klassen-Methoden',
        'colour': '#bf4040',
        'custom': 'JAVA_METHOD_STATIC',
    },
    {
        kind: 'category',
        name: 'Klassen',
        colour: 260,
        contents: [
            { kind: 'block', type: 'defconstructor' },
            { kind: 'block', type: 'callconstructor' },
            { kind: 'block', type: 'java_extends' },
            { kind: 'block', type: 'java_super_call' },
        ],
    },
];
