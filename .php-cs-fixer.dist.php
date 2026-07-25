<?php

$finder = PhpCsFixer\Finder::create()
    ->in([
        __DIR__ . '/src',
        __DIR__ . '/public/api',
    ])
    ->name('*.php')
    ->ignoreDotFiles(true)
    ->ignoreVCS(true);

return (new PhpCsFixer\Config())
    ->setRules([
        '@PER-CS' => true,
        '@PER-CS1.0' => true,
        '@PSR12' => true,
        '@PSR12:risky' => true,
        '@PhpCsFixer:risky' => true,
        'array_syntax' => ['syntax' => 'short'],
        'binary_operator_spaces' => [
            'default' => 'single_space',
        ],
        'concat_space' => ['spacing' => 'one'],
        'fully_qualified_strict_types' => true,
        'function_declaration' => ['closure_function_spacing' => 'one'],
        'include' => true,
        'increment_style' => ['style' => 'post'],
        'no_alias_functions' => ['strict' => true],
        'no_alias_language_construct_call' => true,
        'no_blank_lines_after_class_opening' => true,
        'no_blank_lines_after_phpdoc' => true,
        'no_empty_comment' => true,
        'no_extra_blank_lines' => [
            'tokens' => [
                'extra',
                'throw',
                'use',
                'use_trait',
            ],
        ],
        'no_short_bool_cast' => true,
        'no_superfluous_elseif' => true,
        'no_superfluous_phpdoc_tags' => ['allow_mixed' => true],
        'no_trailing_comma_in_singleline' => true,
        'no_useless_else' => true,
        'no_useless_return' => true,
        'ordered_class_elements' => [
            'order' => [
                'use_trait',
            ],
        ],
        'ordered_imports' => [
            'imports_order' => ['class', 'function', 'const'],
            'sort_algorithm' => 'alpha',
        ],
        'phpdoc_align' => ['align' => 'left'],
        'phpdoc_order' => true,
        'phpdoc_separation' => true,
        'phpdoc_summary' => true,
        'phpdoc_trim' => true,
        'phpdoc_types_order' => ['null_adjustment' => 'always_last', 'sort_algorithm' => 'none'],
        'phpdoc_var_annotation_correct_order' => true,
        'single_line_empty_body' => true,
        'single_quote' => true,
        'trailing_comma_in_multiline' => ['elements' => ['arrays']],
        'trim_array_spaces' => true,
        'WhitespaceAfterCommaInArray' => true,
    ])
    ->setFinder($finder)
    ->setRiskyAllowed(true)
    ->setLineEnding("\n");
