import { splitTopLevelCommas } from "./javaSourceAnalysis";

export interface CatalogMember {
  name: string;
  parameterDeclarations: string[] | null;
  returnTypeName: string;
}

export interface JavaSnippetDefinition {
  label: string;
  description: string;
  body: string;
}

export const JAVA_KEYWORDS = [
  "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "continue",
  "default", "do", "double", "else", "enum", "extends", "false", "final", "finally", "float", "for",
  "if", "implements", "import", "instanceof", "int", "interface", "long", "new", "non-sealed", "null",
  "package", "permits", "private", "protected", "public", "record", "return", "sealed", "short",
  "static", "super", "switch", "this", "throw", "throws", "true", "try", "var", "void", "volatile",
  "while", "yield",
];

export const JAVA_SNIPPETS: JavaSnippetDefinition[] = [
  { label: "sout", description: "System.out.println(...)", body: "System.out.println($0);" },
  { label: "souf", description: "System.out.printf(...)", body: 'System.out.printf("${1:%s}%n", $0);' },
  { label: "psvm", description: "public static void main", body: "public static void main(String[] args) {\n\t$0\n}" },
  { label: "fori", description: "for com índice", body: "for (int ${1:i} = 0; ${1:i} < ${2:limite}; ${1:i}++) {\n\t$0\n}" },
  { label: "foreach", description: "for-each", body: "for (${1:Tipo} ${2:item} : ${3:colecao}) {\n\t$0\n}" },
  { label: "while", description: "laço while", body: "while (${1:condicao}) {\n\t$0\n}" },
  { label: "dowhile", description: "laço do-while", body: "do {\n\t$0\n} while (${1:condicao});" },
  { label: "if", description: "if", body: "if (${1:condicao}) {\n\t$0\n}" },
  { label: "ifelse", description: "if / else", body: "if (${1:condicao}) {\n\t$2\n} else {\n\t$0\n}" },
  { label: "switch", description: "switch com ->", body: "switch (${1:valor}) {\n\tcase ${2:opcao} -> $3;\n\tdefault -> $0;\n}" },
  { label: "try", description: "try / catch", body: "try {\n\t$1\n} catch (${2:Exception} ${3:excecao}) {\n\t$0\n}" },
  { label: "class", description: "classe", body: "class ${1:Nome} {\n\t$0\n}" },
  { label: "classextends", description: "subclasse com super(...)", body: "class ${1:Nome} extends ${2:Base} {\n\t${1:Nome}($3) {\n\t\tsuper($4);\n\t}\n\t$0\n}" },
  { label: "interface", description: "interface", body: "interface ${1:Nome} {\n\t${2:void} ${3:metodo}();$0\n}" },
  { label: "record", description: "record", body: "record ${1:Nome}(${2:int valor}) {}$0" },
  { label: "enum", description: "enum", body: "enum ${1:Nome} {\n\t${2:VALOR}$0\n}" },
  { label: "sealed", description: "sealed interface + records", body: "sealed interface ${1:Tipo} permits ${2:A}, ${3:B} {}\n\nrecord ${2:A}() implements ${1:Tipo} {}\nrecord ${3:B}() implements ${1:Tipo} {}$0" },
  { label: "method", description: "método", body: "${1:void} ${2:nome}($3) {\n\t$0\n}" },
  { label: "override", description: "@Override", body: "@Override\n${1:void} ${2:metodo}($3) {\n\t$0\n}" },
  { label: "tostring", description: "@Override toString()", body: "@Override\npublic String toString() {\n\treturn ${0:\"\"};\n}" },
  { label: "instanceof", description: "if com pattern matching", body: "if (${1:objeto} instanceof ${2:Tipo} ${3:nome}) {\n\t$0\n}" },
];

export const IMPORT_PATH_BY_TYPE_NAME: Record<string, string> = {
  List: "java.util.List",
  ArrayList: "java.util.ArrayList",
  LinkedList: "java.util.LinkedList",
  Map: "java.util.Map",
  HashMap: "java.util.HashMap",
  TreeMap: "java.util.TreeMap",
  LinkedHashMap: "java.util.LinkedHashMap",
  Set: "java.util.Set",
  HashSet: "java.util.HashSet",
  TreeSet: "java.util.TreeSet",
  Arrays: "java.util.Arrays",
  Collections: "java.util.Collections",
  Objects: "java.util.Objects",
  Optional: "java.util.Optional",
  Random: "java.util.Random",
  Stream: "java.util.stream.Stream",
  IntStream: "java.util.stream.IntStream",
  Collectors: "java.util.stream.Collectors",
};

export const JAVA_LANG_TYPE_NAMES = [
  "String", "StringBuilder", "Object", "Math", "System", "Integer", "Long", "Double", "Boolean",
  "Character", "Exception", "RuntimeException", "IllegalArgumentException", "IllegalStateException",
];

export const TYPE_NAME_ALIASES: Record<string, string> = {
  ArrayList: "List",
  LinkedList: "List",
  HashMap: "Map",
  TreeMap: "Map",
  LinkedHashMap: "Map",
  HashSet: "Set",
  TreeSet: "Set",
  LinkedHashSet: "Set",
  "Map.Entry": "Entry",
};

const OBJECT_MEMBER_SPECIFICATIONS = [
  "equals(Object other): boolean",
  "hashCode(): int",
  "toString(): String",
  "getClass(): Class",
];

const INSTANCE_MEMBER_SPECIFICATIONS_BY_TYPE_NAME: Record<string, string[]> = {
  String: [
    "length(): int", "charAt(int index): char", "substring(int beginIndex): String",
    "substring(int beginIndex, int endIndex): String", "indexOf(String text): int", "lastIndexOf(String text): int",
    "contains(CharSequence text): boolean", "startsWith(String prefix): boolean", "endsWith(String suffix): boolean",
    "equalsIgnoreCase(String other): boolean", "compareTo(String other): int", "isEmpty(): boolean",
    "isBlank(): boolean", "toUpperCase(): String", "toLowerCase(): String", "trim(): String", "strip(): String",
    "replace(CharSequence target, CharSequence replacement): String", "split(String regex): String[]",
    "toCharArray(): char[]", "repeat(int count): String", "concat(String other): String",
    "formatted(Object... args): String", "matches(String regex): boolean", "chars(): IntStream",
  ],
  StringBuilder: [
    "append(Object value): StringBuilder", "insert(int offset, Object value): StringBuilder",
    "reverse(): StringBuilder", "deleteCharAt(int index): StringBuilder", "setLength(int newLength): void",
    "length(): int", "charAt(int index): char", "toString(): String",
  ],
  PrintStream: [
    "println(Object value): void", "println(): void", "print(Object value): void",
    "printf(String format, Object... args): PrintStream",
  ],
  List: [
    "add(E element): boolean", "add(int index, E element): void", "get(int index): E", "set(int index, E element): E",
    "remove(int index): E", "size(): int", "isEmpty(): boolean", "contains(Object element): boolean",
    "indexOf(Object element): int", "clear(): void", "addAll(Collection elements): boolean",
    "removeIf(Predicate filter): boolean", "sort(Comparator comparator): void", "forEach(Consumer action): void",
    "stream(): Stream",
  ],
  Map: [
    "put(K key, V value): V", "get(Object key): V", "getOrDefault(Object key, V defaultValue): V",
    "containsKey(Object key): boolean", "containsValue(Object value): boolean", "remove(Object key): V",
    "putIfAbsent(K key, V value): V", "merge(K key, V value, BiFunction remapping): V",
    "computeIfAbsent(K key, Function mapping): V", "size(): int", "isEmpty(): boolean", "keySet(): Set",
    "values(): Collection", "entrySet(): Set", "forEach(BiConsumer action): void", "clear(): void",
  ],
  Entry: ["getKey(): K", "getValue(): V", "setValue(V value): V"],
  Set: [
    "add(E element): boolean", "remove(Object element): boolean", "contains(Object element): boolean",
    "size(): int", "isEmpty(): boolean", "clear(): void", "forEach(Consumer action): void", "stream(): Stream",
  ],
  Optional: [
    "isPresent(): boolean", "isEmpty(): boolean", "get(): T", "orElse(T other): T",
    "ifPresent(Consumer action): void", "map(Function mapper): Optional",
  ],
  Stream: [
    "filter(Predicate predicate): Stream", "map(Function mapper): Stream", "sorted(): Stream",
    "mapToInt(ToIntFunction mapper): IntStream", "forEach(Consumer action): void", "toList(): List",
    "count(): long", "anyMatch(Predicate predicate): boolean", "allMatch(Predicate predicate): boolean",
    "reduce(T identity, BinaryOperator accumulator): T", "collect(Collector collector): R",
  ],
  IntStream: [
    "sum(): int", "average(): OptionalDouble", "max(): OptionalInt", "min(): OptionalInt",
    "filter(IntPredicate predicate): IntStream", "map(IntUnaryOperator mapper): IntStream",
    "forEach(IntConsumer action): void", "boxed(): Stream", "count(): long", "toArray(): int[]",
  ],
};

const STATIC_MEMBER_SPECIFICATIONS_BY_TYPE_NAME: Record<string, string[]> = {
  System: [
    "out: PrintStream", "err: PrintStream", "currentTimeMillis(): long", "nanoTime(): long",
    "lineSeparator(): String", "exit(int status): void",
  ],
  String: [
    "valueOf(Object value): String", "format(String format, Object... args): String",
    "join(CharSequence delimiter, Object... elements): String",
  ],
  Math: [
    "abs(double value): double", "max(int first, int second): int", "min(int first, int second): int",
    "pow(double base, double exponent): double", "sqrt(double value): double", "round(double value): long",
    "floor(double value): double", "ceil(double value): double", "random(): double",
    "floorDiv(int dividend, int divisor): int", "floorMod(int dividend, int divisor): int", "PI: double", "E: double",
  ],
  Arrays: [
    "toString(Object[] array): String", "sort(Object[] array): void", "fill(Object[] array, Object value): void",
    "asList(T... elements): List", "copyOf(Object[] original, int newLength): Object[]",
    "stream(Object[] array): Stream", "equals(Object[] first, Object[] second): boolean",
  ],
  Integer: [
    "parseInt(String text): int", "valueOf(int value): Integer", "toString(int value): String",
    "compare(int first, int second): int", "sum(int first, int second): int", "MAX_VALUE: int", "MIN_VALUE: int",
  ],
  Double: ["parseDouble(String text): double", "valueOf(double value): Double", "MAX_VALUE: double", "MIN_VALUE: double"],
  Character: [
    "isDigit(char character): boolean", "isLetter(char character): boolean", "isUpperCase(char character): boolean",
    "isLowerCase(char character): boolean", "isWhitespace(char character): boolean",
    "toUpperCase(char character): char", "toLowerCase(char character): char",
  ],
  Collections: [
    "sort(List list): void", "reverse(List list): void", "shuffle(List list): void", "max(Collection collection): T",
    "min(Collection collection): T", "unmodifiableList(List list): List", "emptyList(): List",
  ],
  Objects: [
    "equals(Object first, Object second): boolean", "hash(Object... values): int",
    "requireNonNull(T value): T", "isNull(Object value): boolean", "toString(Object value): String",
  ],
  List: ["of(E... elements): List", "copyOf(Collection elements): List"],
  Set: ["of(E... elements): Set", "copyOf(Collection elements): Set"],
  Map: ["of(K key, V value): Map", "entry(K key, V value): Entry", "copyOf(Map map): Map"],
  Optional: ["of(T value): Optional", "ofNullable(T value): Optional", "empty(): Optional"],
  Stream: ["of(T... values): Stream"],
  IntStream: ["range(int startInclusive, int endExclusive): IntStream", "rangeClosed(int startInclusive, int endInclusive): IntStream", "of(int... values): IntStream"],
  Collectors: ["toList(): Collector", "toSet(): Collector", "joining(CharSequence delimiter): Collector", "groupingBy(Function classifier): Collector", "counting(): Collector"],
};

function parseMemberSpecification(memberSpecification: string): CatalogMember {
  const methodMatch = /^(\w+)\((.*)\):\s*(.+)$/.exec(memberSpecification);
  if (methodMatch) {
    const [, memberName, rawParameterList, returnTypeName] = methodMatch;
    return {
      name: memberName,
      parameterDeclarations: rawParameterList.trim() ? splitTopLevelCommas(rawParameterList) : [],
      returnTypeName: returnTypeName.trim(),
    };
  }
  const [fieldName, fieldTypeName] = memberSpecification.split(/:\s*/);
  return { name: fieldName, parameterDeclarations: null, returnTypeName: fieldTypeName };
}

function parseMemberSpecificationsByTypeName(specificationsByTypeName: Record<string, string[]>) {
  return new Map(Object.entries(specificationsByTypeName)
    .map(([typeName, memberSpecifications]) => [typeName, memberSpecifications.map(parseMemberSpecification)]));
}

export const OBJECT_MEMBERS = OBJECT_MEMBER_SPECIFICATIONS.map(parseMemberSpecification);
export const CATALOG_INSTANCE_MEMBERS_BY_TYPE_NAME = parseMemberSpecificationsByTypeName(INSTANCE_MEMBER_SPECIFICATIONS_BY_TYPE_NAME);
export const CATALOG_STATIC_MEMBERS_BY_TYPE_NAME = parseMemberSpecificationsByTypeName(STATIC_MEMBER_SPECIFICATIONS_BY_TYPE_NAME);
