export type DeclaredTypeKind = "class" | "interface" | "record" | "enum";

export interface DeclaredMember {
  name: string;
  memberKind: "field" | "method" | "enumConstant";
  isStatic: boolean;
  typeName: string;
  parameterDeclarations: string[];
}

export interface DeclaredType {
  name: string;
  typeKind: DeclaredTypeKind;
  superTypeNames: string[];
  members: DeclaredMember[];
  bodyStartOffset: number;
  bodyEndOffset: number;
}

export interface ReceiverChainSegment {
  name: string;
  isMethodCall: boolean;
  isConstructorCall: boolean;
}

export interface MaskedJavaSource {
  maskedText: string;
  isInsideCommentOrLiteral: Uint8Array;
}

const MODIFIER_KEYWORDS = new Set([
  "public", "private", "protected", "static", "final", "abstract", "default", "synchronized",
  "native", "transient", "volatile", "sealed", "non-sealed", "strictfp",
]);

const KEYWORDS_THAT_ARE_NOT_TYPES = new Set([
  "return", "new", "else", "throw", "case", "yield", "package", "import", "extends", "implements",
  "permits", "instanceof", "class", "interface", "record", "enum", "if", "while", "for", "switch",
  "catch", "do", "try", "this", "super", "when", "assert",
]);

const IDENTIFIER_CHARACTER = /[\w$]/;

export const STRING_LITERAL_SEGMENT_NAME = '"';

export function splitTopLevelCommas(text: string): string[] {
  const parts: string[] = [];
  let angleBracketDepth = 0;
  let currentPartStartIndex = 0;
  for (let characterIndex = 0; characterIndex < text.length; characterIndex++) {
    const character = text[characterIndex];
    if (character === "<") angleBracketDepth++;
    else if (character === ">") angleBracketDepth--;
    else if (character === "," && angleBracketDepth === 0) {
      parts.push(text.slice(currentPartStartIndex, characterIndex));
      currentPartStartIndex = characterIndex + 1;
    }
  }
  parts.push(text.slice(currentPartStartIndex));
  return parts.map((part) => part.trim()).filter(Boolean);
}

export function maskCommentsAndLiterals(sourceText: string): MaskedJavaSource {
  const maskedCharacters = sourceText.split("");
  const isInsideCommentOrLiteral = new Uint8Array(sourceText.length);
  const maskRange = (startIndex: number, endIndexExclusive: number) => {
    for (let maskedIndex = startIndex; maskedIndex < endIndexExclusive; maskedIndex++) {
      isInsideCommentOrLiteral[maskedIndex] = 1;
      if (maskedCharacters[maskedIndex] !== "\n") maskedCharacters[maskedIndex] = " ";
    }
  };

  let scanIndex = 0;
  while (scanIndex < sourceText.length) {
    if (sourceText.startsWith("//", scanIndex)) {
      const lineEndIndex = sourceText.indexOf("\n", scanIndex);
      const commentEndIndex = lineEndIndex === -1 ? sourceText.length : lineEndIndex;
      maskRange(scanIndex, commentEndIndex);
      scanIndex = commentEndIndex;
    } else if (sourceText.startsWith("/*", scanIndex)) {
      const closingIndex = sourceText.indexOf("*/", scanIndex + 2);
      const commentEndIndex = closingIndex === -1 ? sourceText.length : closingIndex + 2;
      maskRange(scanIndex, commentEndIndex);
      scanIndex = commentEndIndex;
    } else if (sourceText.startsWith('"""', scanIndex)) {
      const closingIndex = sourceText.indexOf('"""', scanIndex + 3);
      const blockEndIndex = closingIndex === -1 ? sourceText.length : closingIndex;
      maskRange(scanIndex + 3, blockEndIndex);
      scanIndex = closingIndex === -1 ? sourceText.length : closingIndex + 3;
    } else if (sourceText[scanIndex] === '"' || sourceText[scanIndex] === "'") {
      const quoteCharacter = sourceText[scanIndex];
      let literalEndIndex = scanIndex + 1;
      while (literalEndIndex < sourceText.length && sourceText[literalEndIndex] !== quoteCharacter && sourceText[literalEndIndex] !== "\n") {
        literalEndIndex += sourceText[literalEndIndex] === "\\" ? 2 : 1;
      }
      maskRange(scanIndex + 1, Math.min(literalEndIndex, sourceText.length));
      scanIndex = literalEndIndex + 1;
    } else {
      scanIndex++;
    }
  }
  return { maskedText: maskedCharacters.join(""), isInsideCommentOrLiteral };
}

function findMatchingClosingBrace(maskedText: string, openingBraceIndex: number): number {
  let braceDepth = 0;
  for (let scanIndex = openingBraceIndex; scanIndex < maskedText.length; scanIndex++) {
    if (maskedText[scanIndex] === "{") braceDepth++;
    else if (maskedText[scanIndex] === "}" && --braceDepth === 0) return scanIndex;
  }
  return maskedText.length;
}

function extractTopLevelBodyText(maskedText: string, bodyStartOffset: number, bodyEndOffset: number): string {
  let topLevelText = "";
  let braceDepth = 0;
  for (let scanIndex = bodyStartOffset + 1; scanIndex < bodyEndOffset; scanIndex++) {
    const character = maskedText[scanIndex];
    if (character === "{") {
      if (braceDepth === 0) topLevelText += "{";
      braceDepth++;
    } else if (character === "}") {
      braceDepth--;
      if (braceDepth === 0) topLevelText += "}";
    } else if (braceDepth === 0) {
      topLevelText += character;
    }
  }
  return topLevelText;
}

export function stripGenericArguments(typeName: string): string {
  let strippedTypeName = typeName;
  while (/<[^<>]*>/.test(strippedTypeName)) strippedTypeName = strippedTypeName.replace(/<[^<>]*>/g, "");
  return strippedTypeName.replace(/\s+/g, "");
}

function parseTypeNameList(rawTypeList: string): string[] {
  return splitTopLevelCommas(rawTypeList).map(stripGenericArguments).filter(Boolean);
}

function parseMemberDeclaration(declarationText: string): DeclaredMember | null {
  const normalizedDeclaration = declarationText
    .replace(/@\w+(\s*\([^)]*\))?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalizedDeclaration) return null;

  const methodMatch = /^((?:[\w-]+\s+)*?)(?:<[^>]*>\s+)?([\w.$]+(?:\s*<.*>)?(?:\s*\[\s*\])*)\s+(\w+)\s*\(([^)]*)\)/.exec(normalizedDeclaration);
  if (methodMatch) {
    const [, modifierText, returnTypeName, methodName, rawParameterList] = methodMatch;
    if (MODIFIER_KEYWORDS.has(returnTypeName) || KEYWORDS_THAT_ARE_NOT_TYPES.has(returnTypeName)) return null;
    return {
      name: methodName,
      memberKind: "method",
      isStatic: /\bstatic\b/.test(modifierText),
      typeName: returnTypeName,
      parameterDeclarations: splitTopLevelCommas(rawParameterList),
    };
  }

  const fieldMatch = /^((?:[\w-]+\s+)*?)([\w.$]+(?:\s*<.*>)?(?:\s*\[\s*\])*)\s+(\w+)\s*(?:=.*)?$/s.exec(normalizedDeclaration);
  if (fieldMatch) {
    const [, modifierText, fieldTypeName, fieldName] = fieldMatch;
    if (MODIFIER_KEYWORDS.has(fieldTypeName) || KEYWORDS_THAT_ARE_NOT_TYPES.has(fieldTypeName)) return null;
    return {
      name: fieldName,
      memberKind: "field",
      isStatic: /\bstatic\b/.test(modifierText),
      typeName: fieldTypeName,
      parameterDeclarations: [],
    };
  }
  return null;
}

function parseEnumConstants(enumConstantsText: string): DeclaredMember[] {
  return enumConstantsText
    .replace(/\([^)]*\)/g, "")
    .replace(/\{\}/g, "")
    .split(",")
    .map((constantText) => constantText.trim())
    .filter((constantName) => /^[A-Za-z_]\w*$/.test(constantName))
    .map((constantName) => ({
      name: constantName,
      memberKind: "enumConstant" as const,
      isStatic: true,
      typeName: "",
      parameterDeclarations: [],
    }));
}

function parseRecordComponentAccessors(rawComponentList: string): DeclaredMember[] {
  return splitTopLevelCommas(rawComponentList).flatMap((componentDeclaration) => {
    const componentMatch = /^(.+?)\s+(\w+)$/.exec(componentDeclaration.replace(/\s+/g, " "));
    if (!componentMatch) return [];
    return [{
      name: componentMatch[2],
      memberKind: "method" as const,
      isStatic: false,
      typeName: componentMatch[1],
      parameterDeclarations: [],
    }];
  });
}

export function extractDeclaredTypes(maskedText: string): DeclaredType[] {
  const typeHeaderPattern = /\b(class|interface|record|enum)\s+([A-Za-z_$][\w$]*)\s*(<[^{]*?>)?\s*(?:\(([^)]*)\))?([^{;]*)\{/g;
  const declaredTypes: DeclaredType[] = [];

  for (const headerMatch of maskedText.matchAll(typeHeaderPattern)) {
    const [fullHeaderText, typeKeyword, typeName, , rawRecordComponents, headerTail] = headerMatch;
    const bodyStartOffset = headerMatch.index + fullHeaderText.length - 1;
    const bodyEndOffset = findMatchingClosingBrace(maskedText, bodyStartOffset);
    const typeKind = typeKeyword as DeclaredTypeKind;

    const tailWithoutGenerics = stripGenericArgumentsKeepingSpaces(headerTail);
    const superTypeNames = [
      ...parseTypeNameList(/\bextends\s+(.+?)(?=\s+implements\b|\s+permits\b|$)/.exec(tailWithoutGenerics)?.[1] ?? ""),
      ...parseTypeNameList(/\bimplements\s+(.+?)(?=\s+permits\b|$)/.exec(tailWithoutGenerics)?.[1] ?? ""),
    ];

    let topLevelBodyText = extractTopLevelBodyText(maskedText, bodyStartOffset, bodyEndOffset);
    const members: DeclaredMember[] = [];
    if (typeKind === "enum") {
      const constantsEndIndex = topLevelBodyText.indexOf(";");
      members.push(...parseEnumConstants(constantsEndIndex === -1 ? topLevelBodyText : topLevelBodyText.slice(0, constantsEndIndex)));
      topLevelBodyText = constantsEndIndex === -1 ? "" : topLevelBodyText.slice(constantsEndIndex + 1);
    }
    if (typeKind === "record" && rawRecordComponents !== undefined) {
      members.push(...parseRecordComponentAccessors(rawRecordComponents));
    }
    for (const declarationText of topLevelBodyText.split(/[;{}]/)) {
      const declaredMember = parseMemberDeclaration(declarationText);
      if (declaredMember) members.push(declaredMember);
    }

    declaredTypes.push({ name: typeName, typeKind, superTypeNames, members, bodyStartOffset, bodyEndOffset });
  }
  return declaredTypes;
}

function stripGenericArgumentsKeepingSpaces(text: string): string {
  let strippedText = text;
  while (/<[^<>]*>/.test(strippedText)) strippedText = strippedText.replace(/<[^<>]*>/g, "");
  return strippedText.replace(/\s+/g, " ").trim();
}

export function findInnermostEnclosingType(declaredTypes: DeclaredType[], offset: number): DeclaredType | null {
  return declaredTypes
    .filter((declaredType) => declaredType.bodyStartOffset < offset && offset <= declaredType.bodyEndOffset)
    .sort((first, second) => (first.bodyEndOffset - first.bodyStartOffset) - (second.bodyEndOffset - second.bodyStartOffset))[0] ?? null;
}

const VARIABLE_DECLARATION_TYPE_PATTERN = String.raw`([A-Za-z_$][\w.$]*(?:\s*<[^;=(){}]*?>)?(?:\s*\[\s*\])*)`;
const VARIABLE_DECLARATION_LOOKAHEAD = String.raw`(?=\s*(?:[=;,):&|]|->))`;

export function collectDeclaredVariableNames(maskedText: string): Set<string> {
  const declarationPattern = new RegExp(String.raw`(?:^|[\s(,;{])(?:final\s+)?${VARIABLE_DECLARATION_TYPE_PATTERN}\s+([A-Za-z_$][\w$]*)${VARIABLE_DECLARATION_LOOKAHEAD}`, "g");
  const variableNames = new Set<string>();
  for (const declarationMatch of maskedText.matchAll(declarationPattern)) {
    if (!KEYWORDS_THAT_ARE_NOT_TYPES.has(declarationMatch[1]) && !MODIFIER_KEYWORDS.has(declarationMatch[1])) {
      variableNames.add(declarationMatch[2]);
    }
  }
  return variableNames;
}

export function inferVariableTypeName(sourceText: string, maskedText: string, variableName: string, beforeOffset: number): string | null {
  const escapedVariableName = variableName.replace(/\$/g, "\\$");
  const declarationPattern = new RegExp(String.raw`(?:^|[\s(,;{])(?:final\s+)?${VARIABLE_DECLARATION_TYPE_PATTERN}\s+${escapedVariableName}${VARIABLE_DECLARATION_LOOKAHEAD}`, "g");

  let closestDeclarationMatch: RegExpExecArray | null = null;
  for (const declarationMatch of maskedText.matchAll(declarationPattern)) {
    if (declarationMatch.index >= beforeOffset) break;
    if (KEYWORDS_THAT_ARE_NOT_TYPES.has(declarationMatch[1]) || MODIFIER_KEYWORDS.has(declarationMatch[1])) continue;
    closestDeclarationMatch = declarationMatch;
  }
  if (!closestDeclarationMatch) return null;

  const declaredTypeName = closestDeclarationMatch[1];
  if (declaredTypeName !== "var") return declaredTypeName;

  const initializerText = sourceText.slice(closestDeclarationMatch.index + closestDeclarationMatch[0].length);
  const initializerMatch = /^\s*=\s*(?:new\s+([A-Za-z_$][\w.$]*)|(")|(\d+)\b(?![.\dLlDdFf]))/.exec(initializerText);
  if (initializerMatch?.[1]) return initializerMatch[1];
  if (initializerMatch?.[2]) return "String";
  if (initializerMatch?.[3]) return "int";
  return null;
}

function findMatchingOpeningParenthesis(maskedText: string, closingParenthesisIndex: number): number {
  let parenthesisDepth = 0;
  for (let scanIndex = closingParenthesisIndex; scanIndex >= 0; scanIndex--) {
    if (maskedText[scanIndex] === ")") parenthesisDepth++;
    else if (maskedText[scanIndex] === "(" && --parenthesisDepth === 0) return scanIndex;
  }
  return -1;
}

export function extractReceiverChainBeforeDot(maskedText: string, dotOffset: number): ReceiverChainSegment[] | null {
  const segmentsFromLastToFirst: ReceiverChainSegment[] = [];
  let scanIndex = dotOffset - 1;

  while (true) {
    while (scanIndex >= 0 && /\s/.test(maskedText[scanIndex])) scanIndex--;
    if (maskedText[scanIndex] === '"') {
      segmentsFromLastToFirst.push({ name: STRING_LITERAL_SEGMENT_NAME, isMethodCall: false, isConstructorCall: false });
      break;
    }
    let isMethodCall = false;
    if (maskedText[scanIndex] === ")") {
      scanIndex = findMatchingOpeningParenthesis(maskedText, scanIndex) - 1;
      if (scanIndex < 0) return null;
      while (scanIndex >= 0 && /\s/.test(maskedText[scanIndex])) scanIndex--;
      isMethodCall = true;
    }

    const identifierEndIndex = scanIndex + 1;
    while (scanIndex >= 0 && IDENTIFIER_CHARACTER.test(maskedText[scanIndex])) scanIndex--;
    const segmentName = maskedText.slice(scanIndex + 1, identifierEndIndex);
    if (!segmentName || /^\d/.test(segmentName)) return null;

    const isConstructorCall = isMethodCall && /\bnew\s+$/.test(maskedText.slice(Math.max(0, scanIndex - 10), scanIndex + 1));
    segmentsFromLastToFirst.push({ name: segmentName, isMethodCall, isConstructorCall });
    if (isConstructorCall) break;

    let lookbehindIndex = scanIndex;
    while (lookbehindIndex >= 0 && /\s/.test(maskedText[lookbehindIndex])) lookbehindIndex--;
    if (maskedText[lookbehindIndex] !== ".") break;
    scanIndex = lookbehindIndex - 1;
  }
  return segmentsFromLastToFirst.reverse();
}
