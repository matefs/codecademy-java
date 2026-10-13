# Sealed classes

Um tipo `sealed` define a lista **fechada** de subtipos permitidos com `permits`. Assim o compilador sabe todas as possibilidades e um `switch` com pattern matching não precisa de `default`:

```java
sealed interface Forma permits Quadrado, Circulo {}
record Quadrado(int lado) implements Forma {}
record Circulo(int raio) implements Forma {}

static String nome(Forma forma) {
    return switch (forma) {
        case Quadrado quadrado -> "Quadrado de lado " + quadrado.lado();
        case Circulo circulo -> "Círculo de raio " + circulo.raio();
    };
}
```

Se alguém adicionar um novo subtipo ao `permits`, todo `switch` sem o novo `case` deixa de compilar.

## Tarefa
1. Crie `sealed interface Pagamento permits Pix, Cartao`.
2. Crie `record Pix(int valor)` e `record Cartao(int valor, int parcelas)`, ambos implementando `Pagamento`.
3. Na classe `Main`, crie `static String descrever(Pagamento pagamento)` usando `switch` com pattern matching, **sem `default`**:
   - `Pix` → `Pix de <valor>`
   - `Cartao` → `Cartão de <valor> em <parcelas>x`
4. No `main`, imprima `descrever(new Pix(50))` e depois `descrever(new Cartao(300, 3))`.
