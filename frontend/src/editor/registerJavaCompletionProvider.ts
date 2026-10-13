import type { Monaco } from "@monaco-editor/react";
import type { IDisposable, IRange, Position, editor, languages } from "monaco-editor";
import {
  CATALOG_INSTANCE_MEMBERS_BY_TYPE_NAME,
  CATALOG_STATIC_MEMBERS_BY_TYPE_NAME,
  IMPORT_PATH_BY_TYPE_NAME,
  JAVA_KEYWORDS,
  JAVA_LANG_TYPE_NAMES,
  JAVA_SNIPPETS,
  OBJECT_MEMBERS,
  TYPE_NAME_ALIASES,
} from "./javaCompletionCatalog";
import {
  STRING_LITERAL_SEGMENT_NAME,
  collectDeclaredVariableNames,
  extractDeclaredTypes,
  extractReceiverChainBeforeDot,
  findInnermostEnclosingType,
  inferVariableTypeName,
  maskCommentsAndLiterals,
  stripGenericArguments,
  type DeclaredType,
  type ReceiverChainSegment,
} from "./javaSourceAnalysis";

interface CompletableMember {
  name: string;
  memberKind: "field" | "method" | "enumConstant";
  parameterDeclarations: string[];
  typeName: string;
}

interface ResolvedReceiver {
  typeName: string;
  isStaticAccess: boolean;
}

interface CompletionAnalysisContext {
  sourceText: string;
  maskedText: string;
  declaredTypesByName: Map<string, DeclaredType>;
  enclosingType: DeclaredType | null;
  cursorOffset: number;
}

const COMPLETION_PROVIDER_REGISTRY_KEY: unique symbol = Symbol.for("codecademy-java.javaCompletionProvider");

const SORT_PRIORITY = { variable: "1", member: "2", type: "3", snippet: "4", keyword: "5" } as const;

const ENUM_INSTANCE_MEMBERS: CompletableMember[] = [
  { name: "name", memberKind: "method", parameterDeclarations: [], typeName: "String" },
  { name: "ordinal", memberKind: "method", parameterDeclarations: [], typeName: "int" },
];

function normalizeTypeName(rawTypeName: string): string {
  const typeNameWithoutGenerics = stripGenericArguments(rawTypeName);
  if (TYPE_NAME_ALIASES[typeNameWithoutGenerics]) return TYPE_NAME_ALIASES[typeNameWithoutGenerics];
  if (typeNameWithoutGenerics.endsWith("[]")) return typeNameWithoutGenerics;
  const simpleTypeName = typeNameWithoutGenerics.split(".").pop() ?? typeNameWithoutGenerics;
  return TYPE_NAME_ALIASES[simpleTypeName] ?? simpleTypeName;
}

function catalogMembersToCompletable(typeName: string, catalog: typeof CATALOG_INSTANCE_MEMBERS_BY_TYPE_NAME): CompletableMember[] {
  return (catalog.get(typeName) ?? []).map((catalogMember) => ({
    name: catalogMember.name,
    memberKind: catalogMember.parameterDeclarations === null ? "field" : "method",
    parameterDeclarations: catalogMember.parameterDeclarations ?? [],
    typeName: catalogMember.returnTypeName,
  }));
}

function collectInstanceMembers(typeName: string, context: CompletionAnalysisContext, visitedTypeNames = new Set<string>()): CompletableMember[] {
  const normalizedTypeName = normalizeTypeName(typeName);
  if (visitedTypeNames.has(normalizedTypeName)) return [];
  visitedTypeNames.add(normalizedTypeName);

  if (normalizedTypeName.endsWith("[]")) {
    return [{ name: "length", memberKind: "field", parameterDeclarations: [], typeName: "int" }];
  }

  const declaredType = context.declaredTypesByName.get(normalizedTypeName);
  if (!declaredType) return catalogMembersToCompletable(normalizedTypeName, CATALOG_INSTANCE_MEMBERS_BY_TYPE_NAME);

  const ownInstanceMembers: CompletableMember[] = declaredType.members.filter((member) => !member.isStatic);
  const inheritedMembers = declaredType.superTypeNames
    .flatMap((superTypeName) => collectInstanceMembers(superTypeName, context, visitedTypeNames));
  const enumMembers = declaredType.typeKind === "enum" ? ENUM_INSTANCE_MEMBERS : [];
  return [...ownInstanceMembers, ...enumMembers, ...inheritedMembers];
}

function collectStaticMembers(typeName: string, context: CompletionAnalysisContext): CompletableMember[] {
  const declaredType = context.declaredTypesByName.get(typeName);
  if (!declaredType) return catalogMembersToCompletable(typeName, CATALOG_STATIC_MEMBERS_BY_TYPE_NAME);

  const enumHelperMembers: CompletableMember[] = declaredType.typeKind === "enum"
    ? [
      { name: "values", memberKind: "method", parameterDeclarations: [], typeName: `${typeName}[]` },
      { name: "valueOf", memberKind: "method", parameterDeclarations: ["String name"], typeName },
    ]
    : [];
  return [
    ...declaredType.members
      .filter((member) => member.isStatic)
      .map((member) => (member.memberKind === "enumConstant" ? { ...member, typeName } : member)),
    ...enumHelperMembers,
  ];
}

function collectMembersOfReceiver(resolvedReceiver: ResolvedReceiver, context: CompletionAnalysisContext): CompletableMember[] {
  if (resolvedReceiver.isStaticAccess) return collectStaticMembers(resolvedReceiver.typeName, context);
  const instanceMembers = collectInstanceMembers(resolvedReceiver.typeName, context);
  if (normalizeTypeName(resolvedReceiver.typeName).endsWith("[]")) return instanceMembers;
  const isKnownReferenceType = instanceMembers.length > 0 || context.declaredTypesByName.has(normalizeTypeName(resolvedReceiver.typeName));
  return isKnownReferenceType ? [...instanceMembers, ...OBJECT_MEMBERS.map((objectMember) => ({
    name: objectMember.name,
    memberKind: "method" as const,
    parameterDeclarations: objectMember.parameterDeclarations ?? [],
    typeName: objectMember.returnTypeName,
  }))] : [];
}

function isKnownStaticallyAccessibleTypeName(typeName: string, context: CompletionAnalysisContext): boolean {
  return context.declaredTypesByName.has(typeName) || CATALOG_STATIC_MEMBERS_BY_TYPE_NAME.has(typeName);
}

function resolveFirstChainSegment(firstSegment: ReceiverChainSegment, context: CompletionAnalysisContext): ResolvedReceiver | null {
  if (firstSegment.name === STRING_LITERAL_SEGMENT_NAME) return { typeName: "String", isStaticAccess: false };
  if (firstSegment.isConstructorCall) return { typeName: firstSegment.name, isStaticAccess: false };
  if (firstSegment.name === "this") {
    return context.enclosingType ? { typeName: context.enclosingType.name, isStaticAccess: false } : null;
  }
  if (firstSegment.name === "super") {
    const superTypeName = context.enclosingType?.superTypeNames[0];
    return superTypeName ? { typeName: superTypeName, isStaticAccess: false } : null;
  }
  if (firstSegment.isMethodCall) {
    if (!context.enclosingType) return null;
    const enclosingTypeMembers = [
      ...context.enclosingType.members,
      ...collectInstanceMembers(context.enclosingType.name, context),
    ];
    const calledMethod = enclosingTypeMembers.find((member) => member.memberKind === "method" && member.name === firstSegment.name);
    return calledMethod ? { typeName: calledMethod.typeName, isStaticAccess: false } : null;
  }

  const variableTypeName = inferVariableTypeName(context.sourceText, context.maskedText, firstSegment.name, context.cursorOffset);
  if (variableTypeName) return { typeName: variableTypeName, isStaticAccess: false };
  if (isKnownStaticallyAccessibleTypeName(firstSegment.name, context)) return { typeName: firstSegment.name, isStaticAccess: true };
  return null;
}

function resolveReceiverChain(receiverChain: ReceiverChainSegment[], context: CompletionAnalysisContext): ResolvedReceiver | null {
  let resolvedReceiver = resolveFirstChainSegment(receiverChain[0], context);
  for (const chainSegment of receiverChain.slice(1)) {
    if (!resolvedReceiver) return null;
    const expectedMemberKind = chainSegment.isMethodCall ? "method" : "field";
    const matchingMember = collectMembersOfReceiver(resolvedReceiver, context)
      .find((member) => member.name === chainSegment.name
        && (member.memberKind === expectedMemberKind || (!chainSegment.isMethodCall && member.memberKind === "enumConstant")));
    resolvedReceiver = matchingMember ? { typeName: matchingMember.typeName, isStaticAccess: false } : null;
  }
  return resolvedReceiver;
}

function buildMethodInsertSnippet(methodName: string, parameterDeclarations: string[]): string {
  if (parameterDeclarations.length === 0) return `${methodName}()`;
  const parameterPlaceholders = parameterDeclarations.map((parameterDeclaration, parameterIndex) => {
    const parameterName = parameterDeclaration.trim().split(/\s+/).pop() ?? `arg${parameterIndex}`;
    return `\${${parameterIndex + 1}:${parameterName}}`;
  });
  return `${methodName}(${parameterPlaceholders.join(", ")})`;
}

function buildMemberCompletionItems(monaco: Monaco, members: CompletableMember[], replaceRange: IRange, sortPriority: string): languages.CompletionItem[] {
  const seenMemberSignatures = new Set<string>();
  return members.flatMap((member) => {
    const memberSignature = `${member.memberKind}:${member.name}(${member.parameterDeclarations.join(",")})`;
    if (seenMemberSignatures.has(memberSignature)) return [];
    seenMemberSignatures.add(memberSignature);

    const isMethod = member.memberKind === "method";
    const completionKind = isMethod
      ? monaco.languages.CompletionItemKind.Method
      : member.memberKind === "enumConstant"
        ? monaco.languages.CompletionItemKind.EnumMember
        : monaco.languages.CompletionItemKind.Field;
    return [{
      label: {
        label: member.name,
        detail: isMethod ? `(${member.parameterDeclarations.join(", ")})` : undefined,
        description: member.typeName || undefined,
      },
      kind: completionKind,
      insertText: isMethod ? buildMethodInsertSnippet(member.name, member.parameterDeclarations) : member.name,
      insertTextRules: isMethod ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
      sortText: `${sortPriority}${member.name}`,
      range: replaceRange,
    }];
  });
}

function buildImportTextEdit(model: editor.ITextModel, typeName: string, context: CompletionAnalysisContext): languages.TextEdit[] {
  const importPath = IMPORT_PATH_BY_TYPE_NAME[typeName];
  if (!importPath || context.declaredTypesByName.has(typeName)) return [];

  const packageName = importPath.slice(0, importPath.lastIndexOf("."));
  const escapeForRegex = (text: string) => text.replace(/\./g, "\\.");
  const alreadyImportedPattern = new RegExp(`^\\s*import\\s+(${escapeForRegex(importPath)}|${escapeForRegex(packageName)}\\.\\*)\\s*;`, "m");
  if (alreadyImportedPattern.test(context.sourceText)) return [];

  const lastImportLineNumber = context.sourceText.split("\n")
    .reduce((lastLineNumber, lineText, lineIndex) => (/^\s*import\s/.test(lineText) ? lineIndex + 1 : lastLineNumber), 0);
  if (lastImportLineNumber === 0) {
    return [{ range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }, text: `import ${importPath};\n\n` }];
  }
  const endOfLastImportColumn = model.getLineMaxColumn(lastImportLineNumber);
  return [{
    range: { startLineNumber: lastImportLineNumber, startColumn: endOfLastImportColumn, endLineNumber: lastImportLineNumber, endColumn: endOfLastImportColumn },
    text: `\nimport ${importPath};`,
  }];
}

function buildTypeNameCompletionItems(monaco: Monaco, model: editor.ITextModel, replaceRange: IRange, context: CompletionAnalysisContext): languages.CompletionItem[] {
  const declaredTypeKindToCompletionKind = {
    class: monaco.languages.CompletionItemKind.Class,
    interface: monaco.languages.CompletionItemKind.Interface,
    record: monaco.languages.CompletionItemKind.Struct,
    enum: monaco.languages.CompletionItemKind.Enum,
  };
  const declaredTypeItems: languages.CompletionItem[] = [...context.declaredTypesByName.values()].map((declaredType) => ({
    label: { label: declaredType.name, description: declaredType.typeKind },
    kind: declaredTypeKindToCompletionKind[declaredType.typeKind],
    insertText: declaredType.name,
    sortText: `${SORT_PRIORITY.type}${declaredType.name}`,
    range: replaceRange,
  }));

  const jdkTypeNames = [...JAVA_LANG_TYPE_NAMES, ...Object.keys(IMPORT_PATH_BY_TYPE_NAME)]
    .filter((jdkTypeName) => !context.declaredTypesByName.has(jdkTypeName));
  const jdkTypeItems: languages.CompletionItem[] = jdkTypeNames.map((jdkTypeName) => ({
    label: { label: jdkTypeName, description: IMPORT_PATH_BY_TYPE_NAME[jdkTypeName] ?? "java.lang" },
    kind: monaco.languages.CompletionItemKind.Class,
    insertText: jdkTypeName,
    additionalTextEdits: buildImportTextEdit(model, jdkTypeName, context),
    sortText: `${SORT_PRIORITY.type}${jdkTypeName}`,
    range: replaceRange,
  }));
  return [...declaredTypeItems, ...jdkTypeItems];
}

function buildUnqualifiedCompletionItems(monaco: Monaco, model: editor.ITextModel, replaceRange: IRange, context: CompletionAnalysisContext): languages.CompletionItem[] {
  const variableItems: languages.CompletionItem[] = [...collectDeclaredVariableNames(context.maskedText)].map((variableName) => ({
    label: variableName,
    kind: monaco.languages.CompletionItemKind.Variable,
    insertText: variableName,
    sortText: `${SORT_PRIORITY.variable}${variableName}`,
    range: replaceRange,
  }));

  const enclosingTypeMembers = context.enclosingType
    ? [...context.enclosingType.members.filter((member) => member.memberKind !== "enumConstant"), ...collectInstanceMembers(context.enclosingType.name, context)]
    : [];
  const enclosingTypeMemberItems = buildMemberCompletionItems(monaco, enclosingTypeMembers, replaceRange, SORT_PRIORITY.member)
    .filter((memberItem) => memberItem.kind === monaco.languages.CompletionItemKind.Method);

  const snippetItems: languages.CompletionItem[] = JAVA_SNIPPETS.map((snippet) => ({
    label: { label: snippet.label, description: snippet.description },
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: snippet.body,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: { value: "```java\n" + snippet.body.replace(/\$\{\d+:([^}]*)\}|\$\d+/g, "$1") + "\n```" },
    sortText: `${SORT_PRIORITY.snippet}${snippet.label}`,
    range: replaceRange,
  }));

  const keywordItems: languages.CompletionItem[] = JAVA_KEYWORDS.map((keyword) => ({
    label: keyword,
    kind: monaco.languages.CompletionItemKind.Keyword,
    insertText: keyword,
    sortText: `${SORT_PRIORITY.keyword}${keyword}`,
    range: replaceRange,
  }));

  return [
    ...variableItems,
    ...enclosingTypeMemberItems,
    ...buildTypeNameCompletionItems(monaco, model, replaceRange, context),
    ...snippetItems,
    ...keywordItems,
  ];
}

function provideJavaCompletionItems(monaco: Monaco, model: editor.ITextModel, position: { lineNumber: number; column: number }): languages.CompletionList {
  const sourceText = model.getValue();
  const cursorOffset = model.getOffsetAt(position);
  const { maskedText, isInsideCommentOrLiteral } = maskCommentsAndLiterals(sourceText);
  if (cursorOffset > 0 && isInsideCommentOrLiteral[cursorOffset - 1]) return { suggestions: [] };

  const wordUntilCursor = model.getWordUntilPosition(position);
  const replaceRange: IRange = {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: wordUntilCursor.startColumn,
    endColumn: wordUntilCursor.endColumn,
  };

  const declaredTypes = extractDeclaredTypes(maskedText);
  const context: CompletionAnalysisContext = {
    sourceText,
    maskedText,
    declaredTypesByName: new Map(declaredTypes.map((declaredType) => [declaredType.name, declaredType])),
    enclosingType: findInnermostEnclosingType(declaredTypes, cursorOffset),
    cursorOffset,
  };

  const wordStartOffset = model.getOffsetAt({ lineNumber: position.lineNumber, column: wordUntilCursor.startColumn });
  let characterBeforeWordIndex = wordStartOffset - 1;
  while (characterBeforeWordIndex >= 0 && /[ \t]/.test(maskedText[characterBeforeWordIndex])) characterBeforeWordIndex--;

  if (maskedText[characterBeforeWordIndex] === ".") {
    const receiverChain = extractReceiverChainBeforeDot(maskedText, characterBeforeWordIndex);
    const resolvedReceiver = receiverChain ? resolveReceiverChain(receiverChain, context) : null;
    if (!resolvedReceiver) return { suggestions: [] };
    return { suggestions: buildMemberCompletionItems(monaco, collectMembersOfReceiver(resolvedReceiver, context), replaceRange, SORT_PRIORITY.member) };
  }

  return { suggestions: buildUnqualifiedCompletionItems(monaco, model, replaceRange, context) };
}

export function registerJavaCompletionProvider(monaco: Monaco): void {
  const globalProviderRegistry = globalThis as typeof globalThis & { [COMPLETION_PROVIDER_REGISTRY_KEY]?: IDisposable };
  globalProviderRegistry[COMPLETION_PROVIDER_REGISTRY_KEY]?.dispose();
  globalProviderRegistry[COMPLETION_PROVIDER_REGISTRY_KEY] = monaco.languages.registerCompletionItemProvider("java", {
    triggerCharacters: ["."],
    provideCompletionItems: (model: editor.ITextModel, position: Position) => provideJavaCompletionItems(monaco, model, position),
  });
}
