# Encapsulamento

Encapsular é esconder o estado interno (`private`) e expor só operações que mantêm o objeto válido:

```java
class Termometro {
    private int temperatura;

    void ajustar(int novaTemperatura) {
        if (novaTemperatura < -273) return;
        temperatura = novaTemperatura;
    }

    int getTemperatura() {
        return temperatura;
    }
}

public class Main {
    public static void main(String[] args) {
        Termometro termometro = new Termometro();
        termometro.ajustar(25);
        termometro.ajustar(-500); // ignorado: abaixo do zero absoluto
        // termometro.temperatura = -500; // não compila: temperatura é private
        System.out.println(termometro.getTemperatura()); // 25
    }
}
```

- `private` vale por classe: dentro de `Main`, `termometro.temperatura = -500;` não compila. A única forma de mudar o valor é por `ajustar`, que valida.
- Por isso não se cria um `setTemperatura` que aceita qualquer coisa: isso devolveria o acesso livre que o `private` tirou.

## Tarefa
1. Crie a classe `ContaBancaria` com o campo `private int saldo`.
2. Crie `depositar(int valor)`: ignora valores menores ou iguais a zero.
3. Crie `boolean sacar(int valor)`: retorna `false` sem alterar o saldo se o valor for menor ou igual a zero ou maior que o saldo; caso contrário, desconta e retorna `true`.
4. Crie `int getSaldo()`.
5. No `main`:
   - deposite `100`, depois tente depositar `-50`;
   - imprima `Saque de 30: <resultado de sacar(30)>`;
   - imprima `Saque de 500: <resultado de sacar(500)>`;
   - imprima `Saldo final: <getSaldo()>`.
