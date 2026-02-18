import * as Blockly from 'blockly';

export class UiManager {
  /**
   * Reads CSS custom properties and creates the Blockly dark theme.
   * @returns {Blockly.Theme} the configured dark theme
   */
  static setupTheme() {
    const rootStyles = getComputedStyle(document.documentElement);
    const colors = {
      primaryBg: rootStyles.getPropertyValue('--primary-bg').trim(),
      secondaryBg: rootStyles.getPropertyValue('--secondary-bg').trim(),
      tertiaryBg: rootStyles.getPropertyValue('--tertiary-bg').trim(),
      textPrimary: rootStyles.getPropertyValue('--text-primary').trim(),
      textSecondary: rootStyles.getPropertyValue('--text-secondary').trim(),
      textTertiary: rootStyles.getPropertyValue('--text-tertiary').trim(),
      opacityFlyout: parseFloat(rootStyles.getPropertyValue('--opacity-flyout').trim()),
      opacityScrollbar: parseFloat(rootStyles.getPropertyValue('--opacity-scrollbar').trim()),
      opacityMarker: parseFloat(rootStyles.getPropertyValue('--opacity-marker').trim()),
    };

    return Blockly.Theme.defineTheme('dark', {
      'base': Blockly.Themes.Classic,
      'componentStyles': {
        'workspaceBackgroundColour': colors.primaryBg,
        'toolboxBackgroundColour': colors.secondaryBg,
        'toolboxForegroundColour': colors.textPrimary,
        'flyoutBackgroundColour': colors.secondaryBg,
        'flyoutForegroundColour': colors.textPrimary,
        'flyoutOpacity': colors.opacityFlyout,
        'scrollbarColour': colors.tertiaryBg,
        'scrollbarOpacity': colors.opacityScrollbar,
        'insertionMarkerColour': colors.textSecondary,
        'insertionMarkerOpacity': colors.opacityMarker,
        'markerColour': colors.textSecondary,
        'cursorColour': colors.textTertiary,
      }
    });
  }

  /**
   * Sets up the draggable divider between the left and right panes.
   * @param {Blockly.WorkspaceSvg} workspace
   */
  static setupDivider(workspace) {
    const divider = document.getElementById('divider');
    const leftPane = document.getElementById('leftPane');
    const rightPane = document.getElementById('rightPane');
    const pageContainer = document.getElementById('pageContainer');

    let isDragging = false;

    divider.addEventListener('mousedown', (e) => {
      isDragging = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const containerRect = pageContainer.getBoundingClientRect();
      const newLeftWidth = e.clientX - containerRect.left;
      const containerWidth = containerRect.width;
      const dividerWidth = 5;

      const leftPaneStyle = getComputedStyle(leftPane);
      const rightPaneStyle = getComputedStyle(rightPane);

      const leftPaneMargin = Number.parseInt(leftPaneStyle.marginLeft) + Number.parseInt(leftPaneStyle.marginRight);
      const rightPaneMargin = Number.parseInt(rightPaneStyle.marginLeft) + Number.parseInt(rightPaneStyle.marginRight);

      const minLeftWidth = Number.parseInt(leftPaneStyle.minWidth);
      const minRightWidth = Number.parseInt(rightPaneStyle.minWidth);

      const maxLeftWidth = containerWidth - minRightWidth - rightPaneMargin - dividerWidth;
      const effectiveMinLeftWidth = minLeftWidth + leftPaneMargin;

      if (newLeftWidth >= effectiveMinLeftWidth && newLeftWidth <= maxLeftWidth) {
        const leftPixels = newLeftWidth - leftPaneMargin;
        const rightPixels = containerWidth - newLeftWidth - dividerWidth - rightPaneMargin;

        leftPane.style.flex = `0 0 ${leftPixels}px`;
        rightPane.style.flex = `0 0 ${rightPixels}px`;

        Blockly.svgResize(workspace);
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  /**
   * Shows or hides the output/code pane.
   * @param {boolean} show - true to expand the pane, false to collapse it
   */
  static showCodeDiv(show) {
    const pane = document.getElementById('outputPane');
    if (!pane) return;
    if (show) {
      pane.style.flex = '0 0 500px';
      pane.style.margin = '10px';
    } else {
      pane.style.flex = '0px';
      pane.style.margin = '1px';
    }
  }
}
