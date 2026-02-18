import { getClassName } from "../generators/javascript/javascript_generator";

export class CodeTransformer {
  /**
   * Applies all post-processing transformations to the raw generated code.
   * @param {string} code - raw code
   * @returns {string} the fully transformed Java source
   */
  static transformCode(code) {
    // Drop everything from the first warning marker onward.
    let modCode = code.split("!!!", 2)[0];

    modCode = this.indentation(modCode);
    modCode = modCode.replaceAll('    // Describe this function...\n', '');
    modCode = this.defaultCodePrefix(modCode);
    modCode = modCode.replaceAll('__CLASS__', getClassName());

    if (modCode.includes('public static void main()')) {
      modCode += '\n\n\n// main()-Methode starten\n' + getClassName() + '.main();';
    }

    return modCode;
  }

  static indentation(modCode) {
    const codeLines = modCode.split("\n");
    for (let i = 0; i < codeLines.length; i++) {
      if (codeLines[i] !== "") {
        codeLines[i] = "    " + codeLines[i];
      }
    }
    return codeLines.join("\n");
  }

  static defaultCodePrefix(modCode) {
    const codePrefix = 'public class ' + getClassName() + ' { \n';
    return codePrefix + modCode + '}';
  }

  /**
   * Extracts the class name from a `public class …` declaration in the given code.
   * @param {string} codePrefix
   * @returns {string} the class name, or `'MeineKlasse'` if not found
   */
  static findClassName(codePrefix) {
    const classHeader = codePrefix.match('public class [^\\{]+');
    if (classHeader == null) {
      console.warn("Class Header not found");
      return "MeineKlasse";
    }
    return classHeader[0].replace('public class', '').trim();
  }

  /**
   * Rewrites `public void <ClassName>(…)` as `public <ClassName>(…)` so that
   * constructor declarations are syntactically correct Java.
   * @param {string} modCode
   * @returns {string}
   */
  static constructors(modCode) {
    const classHeader = modCode.match('public class [^\\{]+');
    if (classHeader == null) {
      console.warn("Class Header not found");
    } else {
      const name = classHeader[0].replace('public class', '').trim();
      console.log("Class Header: " + name);
      modCode = modCode.replace("public void " + name + "(", "public " + name + "(");
    }
    return modCode;
  }

  /**
   * Rewrites `public void main(` as `public static void main(`.
   * @param {string} modCode
   * @returns {string}
   */
  static mainMethod(modCode) {
    return modCode.replace('public void main(', 'public static void main(');
  }
}
