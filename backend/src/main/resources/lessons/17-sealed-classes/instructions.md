# Sealed classes

Um tipo `sealed` define a lista **fechada** de subtipos permitidos com `permits`. Assim o compilador sabe todas as possibilidades e um `switch` com pattern matching não precisa de `default`:

```java
sealed interface Forma permits Quadrado, Circulo {}

record Quadrado(int lado) implements Forma {}

record Circulo(int raio) implements Forma {}

public class Main {
    static String nome(Forma forma) {
        return switch (forma) {
            case Quadrado quadrado -> "Quadrado de lado " + quadrado.lado();
            case Circulo circulo -> "Círculo de raio " + circulo.raio();
        };
    }

    public static void main(String[] args) {
        System.out.println(nome(new Quadrado(4))); // Quadrado de lado 4
        System.out.println(nome(new Circulo(2)));  // Círculo de raio 2
    }
}
```

Se alguém adicionar um novo subtipo ao `permits`, todo `switch` sem o novo `case` deixa de compilar.

- Todo subtipo permitido precisa ser `final`, `sealed` ou `non-sealed`. Records já são `final` automaticamente, por isso encaixam direto.
- Um tipo fora do `permits` que tente implementar `Forma` não compila.
- `return switch (...) { ... };` é uma **expressão**: cada `case` produz um valor e o `;` depois do `}` é obrigatório.

## Tarefa
1. Crie `sealed interface Pagamento permits Pix, Cartao`.
2. Crie `record Pix(int valor)` e `record Cartao(int valor, int parcelas)`, ambos implementando `Pagamento`.
3. Na classe `Main`, crie `static String descrever(Pagamento pagamento)` usando `switch` com pattern matching, **sem `default`**:
   - `Pix` → `Pix de <valor>`
   - `Cartao` → `Cartão de <valor> em <parcelas>x`
4. No `main`, imprima `descrever(new Pix(50))` e depois `descrever(new Cartao(300, 3))`.
