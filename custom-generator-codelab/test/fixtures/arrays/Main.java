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
        int[] arr = new int[] {1, 2, 3};
        String[] arr_str = new String[] {"a", "b", "c", "d", "e"};
        Main[] arr_clz = new Main[] {new Main(), new Main()};
        Object[] arr_mix = new Object[] {1, "b", new Main()};
        String[] arr_split = "a,b,c,d".split(",");
        String ele = arr_str[0];
        arr[1] = 30;
    }

}


// main()-Methode starten
Main.main();