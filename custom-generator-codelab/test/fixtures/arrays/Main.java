/**
 * Erstelle dein Programm über Blockly und
 * klicke auf 'Play', um es auszuführen!
 */

public class Main {
    /**
     * Das Hauptprogramm (main-Methode):
     * Alles, was ausgeführt werden soll,
     * muss in diese Methode eingefügt werden.
     * Objekte erstellen, Methoden aufrufen, ...
     *
     * Das Hauptprogramm wird automatisch
     * gestartet, wenn du auf 'Play' drückst.
     */
    public static void main() {
        int[] arr = {1, 2, 3};
        String[] arr_str = {"a", "b", "c", "d", "e"};
        Shape[] arr_clz = {new Ellipse(0, 0, 0, 0), new Circle(0, 0, 0)};
        Object[] arr_mix = {1, "b", new Main()};
        String[] arr_split = "".split(",");
        arr_split = "a,b,c,d".split(",");
        String ele = arr_str[1];
        arr[1] = 30;
    }

}


// main()-Methode starten
Main.main();