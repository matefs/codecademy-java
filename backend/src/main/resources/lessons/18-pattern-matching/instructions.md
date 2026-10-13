# Pattern matching

O `switch` do Java 21 testa o **tipo** do valor, extrai dados dele e ainda aceita condições extras:

```java
record Retangulo(int largura, int altura) {}

public class Main {
    static String descrever(Object forma) {
        return switch (forma) {
            case Retangulo(int largura, int altura) when largura == altura -> "Quadrado " + largura;
            case Retangulo(int largura, int altura) -> "Retângulo " + largura + "x" + altura;
            case null -> "Nada";
            default -> "Outra coisa";
        };
    }

    public static void main(String[] args) {
        System.out.println(descrever(new Retangulo(3, 3))); // Quadrado 3
        System.out.println(descrever(new Retangulo(4, 2))); // Retângulo 4x2
        System.out.println(descrever(null));                // Nada
        System.out.println(descrever("texto"));             // Outra coisa
    }
}
```

- **Type pattern**: `case String texto` testa o tipo e já cria a variável `texto`.
- **Record pattern**: `case Retangulo(int largura, int altura)` desmonta o record em variáveis.
- **Guarda**: `when <condição>` só aceita o caso se a condição for verdadeira.
- **`case null`**: sem ele, um `switch` sobre `null` lança `NullPointerException`.

A ordem importa: um caso mais genérico antes de um mais específico do mesmo tipo não compila.

- Como `Object` não é `sealed`, o compilador não tem como saber todos os tipos possíveis: o `default` é **obrigatório**.
- Números literais viram objetos automaticamente (*autoboxing*): `-5` chega como `Integer` e `3.14` como `Double`, que não tem `case` próprio e cai no `default`.
- Fora do `switch`, o mesmo padrão funciona com `instanceof`: `if (valor instanceof String texto && !texto.isBlank())`.

## Tarefa
1. Crie `record Ponto(int x, int y)`.
2. Na classe `Main`, crie `static String classificar(Object valor)` usando `switch` com os casos:
   - `Integer` negativo → `Inteiro negativo: <numero>`
   - qualquer outro `Integer` → `Inteiro: <numero>`
   - `String` em branco → `Texto vazio`
   - qualquer outra `String` → `Texto com <tamanho> letras`
   - `Ponto` com `x == y` → `Ponto na diagonal: <x>`
   - qualquer outro `Ponto` → `Ponto (<x>, <y>)`
   - `null` → `Nulo`
   - qualquer outra coisa → `Desconhecido`
3. No `main`, imprima `classificar(...)` para cada valor, nesta ordem:
   `-5`, `42`, `""`, `"Java"`, `new Ponto(3, 3)`, `new Ponto(1, 2)`, `null`, `3.14`.
