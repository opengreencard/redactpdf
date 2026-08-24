// eslint-disable-next-line import/no-extraneous-dependencies
const airbnbConfig = require('eslint-config-airbnb-base/rules/style');

const noRestrictedSyntaxRules = airbnbConfig.rules['no-restricted-syntax'];

// List of Mantine component names from @mantine/core
// Source: https://mantine.dev/core/package/
const mantineComponentNames = [
  'AppShell',
  'AspectRatio',
  'Center',
  'Container',
  'Flex',
  'Grid',
  'Group',
  'SimpleGrid',
  'Space',
  'Stack',
  'AngleSlider',
  'Checkbox',
  'Chip',
  'ColorInput',
  'ColorPicker',
  'Fieldset',
  'FileInput',
  'Input',
  'JsonInput',
  'NativeSelect',
  'NumberInput',
  'PasswordInput',
  'PinInput',
  'Radio',
  'RangeSlider',
  'Rating',
  'SegmentedControl',
  'Slider',
  'Switch',
  'Textarea',
  'TextInput',
  'Autocomplete',
  'Combobox',
  'MultiSelect',
  'Pill',
  'PillsInput',
  'Select',
  'TagsInput',
  'ActionIcon',
  'Button',
  'CloseButton',
  'CopyButton',
  'FileButton',
  'UnstyledButton',
  'Anchor',
  'Breadcrumbs',
  'Burger',
  'NavLink',
  'Pagination',
  'Stepper',
  'TableOfContents',
  'Tabs',
  'Tree',
  'Alert',
  'Loader',
  'Notification',
  'Progress',
  'RingProgress',
  'SemiCircleProgress',
  'Skeleton',
  'Affix',
  'Dialog',
  'Drawer',
  'FloatingIndicator',
  'HoverCard',
  'LoadingOverlay',
  'Menu',
  'Modal',
  'Overlay',
  'Popover',
  'Tooltip',
  'Accordion',
  'Avatar',
  'BackgroundImage',
  'Badge',
  'Card',
  'ColorSwatch',
  'Image',
  'Indicator',
  'Kbd',
  'NumberFormatter',
  'Spoiler',
  'ThemeIcon',
  'Timeline',
  'Blockquote',
  'Code',
  'Highlight',
  'List',
  'Mark',
  'Table',
  'Text',
  'Title',
  'Typography',
  'Box',
  'Collapse',
  'Divider',
  'FocusTrap',
  'Paper',
  'Portal',
  'ScrollArea',
  'Transition',
  'VisuallyHidden',
];

const mantineComponentRegexGroup = mantineComponentNames.join('|');

const mantineJSXMemberSelector = `JSXOpeningElement[name.type="JSXMemberExpression"][name.object.type="JSXIdentifier"][name.object.name=/^(${mantineComponentRegexGroup})$/], JSXClosingElement[name.type="JSXMemberExpression"][name.object.type="JSXIdentifier"][name.object.name=/^(${mantineComponentRegexGroup})$/]`;

// Selector prefix for Mantine components with style prop
const mantineStyleSelectorPrefix = `JSXOpeningElement[name.name=/^(${mantineComponentRegexGroup})$/] JSXAttribute[name.name="style"] JSXExpressionContainer[expression.type="ObjectExpression"]`;

const untypedObjectMessage =
  'Avoid creating or returning object literals without types. These risk having extra or misspelled properties. Instead, explicitly type it, or suppress this error the object is simple and not used outside of the file';

// Allow generic event payload objects to avoid forcing noisy one-off types.
const untypedObjectExcludeEventPropertiesSelector =
  ':not(VariableDeclarator[id.name=/EventProperties/i]):not(VariableDeclarator[id.name=/EventProperties/i] *)';

const commonNoRestrictedSyntaxRules = [
  ...noRestrictedSyntaxRules
    .slice(1)
    .filter((item) => item.selector !== 'ForOfStatement'),
  {
    // Bad: <Box m={16} p={8} />
    // Good: <Box m="md" p="sm" />
    selector:
      'JSXAttribute[name.name=/^(m|p|my|mx|py|px|mt|mb|ml|mr|pt|pb|pl|pr|gap|radius)$/] Literal[value.type=number], JSXAttribute[name.name=/^(m|p|my|mx|py|px|mt|mb|ml|mr|pt|pb|pl|pr|gap|radius)$/] Literal[value=/^\\d+/]',
    message:
      "For Mantine spacing values, prefer using a predefined size like 'sm', 'md' that conform better to our standard 8-pixel grid. xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px.",
  },
  {
    // Bad: const error = err as Error
    // Good: const error: Error = err; // or keep type narrowed input as-is
    selector:
      'TSAsExpression[typeAnnotation.type="TSTypeReference"][typeAnnotation.typeName.type="Identifier"][typeAnnotation.typeName.name="Error"]',
    message:
      'Avoid casting with `as Error`; when using `catch (err)`, err is already typed as Error due to our Typescript settings.',
  },
  {
    // Bad: <Card.Section>...</Card.Section>
    // Good: import { CardSection } from '@mantine/core'; <CardSection>...</CardSection>
    // This pattern is not supported well in React Server Components. In Next,
    // it can produce:
    // > Could not find the module ".../node_modules/@mantine/core/esm/components/Card/Card.mjs#Card#Section" in the React Client Manifest.
    selector: mantineJSXMemberSelector,
    message:
      'Avoid JSX member component syntax (like Card.Section) for Mantine components. Import the subcomponent directly (e.g. CardSection) from @mantine/core instead.',
  },
  {
    // Bad: <Text fw={600} /> or <Text fw="semibold" /> or <Text fw={fontWeight} />
    // Good: <Text fw="bold" /> or <Text fw="normal" />
    selector:
      'JSXAttribute[name.name="fw"] Literal[value.type=number], JSXAttribute[name.name="fw"] Literal[value.type=string][value!="bold"][value!="normal"], JSXAttribute[name.name="fw"] JSXExpressionContainer',
    message:
      "The 'fw' prop only allows 'bold' or 'normal' as string values. Use fw=\"bold\" or fw=\"normal\" instead of numeric values or other strings.",
  },
  {
    // Bad: <Box style={{ margin: 16 }} />
    // Good: <Box m="md" />
    selector: `${mantineStyleSelectorPrefix} Property[key.name="margin"]`,
    message:
      "Avoid using style={{ margin }}. Use Mantine's 'm' prop instead (e.g., m=\"md\").",
  },
  {
    // Bad: <Box style={{ marginTop: 8 }} />
    // Good: <Box mt="sm" />
    selector: `${mantineStyleSelectorPrefix} Property[key.name="marginTop"]`,
    message:
      "Avoid using style={{ marginTop }}. Use Mantine's 'mt' prop instead (e.g., mt=\"sm\").",
  },
  {
    // Bad: <Box style={{ marginBottom: 8 }} />
    // Good: <Box mb="sm" />
    selector: `${mantineStyleSelectorPrefix} Property[key.name="marginBottom"]`,
    message:
      "Avoid using style={{ marginBottom }}. Use Mantine's 'mb' prop instead (e.g., mb=\"sm\").",
  },
  {
    // Bad: <Box style={{ marginLeft: 8 }} />
    // Good: <Box ml="sm" />
    selector: `${mantineStyleSelectorPrefix} Property[key.name="marginLeft"]`,
    message:
      "Avoid using style={{ marginLeft }}. Use Mantine's 'ml' prop instead (e.g., ml=\"sm\").",
  },
  {
    // Bad: <Box style={{ marginRight: 8 }} />
    // Good: <Box mr="sm" />
    selector: `${mantineStyleSelectorPrefix} Property[key.name="marginRight"]`,
    message:
      "Avoid using style={{ marginRight }}. Use Mantine's 'mr' prop instead (e.g., mr=\"sm\").",
  },
  {
    // Bad: <Box style={{ padding: 16 }} />
    // Good: <Box p="md" />
    selector: `${mantineStyleSelectorPrefix} Property[key.name="padding"]`,
    message:
      "Avoid using style={{ padding }}. Use Mantine's 'p' prop instead (e.g., p=\"md\").",
  },
  {
    // Bad: <Box style={{ paddingTop: 8 }} />
    // Good: <Box pt="sm" />
    selector: `${mantineStyleSelectorPrefix} Property[key.name="paddingTop"]`,
    message:
      "Avoid using style={{ paddingTop }}. Use Mantine's 'pt' prop instead (e.g., pt=\"sm\").",
  },
  {
    // Bad: <Box style={{ paddingBottom: 8 }} />
    // Good: <Box pb="sm" />
    selector: `${mantineStyleSelectorPrefix} Property[key.name="paddingBottom"]`,
    message:
      "Avoid using style={{ paddingBottom }}. Use Mantine's 'pb' prop instead (e.g., pb=\"sm\").",
  },
  {
    // Bad: <Box style={{ paddingLeft: 8 }} />
    // Good: <Box pl="sm" />
    selector: `${mantineStyleSelectorPrefix} Property[key.name="paddingLeft"]`,
    message:
      "Avoid using style={{ paddingLeft }}. Use Mantine's 'pl' prop instead (e.g., pl=\"sm\").",
  },
  {
    // Bad: <Box style={{ paddingRight: 8 }} />
    // Good: <Box pr="sm" />
    selector: `${mantineStyleSelectorPrefix} Property[key.name="paddingRight"]`,
    message:
      "Avoid using style={{ paddingRight }}. Use Mantine's 'pr' prop instead (e.g., pr=\"sm\").",
  },
  {
    // Bad: interface DateRangeInputProps { inputProps: ReturnType<typeof useMultipleInputsProps>['inputProps']; }
    // Bad: interface FooProps { selectedType: SomeType['value']; }
    // Good: interface DateRangeInputProps { inputProps: MultipleInputProps[]; }
    selector:
      'TSInterfaceDeclaration[id.name=/Props$/] > TSInterfaceBody > TSPropertySignature > TSTypeAnnotation > TSIndexedAccessType',
    message:
      "Avoid indexed access types like SomeType['foo'] inside props interfaces. Use explicit shared types instead.",
  },
  {
    // Bad: <Group style={{ gap: 16 }} />
    // Good: <Group gap="md" /> or <Stack gap="md" />
    selector: `${mantineStyleSelectorPrefix} Property[key.name="gap"]`,
    message:
      "Avoid using style={{ gap }}. Use Mantine's 'gap' prop on Group or Stack components instead (e.g., gap=\"md\").",
  },
  {
    // Bad: { ...ClientFakeData.makeFormField({ id: 'x' }), label: 'Name' }
    // Good: ClientFakeData.makeFormField({ id: 'x', label: 'Name' })
    selector:
      'SpreadElement[argument.type="CallExpression"][argument.callee.type="MemberExpression"][argument.callee.object.type="Identifier"][argument.callee.object.name="ClientFakeData"][argument.callee.property.type="Identifier"][argument.callee.property.name=/^make/]',
    message:
      'Avoid spreading ClientFakeData.make*() results. Pass all overrides directly into the make* call instead.',
  },
  {
    // Bad: { ...makeEmptyValuesForFormSetDefinition({ forms: [] }) }
    // Good: makeEmptyValuesForFormSetDefinition({ forms: [] })
    selector: 'ObjectExpression[properties.length=1] > SpreadElement',
    message:
      'Avoid spreading a single object into an object literal. Use the object directly instead of wrapping it in a spread.',
  },
  {
    // Bad: const metadata: Meta = { title: 'LandingPage/DashboardPageInner', ... }
    // Good: const metadata: Meta = { title: 'DashboardPageInner', ... }
    selector:
      'VariableDeclarator[id.name="metadata"][init.type="ObjectExpression"] > ObjectExpression > Property[key.name="title"][value.type="Literal"][value.value=/.*\\u002F.*/]',
    message:
      'Storybook story titles in `metadata` must not be nested. Use a flat title without `/`.',
  },
  {
    // Bad: const myVariable = { a: 1, b: 2 }
    // Good: const myVariable: MyType = { a: 1, b: 2 }
    selector: `VariableDeclarator[init.type=ObjectExpression]:not(VariableDeclarator[id.typeAnnotation])${untypedObjectExcludeEventPropertiesSelector}`,
    message: `${untypedObjectMessage}: \`const myVariable: MyType = { ... }\``,
  },
  {
    // Bad: someArray.map((item) => ({ number: item }))
    // Good: someArray.map((item): MyType => ({ number: item }))
    selector: [
      'ArrowFunctionExpression[body.type=ObjectExpression]:not(ArrowFunctionExpression[returnType])',
      // Ignore jest.mock(() => ({ ... })) module factory patterns.
      ':not(CallExpression[callee.object.name=jest][callee.property.name=mock] ArrowFunctionExpression)',
      // Ignore nested object methods typed through parent object annotation.
      ':not(Property > ArrowFunctionExpression)',
      untypedObjectExcludeEventPropertiesSelector,
    ].join(''),
    message: `${untypedObjectMessage}: \`someArray.map((item): MyType => ({ number: item }))\``,
  },
  {
    // Bad: someArray.map((item) => { return { number: item }; })
    // Good: someArray.map((item): MyType => { return { number: item }; })
    selector: [
      'ArrowFunctionExpression > BlockStatement > ReturnStatement[argument.type=ObjectExpression]:not(ArrowFunctionExpression[returnType] > BlockStatement > ReturnStatement[argument.type=ObjectExpression])',
      // Ignore jest.mock(() => { return { ... }; }) module factory patterns.
      ':not(CallExpression[callee.object.name=jest][callee.property.name=mock] ArrowFunctionExpression > BlockStatement > ReturnStatement[argument.type=ObjectExpression])',
      // Ignore nested object methods typed through parent object annotation.
      ':not(Property > ArrowFunctionExpression > BlockStatement > ReturnStatement[argument.type=ObjectExpression])',
      untypedObjectExcludeEventPropertiesSelector,
    ].join(''),
    message: `${untypedObjectMessage}: \`someArray.map((item): MyType => { return { number: item }; })\``,
  },
  {
    // Bad: function doSomething() { return { number: item }; }
    // Good: function doSomething(): MyType { return { number: item }; }
    selector: `FunctionDeclaration > BlockStatement > ReturnStatement[argument.type=ObjectExpression]:not(FunctionDeclaration[returnType] > BlockStatement > ReturnStatement[argument.type=ObjectExpression])${untypedObjectExcludeEventPropertiesSelector}`,
    message: `${untypedObjectMessage}: \`function doSomething(): MyType { return { number: item }; }\``,
  },
  {
    // Bad: const handleClick = () => {}
    // Bad: const onSubmit = useCallback(() => {})
    // Good: const onSubmit = useMemoizedCallback(() => {})
    // Good: const handleSubmit = useCallbackWithPrefix((payload) => save(payload), 'Form') // existing stable callback wrapper
    // Good: const handleSubmit = useSetState(setSubmitting, true) // stable state-setting wrapper
    // Good: const handleSearch = useDebounce((q) => doSearch(q), 250) // debounced callback wrapper
    // Bad: const onSubmit = someFactory() // not an allowed memoized callback wrapper
    selector:
      'VariableDeclarator[id.name=/^(handle|on)[A-Z]/][init.type="ArrowFunctionExpression"], VariableDeclarator[id.name=/^(handle|on)[A-Z]/][init.type="FunctionExpression"], VariableDeclarator[id.name=/^(handle|on)[A-Z]/][init.type="CallExpression"][init.callee.type="Identifier"]:not([init.callee.name=/^(useMemoizedCallback|useCallbackWithPrefix|useSetState|useDebounce)$/])',
    message:
      'Event handlers in React components should use useMemoizedCallback so they remain stable when passed as props and avoid triggering re-renders.',
  },
  {
    // Bad: screen.getByRole('button', { name: /save/i })
    // Bad: findByRole('textbox')
    // Bad: screen.getByText('Submit')
    // Bad: getAllByText(/submit/i)
    // Bad: findByLabelText('Email')
    // Good: getByTestId(saveButtonTestId)           // local test constant
    // Good: getByTestId(_formsPageSaveButtonTestId) // exported from component
    selector:
      'CallExpression[callee.type="MemberExpression"][callee.property.name=/^(getByRole|findByRole|getByLabelText|findByLabelText|getByText|getAllByText|findByText|findAllByText|queryByText|queryAllByText)$/]',
    message:
      'Prefer test-id queries (`getByTestId` / `findByTestId`) over role, text, or label queries in unit tests. For local test IDs: use a regular constant (`const saveButtonTestId = ...`). For IDs shared with a React component: export an underscore-prefixed constant (`export const _saveButtonTestId = ...`) from that component and import it.',
  },
  {
    // Bad: screen.getByTestId('save-button')
    // Bad: getByTestId("save-button")
    // Good: getByTestId(saveButtonTestId)           // local test constant
    // Good: getByTestId(_formsPageSaveButtonTestId) // exported from component
    selector:
      'CallExpression[callee.type="MemberExpression"][callee.property.name=/^(getByTestId|findByTestId)$/][arguments.0.type="Literal"]',
    message:
      'Do not pass string literals to `*ByTestId`. For local test IDs: define a constant in the test file (`const saveButtonTestId = ...`). For IDs shared with a React component: export an underscore-prefixed constant (`export const _saveButtonTestId = ...`) from that component and import it.',
  },
  {
    // Bad: setTimeout(() => onFocusField(), 0)
    // Bad: setTimeout(() => activeFieldRef.current?.focus(), 0)
    // Bad: setTimeout(() => formRef.current?.focusFirstField(), 0)
    // Bad: setTimeout(() => focusNextField(), 0)
    // Bad: setTimeout(function () { focusedOnNextFrame(); }, 0)
    // Good: useFocusOnNextRender(() => onFocusField())
    selector:
      'CallExpression[callee.name="setTimeout"] CallExpression:matches([callee.type="MemberExpression"][callee.property.name=/focus/i], [callee.type="Identifier"][callee.name=/focus/i])',
    message:
      'Use useFocusOnNextRender(() => onFocusField()) instead of setTimeout for focus scheduling so overlapping focus calls are coalesced.',
  },
  {
    // Bad: nameForPdf, parsedPdf, getJsonData, parseJsonResponse, formToc, targetDpi
    // Good: nameForPDF, parsedPDF, getJSONData, parseJSONResponse, formTOC, targetDPI
    //
    // At the start of a variable (e.g., pdfName, jsonData), lowercase is fine.
    // But when acronyms appear mid-identifier, they should be fully capitalized.
    // Exceptions:
    // - We don't apply this to "Id" since "Id" is commonly used in JavaScript.
    // - We allow FontAwesome icon variables like faFilePdf since they follow
    //   the FontAwesome naming convention.
    selector:
      'Identifier:not([name=/^fa[A-Z]/])[name=/[a-z](Pdf|Json|Jpeg|Png|Ast|Toc|Dpi|Html|Ses|Aws)(?=[A-Z]|\\b|$)/]',
    message:
      'Acronyms should be fully capitalized mid-identifier (e.g., nameForPDF not nameForPdf, getJSONData not getJsonData). Lowercase is only allowed at the start (e.g., pdfName, jsonData).',
  },
  {
    // Bad: z.any() or z.unknown()
    // Good: z.string(), z.number(), z.object({ ... }), or a more specific Zod schema
    selector:
      'CallExpression[callee.type="MemberExpression"][callee.object.name="z"][callee.property.name=/^(any|unknown)$/]',
    message:
      'Avoid using z.any() or z.unknown() as they bypass type safety. Use a more specific Zod schema type instead.',
  },
  {
    // Bad:
    // db.define(..., { hooks: { afterDestroy: ... } })
    // Good:
    // db.define(..., { hooks: { afterDestroy: ..., afterBulkDestroy: ... } })
    // Automatically suppressed when a `beforeBulkDestroy` guard exists in the
    // same hooks object (i.e. bulk ops are intentionally blocked or delegated
    // to explicit opt-ins like `withAllowBulkDestroy`).
    selector:
      'CallExpression[callee.property.name="define"] ObjectExpression:not(:has(Property[key.name="beforeBulkDestroy"])) > Property[key.name=/^(before|after)(create|destroy|restore|update|sync)$/i]',
    message:
      "If you're defining a SQL hook, make sure to define the equivalent bulk hook. If a beforeBulkDestroy guard is present the rule is suppressed automatically.",
  },
  {
    // Bad: onChange: () => void
    // Good: onChange: () => unknown
    selector: 'TSFunctionType > TSVoidKeyword',
    message:
      "Avoid `() => void` for callback types. Use `() => unknown` instead so callers don't have to worry about return values.",
  },
  {
    // Bad: function foo(schema: z.ZodTypeAny)
    // Good: function foo(schema: z.ZodType<unknown>)
    selector:
      'TSTypeReference[typeName.type="TSQualifiedName"][typeName.left.name="z"][typeName.right.name="ZodTypeAny"]',
    message:
      'Avoid using z.ZodTypeAny as it is less type-safe. Use z.ZodType<unknown> instead.',
  },
  {
    // Bad: const module = await import('./module')
    // Good: import { something } from './module' at the top of the file
    selector: 'AwaitExpression > ImportExpression',
    message:
      'Avoid await import(). Use a static import at the top of the file instead.',
  },
  {
    // Bad: listItemNoun: 'country of citizenship'
    // Good: listItemNoun: 'Citizenship'
    selector:
      'Property[key.name="listItemNoun"][value.type="Literal"][value=/^[a-z]/]',
    message:
      'listItemNoun must start with an uppercase letter or a digit so list labels read correctly (e.g. "Citizenship", not "country of citizenship").',
  },
  {
    // Bad: const handleGoToForm = useCallback((formId) => onActiveFormIdChange(formId), [onActiveFormIdChange]);
    // Good: Use onActiveFormIdChange directly: onClick={onActiveFormIdChange}
    //
    // This rule detects simple wrapper callbacks that just forward arguments.
    // Exclusions:
    // - Inline JSX handlers like onClick={() => onX(arg)} are fine
    // - Transforming handlers like (id) => onSelect(formatId(id)) are fine
    // - Multi-statement handlers are not detected
    selector: [
      // Variable declaration with useCallback/useMemoizedCallback
      'VariableDeclarator[init.type="CallExpression"][init.callee.name=/^(useCallback|useMemoizedCallback)$/]',
      // The first argument is an arrow function
      ' CallExpression[arguments.0.type="ArrowFunctionExpression"]',
      // Arrow function body is a single CallExpression
      ' > ArrowFunctionExpression[body.type="CallExpression"]',
      // The call has exactly one argument that matches the parameter name
      '[params.length=1][body.arguments.length=1]',
      // Both parameter and argument are identifiers with the same name
      '[params.0.type="Identifier"][body.arguments.0.type="Identifier"]',
    ].join(''),
    message:
      'Avoid useCallback/useMemoizedCallback wrappers that just forward a single argument unchanged. Use the callback directly (onClick={onActiveFormIdChange}) or, if transforming args, define the handler inline in JSX (onClick={() => onActiveFormIdChange(row.formId)}).',
  },
  {
    // Bad: arr.filter((x) => x.type === 'form').map((x) => [x.a, x as FormType])
    // Good: arr.map((x): NarrowedType | null => x.type === 'form' ? [x.a, x] : null).filter(isNotNullOrUndefined)
    selector:
      'CallExpression[callee.property.name="map"][callee.object.callee.property.name="filter"] TSAsExpression',
    message:
      'Use .map().filter(isNotNullOrUndefined) instead of .filter().map() with `as` casts. Return null from the .map() callback for unmatched items and annotate the return type explicitly.',
  },
  {
    // Bad: const x = { a: 1, ...defaults }
    // Good: const x = { ...defaults, a: 1 }
    selector: 'ObjectExpression > Property ~ SpreadElement',
    message:
      'Put object spread properties before explicit key/value properties (...spread must come first). If this is intentional, you can disable this rule with // Disable rule requiring spread operators to come first: <explanation of why this is intentional>/ eslint-disable-next-line no-restricted-syntax',
  },
  {
    // Bad: arr.reduce((sum, r) => sum + r.count, 0)
    // Good: _.sumBy(arr, (r) => r.count)
    // Good: _.maxBy(arr, (r) => r.count)
    // Good: arr.map(...).flat()
    selector:
      'CallExpression[callee.type="MemberExpression"][callee.property.name="reduce"]',
    message:
      'Prefer alternatives over .reduce(): use _.sum(arr) or _.sumBy(arr, fn) for summation, _.maxBy/_.minBy for extremum, or .map()/.flat()/.flatMap() for transformations. Disable this rule with // eslint-disable-next-line no-restricted-syntax if reduce is truly the clearest option.',
  },
  {
    // Bad: arr.sort((a, b) => a - b)
    // Good: _.sortBy(arr, fn) or _.orderBy(arr, [fn1, fn2])
    selector:
      'CallExpression[callee.type="MemberExpression"][callee.property.name="sort"]',
    message:
      'Prefer _.sortBy(arr, fn) or _.orderBy(arr, fns) over mutable .sort(). Lodash sorters return a new array instead of mutating.',
  },
  {
    // Bad: Promise.all(items.map(fn))
    // Good: promiseAllThrottled(items.map(item => async () => fn(item)), 4)
    selector:
      'CallExpression[callee.type="MemberExpression"][callee.object.name="Promise"][callee.property.name="all"][arguments.0.callee.property.name="map"]',
    message:
      'Prefer promiseAllThrottled over Promise.all(arr.map(...)) for I/O-bound parallel work. promiseAllThrottled limits concurrency, preventing resource exhaustion. Convert .map(fn) to .map(item => async () => fn(item)), then pass generators to promiseAllThrottled(generators, concurrency). For database updates, consider using bulkCreate with updateOnDuplicate instead of individual queries.',
  },
  {
    // Bad: PDFDocument.load(buffer) — no or incomplete options
    // Good: PDFDocument.load(buffer, { ignoreEncryption: true })
    selector:
      'CallExpression[callee.type="MemberExpression"][callee.object.type="Identifier"][callee.object.name="PDFDocument"][callee.property.type="Identifier"][callee.property.name="load"][arguments.length<2], CallExpression[callee.type="MemberExpression"][callee.object.type="Identifier"][callee.object.name="PDFDocument"][callee.property.type="Identifier"][callee.property.name="load"] > ObjectExpression:not(:has(Property[key.name="ignoreEncryption"][value.type="Literal"][value.value="true"]))',
    message:
      'Always pass { ignoreEncryption: true } as the second argument to PDFDocument.load() to handle encrypted PDFs.',
  },
  {
    // Forbid:
    // _.sortBy(blah, 'someKey')
    // _.sortBy(blah, ['someKey'])
    // _.orderBy(blah, ['someKey'])
    //
    // Note that a known limitation is that this won't error for
    // _.orderBy(blah, ['asc'], 'asc') since 'asc'/'desc' are excluded,
    // but that's necessary to avoid flagging
    // _.orderBy(blah, [item => item.someKey], 'asc')
    selector:
      'CallExpression[callee.object.name=_][callee.property.name=/^(?:differenceBy|intersectionBy|pullAllBy|sortedIndexBy|sortedLastIndexBy|sortedUniqBy|unionBy|uniqBy|xorBy|countBy|groupBy|keyBy|orderBy|sortBy|maxBy|meanBy|minBy|sumBy|invertBy|omitBy|pickBy)$/][arguments.1.type=Literal], CallExpression[callee.object.name=_][callee.property.name=/^(sortBy|orderBy)$/][arguments.1.type=ArrayExpression] > ArrayExpression > Literal[value!=asc][value!=desc]',
    message:
      'Instead of using _.sortBy(blah, "someKey") or _.orderBy(blah, ["someKey"]), pass in a function for better typechecking: e.g., _.sortBy(blah, (item) => item.someKey)',
  },
  {
    // Bad: type EmailSendMode = 'dryRun' | 'sendToDev' | 'send'
    // Good: enum EmailSendMode { dryRun = 'dryRun', sendToDev = 'sendToDev', send = 'send' }
    //
    // This selector intentionally only targets aliases whose entire union is
    // made of string-like literals. Discriminated unions and unions of named
    // types still provide useful composition and should remain type aliases.
    selector:
      'TSTypeAliasDeclaration[typeAnnotation.type="TSUnionType"]:not([id.name=/Key$/]):not(:has(TSUnionType > :not(TSLiteralType))):has(TSUnionType > TSLiteralType > Literal[value=/^[A-Za-z]/])',
    message:
      'Avoid unions of string literals in type aliases. Use a string enum so the allowed values have names and can be referenced consistently.',
  },
  {
    // Bad: export type { AnalyticsEvent } from './analyticsEvents'
    // Bad: export { trackEvent } from './analytics'
    // Bad: export * from './module'
    // Good: import these symbols from the module where they are declared.
    selector: 'ExportNamedDeclaration[source], ExportAllDeclaration[source]',
    message:
      'Avoid re-exporting symbols. Import them from their canonical module, where they are declared, to keep the dependency path direct.',
  },
];

const commonNoRestrictedSyntaxRulesForNonTests = [
  ...commonNoRestrictedSyntaxRules,
  {
    // Bad: <Item onClick={(e) => ...} /> inline arrow in render
    // Good: <Item onClick={useMemoizedCallback(() => ...)}>
    // Good: <Item onClick={useCallbackWithPrefix(handleClick, [index])>
    selector:
      'JSXAttribute[name.name=/^on/] JSXExpressionContainer ArrowFunctionExpression',
    message:
      'Inline arrow functions in JSX event handlers create new references each render. Use useMemoizedCallback for stable handlers, or useCallbackWithPrefix for item callbacks in lists. useSetState(setXXX, "blah") and useToggle(setChecked, checked) could also be helpful for minimal event handlers. In Storybook, likely use makeFakeHandler if it\'s a no-op (or the usual if we actually care about state)',
  },
];

const devDependencies = [
  '*eslintrc*',
  '**/*.test.*',
  '**/*.stories.*',
  '.storybook/**',
  'test-utils/**',
];

const useClientHookIgnorePaths = [
  '**/*.test.*',
  '**/*.stories.*',
  'test-utils/**',
  'dev/**',
  '.storybook/**',
  'scripts/**',
];

module.exports = {
  extends: [
    'mantine',
    'plugin:@next/next/recommended',
    'plugin:jest/recommended',
    'plugin:prettier/recommended',
    'airbnb',
    'airbnb/hooks',
    'airbnb-typescript',
    'prettier',
  ],
  plugins: [
    'testing-library',
    'jest',
    'redaction',
    '@naverpay/eslint-plugin-use-client',
  ],
  overrides: [
    {
      files: ['**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react'],
      rules: {
        'no-console': 'off',
        'no-restricted-syntax': [
          'error',
          ...commonNoRestrictedSyntaxRules,
          {
            selector:
              'MemberExpression[object.name="jest"][property.name="setTimeout"]',
            message:
              "jest.setTimeout sets a timeout for the entire file, not within a single test or describe. Use individual test-case timeouts instead. (i.e. it('my test', () => {}, timeoutMs))",
          },
        ],
      },
    },
    {
      files: ['app/**/*'],
      rules: {
        'no-restricted-syntax': [
          'error',
          ...commonNoRestrictedSyntaxRulesForNonTests,
          {
            selector:
              'TSAsExpression[expression.type="MemberExpression"][expression.object.type="Identifier"][expression.object.name="pathParams"]',
            message:
              'Avoid casting `pathParams.*` with `as ...` in routes. Parse and validate route params explicitly (for example, `isFormSetId`, `parseIntOrNull`) before passing them to API functions.',
          },
          {
            selector: 'CallExpression[callee.name="parseInt"]',
            message:
              'Avoid using parseInt directly. Use parseIntOrNull from lib/api/parseParameter.ts to handle invalid numbers gracefully and avoid unexpected NaN values.',
          },
        ],
      },
    },
    {
      files: ['**/valuesSchema.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          ...commonNoRestrictedSyntaxRulesForNonTests,
          {
            selector:
              'CallExpression[callee.object.name="z"][callee.property.name="union"]',
            message:
              'Avoid using z.union in valuesSchema.ts files. Use a single enum that includes all possible values instead. If the formSetDefinitions lack these enum values, add them as options.',
          },
          {
            selector:
              'CallExpression[callee.type="MemberExpression"][callee.property.name="omit"]',
            message:
              'Avoid using .omit() in valuesSchema.ts files. Usually omit is a workaround; the correct fix is introducing a new field type that does not include the field, either by removing it from the underlying values itself, or, if it is part of a larger input, by using a new input type that lacks the field.',
          },
          {
            // Forbid raw arrays in valuesSchema - all arrays must be wrapped in objects
            // BAD:  items: string[]
            // BAD:  items: ISO3166Alpha2CountryCode[]
            // GOOD: items: { country: ISO3166Alpha2CountryCode }[]
            selector:
              'TSTypeAliasDeclaration TSArrayType > :matches(TSStringKeyword, TSNumberKeyword, TSBooleanKeyword, TSTypeReference)',
            message:
              'Raw arrays are not allowed in valuesSchema. Wrap array elements in an object: { value: string }[] instead of string[]',
          },
        ],
      },
    },
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'import/extensions': 'off',
    'no-console': ['error', { allow: ['info'] }],
    // We use describe(function) so that the test name doesn't get out of sync
    // with the function's name, which this rule forbids.
    'jest/valid-title': 'off',
    // jest/valid-describe-callback forbids doing `describe(something, someFunc)`,
    // which we use occasionally to avoid test duplication
    'jest/valid-describe-callback': 'off',
    // Unlike Airbnb, we allow ForOfStatements
    'no-restricted-syntax': [
      'error',
      ...commonNoRestrictedSyntaxRulesForNonTests,
    ],
    // Functions and classes are hoisted, so can be used in any order. We also
    // use variables defined later in the file from functions, mostly for
    // const style = StyleSheet.create directives
    'no-use-before-define': 'off', // Rely on the Typescript version
    '@typescript-eslint/no-use-before-define': [
      'error',
      { functions: false, classes: true, variables: false },
    ],
    // Disable unary operator warning: ++ and -- are pretty safe
    'no-plusplus': 'off',
    // Allow continue statements in loops when they improve readability
    'no-continue': 'off',

    // Disable preferring default exports: named exports are easier to
    // import, and more exports may be added later
    'import/prefer-default-export': 'off',

    // Disable ban on props spreading: they help keep code cleaner, but we
    // do need to be careful of performance
    'react/jsx-props-no-spreading': 'off',

    // We're okay with function components defined using anonymous closures
    // rather than functions
    'react/function-component-definition': 'off',

    // We don't use React PropTypes since we're on Typescript
    'react/prop-types': 'off',

    // We have more dev dependencies
    'import/no-extraneous-dependencies': ['error', { devDependencies }],

    // We use named functions for React.memo(function SomeComponent() {}
    // so that stacktraces and React Inspector is a bit easier to read
    'prefer-arrow-callback': 'off',

    'no-restricted-imports': [
      'error',
      {
        name: 'next/image',
        importNames: ['Image'],
        message:
          "Instead of using next/image's Image, use our designSystem/Image.tsx component which combines both Mantine and Next.js image props",
      },
      {
        name: '@mantine/core',
        importNames: ['Image'],
        message:
          "Instead of using @mantine/core's Image, use our designSystem/Image.tsx component which combines both Mantine and Next.js image props",
      },
      {
        name: '@tabler/icons-react',
        message:
          "Instead of using @tabler/icons-react's IconX, use our designSystem/FontAwesomeIcon with Font Awesome icons",
      },
      {
        name: 'react-markdown',
        message:
          'Instead of using react-markdown directly, use our designSystem/Markdown component which applies Mantine defaults (e.g., Anchor links)',
      },
      {
        name: '@mantine/core',
        importNames: ['Button'],
        message:
          'Use the analytics-aware Button wrapper instead of importing Button directly from @mantine/core.',
      },
    ],

    // This prevents us from using `if (...) return X; else return Y;`, which
    // is often clearer than just defaulting to `return Y`
    'no-else-return': 'off',

    'react-hooks/exhaustive-deps': [
      'error',
      {
        // useMemoizedCallback works very similarly to useCallback, so we treat
        // it similarly here
        additionalHooks: 'useMemoizedCallback',
        // We use this option so that we don't have to worry about adding `t` to
        // dependency arrays in the wanderlog/localize-strings rule
        enableDangerousAutofixThisMayCauseInfiniteLoops: true,
      },
    ],

    // Disable reminder to add defaultProps for optional props: we generally
    // just allow them to default to undefined
    'react/require-default-props': 'off',

    'no-restricted-properties': [
      'error',
      {
        object: 'jest',
        property: 'resetAllMocks',
        message:
          'Note that this resets `jest.fn` in global mocks like our mock for request-promise-native. If you want to clear usage, consider just using `jest.clearAllMocks`. Otherwise, you can call `mockReset` on single functions.',
      },
    ],

    // Honestly, not a big deal if we use "'" in React children text
    'react/no-unescaped-entities': 'off',

    '@naverpay/use-client/use-client-hook': [
      'error',
      {
        ignorePath: useClientHookIgnorePaths,
      },
    ],
    '@naverpay/use-client/browser-api': [
      'error',
      {
        ignorePath: useClientHookIgnorePaths,
        // Server code may use fetch, timers, and console without a client boundary.
        ignoreApis: ['console', 'fetch', 'setTimeout', 'clearTimeout'],
      },
    ],
    '@naverpay/use-client/event-handler': [
      'error',
      {
        ignorePath: useClientHookIgnorePaths,
      },
    ],
    'redaction/restricted-imports-needs-client-directive': [
      'error',
      {
        paths: [
          {
            name: '@mantine/hooks',
            importNames: ['useMediaQuery'],
          },
        ],
      },
    ],
    'redaction/require-sequelize-type-assertion': 'error',
    'redaction/enum-member-name-matches-value': 'error',
    // We use _ to indicate methods exported for testing only
    'no-underscore-dangle': 'off',

    // Allow unused variables/args prefixed with _ (but not just _ which is often lodash)
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_.',
        argsIgnorePattern: '^_.',
      },
    ],

    // Allow leading _ to indicate exports for testing only, and disallow
    // UPPER_CASE constants
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
        leadingUnderscore: 'allow',
      },
    ],

    // Prefer bracket notation for array types (e.g., string[], ArrayItem[])
    // across TS code.
    '@typescript-eslint/array-type': [
      'error',
      {
        default: 'array',
        readonly: 'array',
      },
    ],
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  },
};
