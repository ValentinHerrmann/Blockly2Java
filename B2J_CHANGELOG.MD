## Changelog: [Blockly2Java](https://github.com/ValentinHerrmann/Blockly2Java)

### [Version 2.3.1](https://github.com/ValentinHerrmann/Blockly2Java/releases/tag/2.3.1)
- Simplified versioning implementation by removing node-git dependencies and reading from a simple `VERSION` file.
- Configured backup fallback deployment to GitHub Pages for release builds.
- Removed Online-IDE submodule and transitioned to dynamic external loading from `https://onlineide.blockly2java.de`.
- Cleaned up development and setup scripts.

### [Version 1.8](https://github.com/ValentinHerrmann/Blockly2Java/releases/tag/1.8)
#### Pull Request https://github.com/ValentinHerrmann/Blockly2Java/pull/11:
- Fixed type determination via increase block.
- Fixed graphics bug in BlueJ-Mode (now: no trash can visible in no-blockly-mode).

### [Version 1.7](https://github.com/ValentinHerrmann/Blockly2Java/releases/tag/1.7)
#### Pull Request https://github.com/ValentinHerrmann/Blockly2Java/pull/9:
- Try posting code to BlueJ only if connected (initial GET request for xml from BlueJ was successful).
- Hide java-code window if connected to BlueJ (https://github.com/ValentinHerrmann/BlueJBlocklyExtension/pull/18).
- Extended readme.

### [Version 1.6](https://github.com/ValentinHerrmann/Blockly2Java/releases/tag/1.6)
- publish release as Blockly2Java.tar.gz instead of single files

### [Version 1.5](https://github.com/ValentinHerrmann/Blockly2Java/releases/tag/1.5)
- Minor bugfixes
- Basic constructor support
