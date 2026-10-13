# Polimorfismo

Uma variável do tipo da superclasse pode apontar para qualquer subclasse. Ao chamar um método sobrescrito, o Java executa a versão do **objeto real**, não a do tipo da variável:

```java
class Animal {
    void falar() { System.out.println("..."); }
}

class Pato extends Animal {
    @Override
    void falar() { System.out.println("Quack"); }
}

Animal animal = new Pato();
animal.falar(); // Quack
```

## Tarefa
1. Crie a classe `Instrumento` com o método `tocar()`.
2. Crie `Violao` e `Bateria`, ambas herdando de `Instrumento` e sobrescrevendo `tocar()` com `@Override`:
   - `Violao` imprime `Violão: dedilhando`
   - `Bateria` imprime `Bateria: tum tum tá`
3. No `main`, guarde um `Violao` e uma `Bateria` em um array (ou `List`) de `Instrumento`, nessa ordem.
4. Percorra a coleção chamando `tocar()` em cada item.
